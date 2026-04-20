const { createServer } = require("http");
const { Server } = require("socket.io");
const DatabaseManager = require("./database");

// Initialize database
const db = new DatabaseManager();

// Simple UUID generator to avoid ES module issues
function generateId() {
  return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
}

const server = createServer();
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
});

let userQueue = [];
let activeMatches = new Map(); // matchId -> {user1, user2, messages, disconnectedUsers, isPersistent}
let userSockets = new Map(); // userId -> socketId
let disconnectedUsers = new Map(); // userId -> {matchId, lastSeen, userInfo}
let registeredUsers = new Map(); // socketId -> userData (for registered users)

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Handle user registration
  socket.on("register", async (userData) => {
    try {
      const user = await db.registerUser(userData);
      socket.emit("register-success", user);
      console.log("User registered:", user.username);
    } catch (error) {
      socket.emit("register-error", { message: error.message });
      console.log("Registration failed:", error.message);
    }
  });

  // Handle user login
  socket.on("login", async (credentials) => {
    try {
      const user = await db.loginUser(
        credentials.username,
        credentials.password,
      );

      // Store registered user info
      registeredUsers.set(socket.id, user);
      socket.userId = user.id;
      socket.isRegistered = true;

      socket.emit("login-success", user);
      console.log("User logged in:", user.username);
    } catch (error) {
      socket.emit("login-error", { message: error.message });
      console.log("Login failed:", error.message);
    }
  });

  // Get persistent chats for registered user
  socket.on("get-persistent-chats", async () => {
    if (!socket.isRegistered) {
      socket.emit("persistent-chats-error", { message: "User not registered" });
      return;
    }

    try {
      const chats = await db.getUserChats(socket.userId);
      socket.emit("persistent-chats", chats);
    } catch (error) {
      socket.emit("persistent-chats-error", { message: error.message });
    }
  });

  // Load chat messages for a specific persistent chat
  socket.on("load-chat-messages", async (data) => {
    const { chatId } = data;

    if (!socket.isRegistered) {
      socket.emit("chat-messages-error", { message: "User not registered" });
      return;
    }

    try {
      const messages = await db.getChatMessages(chatId);
      socket.emit("chat-messages-loaded", { chatId, messages });
    } catch (error) {
      socket.emit("chat-messages-error", { message: error.message });
    }
  });

  // Delete a persistent chat
  socket.on("delete-persistent-chat", async (data) => {
    const { chatId } = data;

    if (!socket.isRegistered) {
      socket.emit("delete-chat-error", { message: "User not registered" });
      return;
    }

    try {
      const result = await db.deleteChatForUser(chatId, socket.userId);
      socket.emit("chat-deleted", result);
    } catch (error) {
      socket.emit("delete-chat-error", { message: error.message });
    }
  });

  // Debug: Get all users
  socket.on("debug-get-users", async () => {
    try {
      const users = await db.getAllUsers();
      socket.emit("debug-users", users);
    } catch (error) {
      console.error("Error getting users:", error);
    }
  });

  // Handle user joining queue
  socket.on("join-queue", (userData) => {
    // Check if user is already in an active match and clean it up
    if (socket.userId) {
      console.log(
        `User ${socket.userId} is joining new queue, cleaning up existing match`,
      );

      // Remove from any active matches
      for (const [matchId, match] of activeMatches.entries()) {
        if (
          match.user1.id === socket.userId ||
          match.user2.id === socket.userId
        ) {
          console.log(`Removing user from active match ${matchId}`);

          // Notify the other user that partner left
          const otherUser =
            match.user1.id === socket.userId ? match.user2 : match.user1;
          const otherSocketId = userSockets.get(otherUser.id);
          if (otherSocketId) {
            io.to(otherSocketId).emit("partner-disconnected");
          }

          // Remove the match
          activeMatches.delete(matchId);
          break;
        }
      }

      // Remove from user sockets map with old ID
      userSockets.delete(socket.userId);
    }

    const userId = generateId();
    const user = {
      id: userId,
      socketId: socket.id,
      sign: userData.sign,
      name: userData.name || `User_${Math.random().toString(36).substr(2, 5)}`,
      joinedAt: new Date(),
    };

    userSockets.set(userId, socket.id);
    userQueue.push(user);
    socket.userId = userId;

    console.log(
      `User ${user.name} (${user.sign}) joined queue. Queue length: ${userQueue.length}`,
    );
    console.log(
      "Current queue:",
      userQueue.map((u) => ({ name: u.name, id: u.id, socketId: u.socketId })),
    );
    console.log("User sockets map size:", userSockets.size);

    // Try to find a match
    findMatch(user);
  });

  // Handle cancelling queue
  socket.on("cancel-queue", () => {
    if (socket.userId) {
      // Remove user from queue
      const initialLength = userQueue.length;
      userQueue = userQueue.filter((user) => user.id !== socket.userId);
      const newLength = userQueue.length;

      if (initialLength > newLength) {
        console.log(
          `User ${socket.userId} cancelled queue. Queue length: ${newLength}`,
        );
      }
    }
  });

  // Handle sending messages
  socket.on("send-message", (data) => {
    console.log("Received message data:", data);
    console.log("Socket userId:", socket.userId);

    const { roomId, matchId, message } = data;

    // Support both roomId (client sends) and matchId for compatibility
    const actualMatchId = matchId || roomId;
    const match = activeMatches.get(actualMatchId);

    if (match) {
      console.log("Match found for message:", {
        matchId: actualMatchId,
        user1: match.user1.id,
        user2: match.user2.id,
        senderId: socket.userId,
      });

      // Verify the sender is part of this match
      if (
        match.user1.id !== socket.userId &&
        match.user2.id !== socket.userId
      ) {
        console.log("Sender not part of this match!");
        socket.emit("message-error", {
          message: "You are not part of this match",
        });
        return;
      }

      const messageData = {
        id: generateId(),
        senderId: socket.userId,
        message: message, // Use 'message' to match client expectation
        sender: socket.userId,
        timestamp: new Date().toISOString(),
      };

      // Add message to match history
      match.messages.push(messageData);

      // Save to database if it's a persistent chat
      if (match.isPersistent && socket.isRegistered) {
        const senderData = registeredUsers.get(socket.id);
        if (senderData) {
          db.saveMessage(
            actualMatchId,
            senderData.id,
            senderData.username,
            message,
          )
            .then((savedMessage) => {
              console.log(
                "Message saved to database:",
                savedMessage.message_id,
              );
            })
            .catch((error) => {
              console.error("Error saving message to database:", error.message);
            });
        }
      }

      // Send to both users in the match
      const otherUserId =
        match.user1.id === socket.userId ? match.user2.id : match.user1.id;
      const otherSocketId = userSockets.get(otherUserId);

      console.log(`Sending message from ${socket.userId} to ${otherUserId}`);
      console.log("Other user socket ID:", otherSocketId);

      if (otherSocketId) {
        io.to(otherSocketId).emit("receive-message", messageData);
        console.log("Message sent to partner");
      } else {
        console.log("Partner socket not found - they may be disconnected");
        // Store message for when they reconnect
      }

      // Echo back to sender for confirmation
      socket.emit("message-sent", messageData);
    } else {
      console.log("Match not found for matchId:", actualMatchId);
      console.log("Active matches:", Array.from(activeMatches.keys()));
      socket.emit("message-error", { message: "Match not found" });
    }
  });

  // Handle match rejoining
  socket.on("rejoin-match", (data) => {
    const { matchId } = data;
    console.log(`User ${socket.id} attempting to rejoin match ${matchId}`);

    const match = activeMatches.get(matchId);
    if (match) {
      // Find which user this is
      let userToUpdate = null;
      let otherUser = null;

      if (
        match.user1.socketId === socket.id ||
        userSockets.get(match.user1.id) === socket.id
      ) {
        userToUpdate = match.user1;
        otherUser = match.user2;
      } else if (
        match.user2.socketId === socket.id ||
        userSockets.get(match.user2.id) === socket.id
      ) {
        userToUpdate = match.user2;
        otherUser = match.user1;
      }

      if (userToUpdate) {
        // Update socket information
        userToUpdate.socketId = socket.id;
        socket.userId = userToUpdate.id;
        userSockets.set(userToUpdate.id, socket.id);

        // Remove from disconnected users if present
        disconnectedUsers.delete(userToUpdate.id);

        console.log(`User ${userToUpdate.name} rejoined match ${matchId}`);

        // Notify both users about successful rejoin
        socket.emit("match-rejoined", {
          matchId,
          partner: {
            name: otherUser.name,
            sign: otherUser.sign,
          },
          messages: match.messages,
        });

        // Notify the other user if they're online
        const otherSocketId = userSockets.get(otherUser.id);
        if (otherSocketId) {
          io.to(otherSocketId).emit("partner-reconnected", {
            partnerName: userToUpdate.name,
          });
        }
      } else {
        console.log("User not found in match");
        socket.emit("match-rejoin-failed", {
          error: "User not found in match",
        });
      }
    } else {
      console.log("Match not found for rejoin");
      socket.emit("match-rejoin-failed", { error: "Match not found" });
    }
  });

  // Handle friend invitation
  socket.on("send-friend-invitation", async (data) => {
    const { toUsername } = data;

    if (!socket.isRegistered) {
      socket.emit("friend-invitation-error", {
        message: "User not registered",
      });
      return;
    }

    try {
      const result = await db.sendFriendInvitation(socket.userId, toUsername);
      socket.emit("friend-invitation-sent", {
        toUsername: result.toUsername,
        toSign: result.toSign,
      });

      // Notify the target user if they're online
      const targetUserSocket = [...registeredUsers.entries()].find(
        ([, userData]) => userData.username === toUsername,
      );

      if (targetUserSocket) {
        const [targetSocketId] = targetUserSocket;
        io.to(targetSocketId).emit("friend-invitation-received", {
          fromUsername: result.fromUsername,
          fromSign: result.fromSign,
        });
      }

      console.log(
        `Friend invitation sent from ${result.fromUsername} to ${result.toUsername}`,
      );
    } catch (error) {
      socket.emit("friend-invitation-error", { message: error.message });
      console.log("Friend invitation failed:", error.message);
    }
  });

  // Handle getting friends data
  socket.on("get-friends-data", async () => {
    console.log(
      "get-friends-data received, isRegistered:",
      socket.isRegistered,
      "userId:",
      socket.userId,
    );

    if (!socket.isRegistered) {
      console.log("User not registered, sending error");
      socket.emit("friends-data-error", { message: "User not registered" });
      return;
    }

    try {
      console.log("Fetching friends data for user:", socket.userId);
      const friendsData = await db.getFriendsData(socket.userId);
      console.log("Friends data fetched:", friendsData);
      socket.emit("friends-data-loaded", friendsData);
    } catch (error) {
      console.log("Error loading friends data:", error.message);
      socket.emit("friends-data-error", { message: error.message });
    }
  });

  // Handle accepting friend invitation
  socket.on("accept-friend-invitation", async (data) => {
    const { fromUsername } = data;

    if (!socket.isRegistered) {
      socket.emit("accept-friend-error", { message: "User not registered" });
      return;
    }

    try {
      const result = await db.acceptFriendInvitation(
        socket.userId,
        fromUsername,
      );
      socket.emit("friend-invitation-accepted", {
        friend: result.friend,
      });

      // Notify the sender if they're online
      const senderSocket = [...registeredUsers.entries()].find(
        ([, userData]) => userData.username === fromUsername,
      );

      if (senderSocket) {
        const [senderSocketId] = senderSocket;
        const currentUser = registeredUsers.get(socket.id);
        io.to(senderSocketId).emit("friend-invitation-accepted-notification", {
          friend: {
            username: currentUser.username,
            sign: currentUser.sun_sign,
            isOnline: true,
          },
        });
      }

      console.log(
        `Friend invitation accepted: ${fromUsername} and ${
          registeredUsers.get(socket.id).username
        }`,
      );
    } catch (error) {
      socket.emit("accept-friend-error", { message: error.message });
      console.log("Error accepting friend invitation:", error.message);
    }
  });

  // Handle declining friend invitation
  socket.on("decline-friend-invitation", async (data) => {
    const { fromUsername } = data;

    if (!socket.isRegistered) {
      socket.emit("decline-friend-error", { message: "User not registered" });
      return;
    }

    try {
      await db.declineFriendInvitation(socket.userId, fromUsername);
      socket.emit("friend-invitation-declined", { fromUsername });

      console.log(
        `Friend invitation declined: ${fromUsername} to ${
          registeredUsers.get(socket.id).username
        }`,
      );
    } catch (error) {
      socket.emit("decline-friend-error", { message: error.message });
      console.log("Error declining friend invitation:", error.message);
    }
  });

  // Handle sending a chat request to a friend
  socket.on("send-chat-request", async (data) => {
    const { toUsername } = data;
    console.log(
      `Chat request received: ${socket.id} wants to chat with ${toUsername}`,
    );

    // Debug: Show all registered users
    console.log("Currently registered users:");
    registeredUsers.forEach((userData, socketId) => {
      console.log(`  ${socketId}: ${userData.username}`);
    });

    if (!socket.isRegistered) {
      console.log("Chat request rejected: User not registered");
      socket.emit("chat-request-error", { message: "User not registered" });
      return;
    }

    try {
      const currentUser = registeredUsers.get(socket.id);
      console.log("Current user sending request:", currentUser?.username);

      // Get friend user data from database
      const friendUser = await db.getUserByUsername(toUsername);

      if (!friendUser) {
        console.log("Chat request rejected: Friend user not found");
        socket.emit("chat-request-error", { message: "Friend user not found" });
        return;
      }

      console.log("Friend user found:", friendUser.username);

      // Check if they're already friends (optional check)
      // For now, allow chat requests to any user

      const requestData = {
        fromUsername: currentUser.username,
        fromSign: currentUser.zodiacChart?.sun || "Unknown",
        toUsername: toUsername,
        toSign: friendUser.sun_sign,
        timestamp: new Date().toISOString(),
      };

      // Confirm to sender
      console.log("Sending chat-request-sent to sender:", requestData);
      socket.emit("chat-request-sent", requestData);

      // Notify the target user if they're online
      const friendSocket = [...registeredUsers.entries()].find(
        ([, userData]) => userData.username === toUsername,
      );

      if (friendSocket) {
        const [friendSocketId] = friendSocket;
        console.log(
          `Friend ${toUsername} is online, sending chat-request-received to socket ${friendSocketId}`,
        );
        io.to(friendSocketId).emit("chat-request-received", {
          fromUsername: currentUser.username,
          fromSign: currentUser.zodiacChart?.sun || "Unknown",
        });
      } else {
        console.log(`Friend ${toUsername} is not online`);
      }

      console.log(
        `Chat request sent from ${currentUser.username} to ${toUsername}`,
      );
    } catch (error) {
      socket.emit("chat-request-error", { message: error.message });
      console.log("Error sending chat request:", error.message);
    }
  });

  // Handle accepting a chat request
  socket.on("accept-chat-request", async (data) => {
    const { fromUsername } = data;

    if (!socket.isRegistered) {
      socket.emit("chat-request-error", { message: "User not registered" });
      return;
    }

    try {
      const currentUser = registeredUsers.get(socket.id);
      console.log("=== CREATING MATCH FROM CHAT REQUEST ===");
      console.log("Current user (accepter):", currentUser.username);
      console.log("Requester:", fromUsername);

      // Find the requester's socket
      const requesterSocket = [...registeredUsers.entries()].find(
        ([, userData]) => userData.username === fromUsername,
      );

      if (!requesterSocket) {
        console.log("Requester not online:", fromUsername);
        socket.emit("chat-request-error", {
          message: "Requester is not online",
        });
        return;
      }

      const [requesterSocketId, requesterUser] = requesterSocket;
      console.log("Found requester user:", requesterUser.username);

      // Create a match between the two users (like queue system does)
      const matchId = generateId();
      console.log("Generated match ID:", matchId);

      // Create match object (persistent since it's from a friend request)
      const match = {
        id: matchId,
        user1: {
          id: requesterUser.id || requesterUser.username,
          name: requesterUser.username,
          sign: requesterUser.zodiacChart?.sun || "Unknown",
          socketId: requesterSocketId,
        },
        user2: {
          id: currentUser.id || currentUser.username,
          name: currentUser.username,
          sign: currentUser.zodiacChart?.sun || "Unknown",
          socketId: socket.id,
        },
        messages: [],
        createdAt: new Date(),
        isPersistent: true, // Friend matches are always persistent
        registeredUsers: {
          user1: requesterUser,
          user2: currentUser,
        },
      };

      // Add to active matches
      activeMatches.set(matchId, match);
      console.log("Added match to activeMatches:", matchId);

      // Create persistent chat in database
      try {
        const persistentChat = await db.createPersistentChat(
          requesterUser,
          currentUser,
          matchId,
        );
        console.log("Persistent chat created in DB:", persistentChat.chat_id);
      } catch (dbError) {
        console.log("DB error creating persistent chat:", dbError.message);
        // Continue anyway - the match will still work as temporary
      }

      // Send match-found events to both users (like queue system does)
      const matchDataForRequester = {
        matchId,
        isPersistent: true,
        partner: {
          name: currentUser.username,
          sign: currentUser.zodiacChart?.sun || "Unknown",
        },
      };

      const matchDataForAccepter = {
        matchId,
        isPersistent: true,
        partner: {
          name: requesterUser.username,
          sign: requesterUser.zodiacChart?.sun || "Unknown",
        },
      };

      // Emit match-found to both users
      io.to(requesterSocketId).emit("match-found", matchDataForRequester);
      socket.emit("match-found", matchDataForAccepter);

      // Clean up - notify clients to remove from chat requests
      socket.emit("chat-request-accepted", { fromUsername: fromUsername });
      io.to(requesterSocketId).emit("chat-request-accepted", {
        fromUsername: currentUser.username,
      });

      console.log(
        `Match created from chat request: ${requesterUser.username} + ${currentUser.username} [PERSISTENT]`,
      );
    } catch (error) {
      console.error("Error accepting chat request:", error.message);
      socket.emit("chat-request-error", { message: error.message });
    }
  });

  // Handle declining a chat request
  socket.on("decline-chat-request", async (data) => {
    const { fromUsername } = data;

    if (!socket.isRegistered) {
      socket.emit("chat-request-error", { message: "User not registered" });
      return;
    }

    try {
      const currentUser = registeredUsers.get(socket.id);

      // Notify the decliner
      socket.emit("chat-request-declined", { fromUsername });

      // Notify the requester if they're online
      const requesterSocket = [...registeredUsers.entries()].find(
        ([, userData]) => userData.username === fromUsername,
      );

      if (requesterSocket) {
        const [requesterSocketId] = requesterSocket;
        io.to(requesterSocketId).emit("chat-request-declined", {
          toUsername: currentUser.username,
        });
      }

      console.log(
        `Chat request declined: ${fromUsername} to ${currentUser.username}`,
      );
    } catch (error) {
      socket.emit("chat-request-error", { message: error.message });
      console.log("Error declining chat request:", error.message);
    }
  });

  // Handle starting a chat with a friend (keep for backward compatibility)
  socket.on("start-friend-chat", async (data) => {
    const { friendUsername } = data;

    if (!socket.isRegistered) {
      socket.emit("start-friend-chat-error", {
        message: "User not registered",
      });
      return;
    }

    try {
      const currentUser = registeredUsers.get(socket.id);

      // Get friend user data from database (works whether they're online or not)
      const friendUser = await db.getUserByUsername(friendUsername);

      if (!friendUser) {
        socket.emit("start-friend-chat-error", {
          message: "Friend user not found",
        });
        return;
      }

      // Create or get existing chat with this friend using proper user data
      const chatId = generateId(); // Generate unique chat ID
      const chat = await db.createPersistentChat(
        {
          id: currentUser.id,
          username: currentUser.username,
          zodiacChart: {
            sun: currentUser.zodiacChart.sun,
            moon: currentUser.zodiacChart.moon,
            rising: currentUser.zodiacChart.rising,
          },
        },
        {
          id: friendUser.id,
          username: friendUser.username,
          zodiacChart: {
            sun: friendUser.sun_sign,
            moon: friendUser.moon_sign,
            rising: friendUser.rising_sign,
          },
        },
        chatId,
      );

      socket.emit("friend-chat-started", {
        chatId: chat.id,
        chatName: chat.name,
        friendUsername: friendUsername,
      });

      // Notify friend if they're online
      const friendSocket = [...registeredUsers.entries()].find(
        ([, userData]) => userData.username === friendUsername,
      );

      if (friendSocket) {
        const [friendSocketId] = friendSocket;
        io.to(friendSocketId).emit("friend-chat-invitation", {
          chatId: chat.id,
          chatName: chat.name,
          fromUsername: currentUser.username,
        });
      }

      console.log(
        `Friend chat started between ${currentUser.username} and ${friendUsername}`,
      );
    } catch (error) {
      socket.emit("start-friend-chat-error", { message: error.message });
      console.log("Error starting friend chat:", error.message);
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Remove from queue if waiting
    userQueue = userQueue.filter((user) => user.socketId !== socket.id);

    // Remove from registered users map
    registeredUsers.delete(socket.id);

    // Handle active matches - don't immediately remove, mark as disconnected
    for (const [matchId, match] of activeMatches.entries()) {
      if (
        match.user1.socketId === socket.id ||
        match.user2.socketId === socket.id
      ) {
        const disconnectedUser =
          match.user1.socketId === socket.id ? match.user1 : match.user2;
        const otherUser =
          match.user1.socketId === socket.id ? match.user2 : match.user1;

        // Store disconnected user info for potential reconnection
        disconnectedUsers.set(disconnectedUser.id, {
          matchId,
          lastSeen: new Date(),
          userInfo: disconnectedUser,
        });

        console.log(
          `User ${disconnectedUser.name} disconnected from match ${matchId}`,
        );

        // Notify the other user
        const otherSocketId = userSockets.get(otherUser.id);
        if (otherSocketId) {
          io.to(otherSocketId).emit("partner-disconnected");
        }

        // For persistent chats, don't remove the match - just mark as disconnected
        // For temporary chats, use the existing timeout logic
        if (!match.isPersistent) {
          setTimeout(
            () => {
              // Check if user has reconnected
              if (disconnectedUsers.has(disconnectedUser.id)) {
                console.log(
                  `Removing stale temporary match ${matchId} after timeout`,
                );
                activeMatches.delete(matchId);
                disconnectedUsers.delete(disconnectedUser.id);

                // Notify the other user if still connected
                const stillConnectedSocketId = userSockets.get(otherUser.id);
                if (stillConnectedSocketId) {
                  io.to(stillConnectedSocketId).emit("match-expired", {
                    message:
                      "Your chat partner did not reconnect in time. You can start a new match.",
                  });
                }
              }
            },
            5 * 60 * 1000,
          ); // 5 minutes timeout for temporary chats
        }

        break;
      }
    }

    // Remove from user sockets map
    if (socket.userId) {
      userSockets.delete(socket.userId);
    }
  });
});

