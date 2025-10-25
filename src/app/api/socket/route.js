import { Server } from "socket.io";
import { v4 as uuidv4 } from "uuid";

let io;
let userQueue = [];
let activeMatches = new Map(); // matchId -> {user1, user2, messages}
let userSockets = new Map(); // userId -> socketId

export async function GET() {
  if (!io) {
    // Initialize Socket.IO server
    const { createServer } = await import("http");
    const server = createServer();

    io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      // Handle user joining queue
      socket.on("join-queue", (userData) => {
        const userId = uuidv4();
        const user = {
          id: userId,
          socketId: socket.id,
          sign: userData.sign,
          name:
            userData.name || `User_${Math.random().toString(36).substr(2, 5)}`,
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

      // Handle sending messages
      socket.on("send-message", (data) => {
        const { matchId, message } = data;
        const match = activeMatches.get(matchId);

        if (match) {
          const messageData = {
            id: uuidv4(),
            senderId: socket.userId,
            text: message,
            timestamp: new Date().toISOString(),
          };

          // Add message to match history
          match.messages.push(messageData);

          // Send to both users in the match
          const otherUserId =
            match.user1.id === socket.userId ? match.user2.id : match.user1.id;
          const otherSocketId = userSockets.get(otherUserId);

          if (otherSocketId) {
            io.to(otherSocketId).emit("receive-message", messageData);
          }

          // Echo back to sender for confirmation
          socket.emit("message-sent", messageData);
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

    // Start server on port 3001 (separate from Next.js)
    server.listen(3001, () => {
      console.log("Socket.IO server running on port 3001");
    });
  }

  return new Response("Socket.IO server initialized", { status: 200 });
}

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
    const matchId = uuidv4();
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
