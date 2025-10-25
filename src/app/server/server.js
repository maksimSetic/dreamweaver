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
let activeMatches = new Map(); // matchId -> {user1, user2, messages}
let userSockets = new Map(); // userId -> socketId

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
      socket.emit("login-success", user);
      console.log("User logged in:", user.username);
    } catch (error) {
      socket.emit("login-error", { message: error.message });
      console.log("Login failed:", error.message);
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

      // Send to both users in the match
      const otherUserId =
        match.user1.id === socket.userId ? match.user2.id : match.user1.id;
      const otherSocketId = userSockets.get(otherUserId);

      console.log(`Sending message from ${socket.userId} to ${otherUserId}`);

      if (otherSocketId) {
        io.to(otherSocketId).emit("receive-message", messageData);
        console.log("Message sent to partner");
      } else {
        console.log("Partner socket not found");
      }

      // Echo back to sender for confirmation
      socket.emit("message-sent", messageData);
    } else {
      console.log("Match not found for matchId:", actualMatchId);
      console.log("Active matches:", Array.from(activeMatches.keys()));
    }
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    // Remove from queue if waiting
    userQueue = userQueue.filter((user) => user.socketId !== socket.id);

    // Remove from user sockets map
    if (socket.userId) {
      userSockets.delete(socket.userId);
    }

    // Handle active matches
    for (const [matchId, match] of activeMatches.entries()) {
      if (
        match.user1.socketId === socket.id ||
        match.user2.socketId === socket.id
      ) {
        // Notify the other user
        const otherUser =
          match.user1.socketId === socket.id ? match.user2 : match.user1;
        const otherSocketId = userSockets.get(otherUser.id);

        if (otherSocketId) {
          io.to(otherSocketId).emit("partner-disconnected");
        }

        // Remove the match
        activeMatches.delete(matchId);
        break;
      }
    }
  });
});

function findMatch(newUser) {
  // Look for a suitable match in the queue
  const potentialMatches = userQueue.filter(
    (user) => user.id !== newUser.id && user.socketId !== newUser.socketId
  );

  if (potentialMatches.length > 0) {
    // For now, just match with the first person in queue
    // Later we can add compatibility-based matching
    const matchedUser = potentialMatches[0];

    // Remove both users from queue
    userQueue = userQueue.filter(
      (user) => user.id !== newUser.id && user.id !== matchedUser.id
    );

    // Create a match
    const matchId = generateId();
    const match = {
      id: matchId,
      user1: newUser,
      user2: matchedUser,
      messages: [],
      createdAt: new Date(),
    };

    activeMatches.set(matchId, match);

    // Notify both users
    const user1Socket = userSockets.get(newUser.id);
    const user2Socket = userSockets.get(matchedUser.id);

    if (user1Socket && user2Socket) {
      io.to(user1Socket).emit("match-found", {
        matchId,
        partner: {
          name: matchedUser.name,
          sign: matchedUser.sign,
        },
      });

      io.to(user2Socket).emit("match-found", {
        matchId,
        partner: {
          name: newUser.name,
          sign: newUser.sign,
        },
      });

      console.log(
        `Match created: ${newUser.name} (${newUser.sign}) + ${matchedUser.name} (${matchedUser.sign})`
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