function findMatch(newUser) {
  // Look for a suitable match in the queue
  const potentialMatches = userQueue.filter(
    (user) => user.id !== newUser.id && user.socketId !== newUser.socketId,
  );

  console.log(`Finding match for ${newUser.name}:`);
  console.log(
    "Potential matches:",
    potentialMatches.map((u) => ({ name: u.name, id: u.id })),
  );

  if (potentialMatches.length > 0) {
    // For now, just match with the first person in queue
    // Later we can add compatibility-based matching
    const matchedUser = potentialMatches[0];
    console.log(`Matching ${newUser.name} with ${matchedUser.name}`);

    // Remove both users from queue
    userQueue = userQueue.filter(
      (user) => user.id !== newUser.id && user.id !== matchedUser.id,
    );

    // Create a match
    const matchId = generateId();

    // Check if both users are registered for potential persistent chat capability
    const user1RegisteredData = registeredUsers.get(newUser.socketId);
    const user2RegisteredData = registeredUsers.get(matchedUser.socketId);

    // For now, create temporary matches by default to allow users to have temporary conversations
    // They can later choose to make it persistent if they want to continue the conversation
    const isPersistent = false; // Always create temporary matches initially

    const match = {
      id: matchId,
      user1: newUser,
      user2: matchedUser,
      messages: [],
      createdAt: new Date(),
      isPersistent: isPersistent,
      registeredUsers:
        user1RegisteredData && user2RegisteredData
          ? {
              user1: user1RegisteredData,
              user2: user2RegisteredData,
            }
          : null,
    };

    activeMatches.set(matchId, match);

    // Don't create persistent chat in database for temporary matches
    // Users can later convert temporary matches to persistent if they choose
    if (isPersistent && user1RegisteredData && user2RegisteredData) {
      db.createPersistentChat(user1RegisteredData, user2RegisteredData, matchId)
        .then((persistentChat) => {
          console.log("Persistent chat created:", persistentChat.chat_id);
        })
        .catch((error) => {
          console.error("Error creating persistent chat:", error.message);
        });
    }

    // Notify both users
    const user1Socket = userSockets.get(newUser.id);
    const user2Socket = userSockets.get(matchedUser.id);

    if (user1Socket && user2Socket) {
      const matchData = {
        matchId,
        isPersistent,
        partner: {
          name: matchedUser.name,
          sign: matchedUser.sign,
        },
      };

      const matchData2 = {
        matchId,
        isPersistent,
        partner: {
          name: newUser.name,
          sign: newUser.sign,
        },
      };

      io.to(user1Socket).emit("match-found", matchData);
      io.to(user2Socket).emit("match-found", matchData2);

      console.log(
        `Match created: ${newUser.name} (${newUser.sign}) + ${
          matchedUser.name
        } (${matchedUser.sign}) ${
          isPersistent ? "[PERSISTENT]" : "[TEMPORARY]"
        }`,
      );
    }
  } else {
    // No matches available, user stays in queue
    console.log(`No matches for ${newUser.name}, staying in queue`);
  }
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
  console.log("Waiting for connections...");
});
