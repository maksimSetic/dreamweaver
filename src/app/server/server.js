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
    origin: "*",
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
        credentials.password
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
      `User ${user.name} (${user.sign}) joined queue. Queue length: ${userQueue.length}`
    );
    console.log(
      "Current queue:",
      userQueue.map((u) => ({ name: u.name, id: u.id, socketId: u.socketId }))
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
          `User ${socket.userId} cancelled queue. Queue length: ${newLength}`
        );
      }
    }
  });

  // Handle sending messages
  socket.on("send-message", (data) => {
    console.log("Received message data:", data);
    const { roomId, matchId, message } = data;

    // Support both roomId (client sends) and matchId for compatibility
    const actualMatchId = matchId || roomId;
    const match = activeMatches.get(actualMatchId);

    if (match) {
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
            message
          )
            .then((savedMessage) => {
              console.log(
                "Message saved to database:",
                savedMessage.message_id
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
    }
  });

  // Handle match rejoining
  socket.on("rejoin-match", (data) => {
    const { matchId, userInfo } = data;
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
          `User ${disconnectedUser.name} disconnected from match ${matchId}`
        );

        // Notify the other user
        const otherSocketId = userSockets.get(otherUser.id);
        if (otherSocketId) {
          io.to(otherSocketId).emit("partner-disconnected");
        }

        // For persistent chats, don't remove the match - just mark as disconnected
        // For temporary chats, use the existing timeout logic
        if (!match.isPersistent) {
          setTimeout(() => {
            // Check if user has reconnected
            if (disconnectedUsers.has(disconnectedUser.id)) {
              console.log(
                `Removing stale temporary match ${matchId} after timeout`
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
          }, 5 * 60 * 1000); // 5 minutes timeout for temporary chats
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
    (user) => user.id !== newUser.id && user.socketId !== newUser.socketId
  );

  console.log(`Finding match for ${newUser.name}:`);
  console.log(
    "Potential matches:",
    potentialMatches.map((u) => ({ name: u.name, id: u.id }))
  );

  if (potentialMatches.length > 0) {
    // For now, just match with the first person in queue
    // Later we can add compatibility-based matching
    const matchedUser = potentialMatches[0];
    console.log(`Matching ${newUser.name} with ${matchedUser.name}`);

    // Remove both users from queue
    userQueue = userQueue.filter(
      (user) => user.id !== newUser.id && user.id !== matchedUser.id
    );

    // Create a match
    const matchId = generateId();

    // Check if both users are registered for persistent chat
    const user1RegisteredData = registeredUsers.get(newUser.socketId);
    const user2RegisteredData = registeredUsers.get(matchedUser.socketId);
    const isPersistent = user1RegisteredData && user2RegisteredData;

    const match = {
      id: matchId,
      user1: newUser,
      user2: matchedUser,
      messages: [],
      createdAt: new Date(),
      isPersistent: isPersistent,
      registeredUsers: isPersistent
        ? {
            user1: user1RegisteredData,
            user2: user2RegisteredData,
          }
        : null,
    };

    activeMatches.set(matchId, match);

    // Create persistent chat in database if both users are registered
    if (isPersistent) {
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
        }`
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
