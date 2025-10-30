const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcrypt");
const path = require("path");

class DatabaseManager {
  constructor() {
    // Create database in the server directory
    const dbPath = path.join(__dirname, "dreamweaver.db");
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error("Error opening database:", err.message);
      } else {
        console.log("Connected to SQLite database at:", dbPath);
        this.initializeDatabase();
      }
    });
  }

  initializeDatabase() {
    // Create users table
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        sun_sign TEXT NOT NULL,
        moon_sign TEXT NOT NULL,
        rising_sign TEXT NOT NULL,
        birth_date TEXT NOT NULL,
        birth_time TEXT NOT NULL,
        birth_location TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `;

    // Create persistent chats table
    const createChatsTable = `
      CREATE TABLE IF NOT EXISTS persistent_chats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chat_id TEXT UNIQUE NOT NULL,
        user1_id INTEGER NOT NULL,
        user2_id INTEGER NOT NULL,
        user1_username TEXT NOT NULL,
        user2_username TEXT NOT NULL,
        user1_sign TEXT NOT NULL,
        user2_sign TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_message_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_by_user1 BOOLEAN DEFAULT FALSE,
        deleted_by_user2 BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (user1_id) REFERENCES users (id),
        FOREIGN KEY (user2_id) REFERENCES users (id)
      )
    `;

    // Create chat messages table
    const createMessagesTable = `
      CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id TEXT UNIQUE NOT NULL,
        chat_id TEXT NOT NULL,
        sender_id INTEGER NOT NULL,
        sender_username TEXT NOT NULL,
        message_text TEXT NOT NULL,
        message_type TEXT DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES persistent_chats (chat_id),
        FOREIGN KEY (sender_id) REFERENCES users (id)
      )
    `;

    // Create friendships table
    const createFriendshipsTable = `
      CREATE TABLE IF NOT EXISTS friendships (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user1_id INTEGER NOT NULL,
        user2_id INTEGER NOT NULL,
        user1_username TEXT NOT NULL,
        user2_username TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        requester_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        accepted_at DATETIME,
        FOREIGN KEY (user1_id) REFERENCES users (id),
        FOREIGN KEY (user2_id) REFERENCES users (id),
        FOREIGN KEY (requester_id) REFERENCES users (id),
        UNIQUE(user1_id, user2_id)
      )
    `;

    this.db.run(createUsersTable, (err) => {
      if (err) {
        console.error("Error creating users table:", err.message);
      } else {
        console.log("Users table initialized");
      }
    });

    this.db.run(createChatsTable, (err) => {
      if (err) {
        console.error("Error creating chats table:", err.message);
      } else {
        console.log("Persistent chats table initialized");
      }
    });

    this.db.run(createMessagesTable, (err) => {
      if (err) {
        console.error("Error creating messages table:", err.message);
      } else {
        console.log("Chat messages table initialized");
      }
    });

    this.db.run(createFriendshipsTable, (err) => {
      if (err) {
        console.error("Error creating friendships table:", err.message);
      } else {
        console.log("Friendships table initialized");
      }
    });
  }

  // Register a new user
  async registerUser(userData) {
    return new Promise((resolve, reject) => {
      const { username, password, zodiacChart } = userData;

      // Hash password
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          reject(new Error("Password hashing failed"));
          return;
        }

        const insertUser = `
          INSERT INTO users (
            username, password_hash, sun_sign, moon_sign, rising_sign,
            birth_date, birth_time, birth_location
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        this.db.run(
          insertUser,
          [
            username,
            hash,
            zodiacChart.sun,
            zodiacChart.moon,
            zodiacChart.rising,
            zodiacChart.birthInfo.date,
            zodiacChart.birthInfo.time,
            zodiacChart.birthInfo.location,
          ],
          function (err) {
            if (err) {
              if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
                reject(new Error("Username already exists"));
              } else {
                reject(new Error("Registration failed: " + err.message));
              }
            } else {
              resolve({
                id: this.lastID,
                username,
                zodiacChart,
                createdAt: new Date().toISOString(),
              });
            }
          }
        );
      });
    });
  }

  // Login user
  async loginUser(username, password) {
    return new Promise((resolve, reject) => {
      const selectUser = `
        SELECT id, username, password_hash, sun_sign, moon_sign, rising_sign,
               birth_date, birth_time, birth_location, created_at
        FROM users WHERE username = ?
      `;

      this.db.get(selectUser, [username], (err, row) => {
        if (err) {
          reject(new Error("Login query failed: " + err.message));
          return;
        }

        if (!row) {
          reject(new Error("User not found"));
          return;
        }

        // Compare password
        bcrypt.compare(password, row.password_hash, (err, match) => {
          if (err) {
            reject(new Error("Password comparison failed"));
            return;
          }

          if (!match) {
            reject(new Error("Invalid password"));
            return;
          }

          // Update last login
          this.db.run(
            "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
            [row.id]
          );

          // Return user data
          resolve({
            id: row.id,
            username: row.username,
            zodiacChart: {
              sun: row.sun_sign,
              moon: row.moon_sign,
              rising: row.rising_sign,
              birthInfo: {
                date: row.birth_date,
                time: row.birth_time,
                location: row.birth_location,
              },
            },
            createdAt: row.created_at,
          });
        });
      });
    });
  }

  // Get all users (for debugging)
  async getAllUsers() {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT id, username, sun_sign, moon_sign, rising_sign, created_at FROM users",
        [],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  // Get user by username
  async getUserByUsername(username) {
    return new Promise((resolve, reject) => {
      const selectUser = `
        SELECT id, username, sun_sign, moon_sign, rising_sign, created_at
        FROM users 
        WHERE username = ?
      `;

      this.db.get(selectUser, [username], (err, row) => {
        if (err) {
          reject(new Error("Database error: " + err.message));
          return;
        }

        if (!row) {
          reject(new Error("User not found"));
          return;
        }

        resolve({
          id: row.id,
          username: row.username,
          sun_sign: row.sun_sign,
          moon_sign: row.moon_sign,
          rising_sign: row.rising_sign,
          created_at: row.created_at,
        });
      });
    });
  }

  // Create or get a persistent chat between two registered users
  async createPersistentChat(user1Data, user2Data, chatId) {
    return new Promise((resolve, reject) => {
      // Validate that chatId is provided
      if (!chatId) {
        reject(new Error("Chat ID is required for creating persistent chat"));
        return;
      }

      console.log("Creating persistent chat with:");
      console.log("User1 data:", JSON.stringify(user1Data, null, 2));
      console.log("User2 data:", JSON.stringify(user2Data, null, 2));
      console.log("Chat ID:", chatId);

      // Check if chat already exists between these users
      const checkExisting = `
        SELECT * FROM persistent_chats 
        WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
        AND deleted_by_user1 = FALSE AND deleted_by_user2 = FALSE
      `;

      this.db.get(
        checkExisting,
        [user1Data.id, user2Data.id, user2Data.id, user1Data.id],
        (err, existingChat) => {
          if (err) {
            reject(new Error("Error checking existing chat: " + err.message));
            return;
          }

          if (existingChat) {
            // Chat already exists, return it
            resolve(existingChat);
            return;
          }

          // Create new persistent chat
          const insertChat = `
          INSERT INTO persistent_chats (
            chat_id, user1_id, user2_id, user1_username, user2_username,
            user1_sign, user2_sign
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

          // Extract zodiac signs with fallbacks
          const user1Sign =
            user1Data.zodiacChart?.sun || user1Data.sun_sign || "Unknown";
          const user2Sign =
            user2Data.zodiacChart?.sun || user2Data.sun_sign || "Unknown";

          console.log(
            "Extracted signs - User1:",
            user1Sign,
            "User2:",
            user2Sign
          );

          this.db.run(
            insertChat,
            [
              chatId,
              user1Data.id,
              user2Data.id,
              user1Data.username,
              user2Data.username,
              user1Sign,
              user2Sign,
            ],
            function (err) {
              if (err) {
                reject(
                  new Error("Failed to create persistent chat: " + err.message)
                );
              } else {
                resolve({
                  id: this.lastID,
                  chat_id: chatId,
                  user1_id: user1Data.id,
                  user2_id: user2Data.id,
                  user1_username: user1Data.username,
                  user2_username: user2Data.username,
                  user1_sign: user1Sign,
                  user2_sign: user2Sign,
                  created_at: new Date().toISOString(),
                });
              }
            }
          );
        }
      );
    });
  }

  // Get all persistent chats for a user
  async getUserChats(userId) {
    return new Promise((resolve, reject) => {
      const selectChats = `
        SELECT * FROM persistent_chats 
        WHERE (user1_id = ? AND deleted_by_user1 = FALSE) 
           OR (user2_id = ? AND deleted_by_user2 = FALSE)
        ORDER BY last_message_at DESC
      `;

      this.db.all(selectChats, [userId, userId], (err, rows) => {
        if (err) {
          reject(new Error("Error fetching user chats: " + err.message));
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Save a message to persistent chat
  async saveMessage(
    chatId,
    senderId,
    senderUsername,
    messageText,
    messageType = "user"
  ) {
    return new Promise((resolve, reject) => {
      const messageId = `msg_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      const insertMessage = `
        INSERT INTO chat_messages (
          message_id, chat_id, sender_id, sender_username, message_text, message_type
        ) VALUES (?, ?, ?, ?, ?, ?)
      `;

      const db = this.db; // Store reference to avoid context issues

      db.run(
        insertMessage,
        [messageId, chatId, senderId, senderUsername, messageText, messageType],
        function (err) {
          if (err) {
            reject(new Error("Failed to save message: " + err.message));
          } else {
            const insertedId = this.lastID; // 'this' here refers to the statement

            // Update last_message_at in persistent_chats
            const updateChat = `
              UPDATE persistent_chats 
              SET last_message_at = CURRENT_TIMESTAMP 
              WHERE chat_id = ?
            `;

            db.run(updateChat, [chatId], (updateErr) => {
              if (updateErr) {
                console.error(
                  "Error updating chat timestamp:",
                  updateErr.message
                );
              }
            });

            resolve({
              id: insertedId,
              message_id: messageId,
              chat_id: chatId,
              sender_id: senderId,
              sender_username: senderUsername,
              message_text: messageText,
              message_type: messageType,
              created_at: new Date().toISOString(),
            });
          }
        }
      );
    });
  }

  // Get messages for a chat
  async getChatMessages(chatId, limit = 50) {
    return new Promise((resolve, reject) => {
      const selectMessages = `
        SELECT * FROM chat_messages 
        WHERE chat_id = ? 
        ORDER BY created_at ASC 
        LIMIT ?
      `;

      this.db.all(selectMessages, [chatId, limit], (err, rows) => {
        if (err) {
          reject(new Error("Error fetching chat messages: " + err.message));
        } else {
          resolve(rows);
        }
      });
    });
  }

  // Delete a chat for a specific user
  async deleteChatForUser(chatId, userId) {
    return new Promise((resolve, reject) => {
      // First check which user is deleting
      const getChat = `SELECT * FROM persistent_chats WHERE chat_id = ?`;

      this.db.get(getChat, [chatId], (err, chat) => {
        if (err) {
          reject(new Error("Error finding chat: " + err.message));
          return;
        }

        if (!chat) {
          reject(new Error("Chat not found"));
          return;
        }

        let updateQuery;
        if (chat.user1_id === userId) {
          updateQuery = `UPDATE persistent_chats SET deleted_by_user1 = TRUE WHERE chat_id = ?`;
        } else if (chat.user2_id === userId) {
          updateQuery = `UPDATE persistent_chats SET deleted_by_user2 = TRUE WHERE chat_id = ?`;
        } else {
          reject(new Error("User not part of this chat"));
          return;
        }

        const db = this.db; // Store reference to avoid context issues

        db.run(updateQuery, [chatId], function (err) {
          if (err) {
            reject(new Error("Failed to delete chat: " + err.message));
          } else {
            // Check if both users have deleted the chat
            const checkBothDeleted = `
              SELECT * FROM persistent_chats 
              WHERE chat_id = ? AND deleted_by_user1 = TRUE AND deleted_by_user2 = TRUE
            `;

            db.get(checkBothDeleted, [chatId], (err, deletedChat) => {
              if (deletedChat) {
                // Both users deleted, remove messages and chat record
                db.run(`DELETE FROM chat_messages WHERE chat_id = ?`, [chatId]);
                db.run(`DELETE FROM persistent_chats WHERE chat_id = ?`, [
                  chatId,
                ]);
              }
              resolve({ success: true, chatId });
            });
          }
        });
      });
    });
  }

  // Close database connection
  close() {
    this.db.close((err) => {
      if (err) {
        console.error("Error closing database:", err.message);
      } else {
        console.log("Database connection closed");
      }
    });
  }

  // Friends methods
  async sendFriendInvitation(fromUserId, toUsername) {
    return new Promise((resolve, reject) => {
      // First check if the target user exists
      const findUserQuery = `SELECT id, username, sun_sign FROM users WHERE username = ?`;

      this.db.get(findUserQuery, [toUsername], (err, toUser) => {
        if (err) {
          reject(new Error("Database error: " + err.message));
          return;
        }

        if (!toUser) {
          reject(new Error("User not found"));
          return;
        }

        if (toUser.id === fromUserId) {
          reject(new Error("Cannot send friend invitation to yourself"));
          return;
        }

        // Check if friendship already exists
        const checkFriendshipQuery = `
          SELECT * FROM friendships 
          WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)
        `;

        this.db.get(
          checkFriendshipQuery,
          [fromUserId, toUser.id, toUser.id, fromUserId],
          (err, existingFriendship) => {
            if (err) {
              reject(new Error("Database error: " + err.message));
              return;
            }

            if (existingFriendship) {
              if (existingFriendship.status === "accepted") {
                reject(new Error("You are already friends"));
              } else {
                reject(new Error("Friend invitation already sent"));
              }
              return;
            }

            // Get the sender's info
            const getSenderQuery = `SELECT username, sun_sign FROM users WHERE id = ?`;
            this.db.get(getSenderQuery, [fromUserId], (err, fromUser) => {
              if (err) {
                reject(new Error("Database error: " + err.message));
                return;
              }

              // Create friendship record
              const insertFriendshipQuery = `
              INSERT INTO friendships (user1_id, user2_id, user1_username, user2_username, requester_id, status)
              VALUES (?, ?, ?, ?, ?, 'pending')
            `;

              this.db.run(
                insertFriendshipQuery,
                [
                  fromUserId,
                  toUser.id,
                  fromUser.username,
                  toUser.username,
                  fromUserId,
                ],
                function (err) {
                  if (err) {
                    reject(
                      new Error(
                        "Failed to send friend invitation: " + err.message
                      )
                    );
                  } else {
                    resolve({
                      id: this.lastID,
                      fromUsername: fromUser.username,
                      fromSign: fromUser.sun_sign,
                      toUsername: toUser.username,
                      toSign: toUser.sun_sign,
                    });
                  }
                }
              );
            });
          }
        );
      });
    });
  }

  async getFriendsData(userId) {
    return new Promise((resolve, reject) => {
      // Get accepted friends
      const friendsQuery = `
        SELECT 
          f.*,
          CASE 
            WHEN f.user1_id = ? THEN u2.username 
            ELSE u1.username 
          END as friend_username,
          CASE 
            WHEN f.user1_id = ? THEN u2.sun_sign 
            ELSE u1.sun_sign 
          END as friend_sign
        FROM friendships f
        JOIN users u1 ON f.user1_id = u1.id
        JOIN users u2 ON f.user2_id = u2.id
        WHERE (f.user1_id = ? OR f.user2_id = ?) AND f.status = 'accepted'
      `;

      // Get pending invitations received
      const pendingReceivedQuery = `
        SELECT f.*, u.username as fromUsername, u.sun_sign as fromSign
        FROM friendships f
        JOIN users u ON f.requester_id = u.id
        WHERE f.user2_id = ? AND f.status = 'pending' AND f.requester_id != ?
      `;

      // Get pending invitations sent
      const pendingSentQuery = `
        SELECT f.*, u.username as toUsername, u.sun_sign as toSign
        FROM friendships f
        JOIN users u ON (CASE WHEN f.user1_id = f.requester_id THEN f.user2_id ELSE f.user1_id END) = u.id
        WHERE f.requester_id = ? AND f.status = 'pending'
      `;

      this.db.all(
        friendsQuery,
        [userId, userId, userId, userId],
        (err, friends) => {
          if (err) {
            reject(new Error("Error fetching friends: " + err.message));
            return;
          }

          this.db.all(
            pendingReceivedQuery,
            [userId, userId],
            (err, pendingReceived) => {
              if (err) {
                reject(
                  new Error(
                    "Error fetching pending invitations: " + err.message
                  )
                );
                return;
              }

              this.db.all(pendingSentQuery, [userId], (err, pendingSent) => {
                if (err) {
                  reject(
                    new Error("Error fetching sent invitations: " + err.message)
                  );
                  return;
                }

                resolve({
                  friends: friends.map((f) => ({
                    username: f.friend_username,
                    sign: f.friend_sign,
                    isOnline: false, // TODO: Implement online status
                  })),
                  pendingInvitations: pendingReceived.map((p) => ({
                    fromUsername: p.fromUsername,
                    fromSign: p.fromSign,
                  })),
                  sentInvitations: pendingSent.map((s) => ({
                    toUsername: s.toUsername,
                    toSign: s.toSign,
                  })),
                });
              });
            }
          );
        }
      );
    });
  }

  async acceptFriendInvitation(userId, fromUsername) {
    return new Promise((resolve, reject) => {
      // Find the pending friendship
      const findPendingQuery = `
        SELECT f.*, u.id as from_user_id, u.sun_sign as from_sign
        FROM friendships f
        JOIN users u ON f.requester_id = u.id
        WHERE f.user2_id = ? AND u.username = ? AND f.status = 'pending'
      `;

      this.db.get(
        findPendingQuery,
        [userId, fromUsername],
        (err, friendship) => {
          if (err) {
            reject(new Error("Database error: " + err.message));
            return;
          }

          if (!friendship) {
            reject(new Error("Friend invitation not found"));
            return;
          }

          // Update status to accepted
          const updateQuery = `
          UPDATE friendships 
          SET status = 'accepted', accepted_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `;

          this.db.run(updateQuery, [friendship.id], (err) => {
            if (err) {
              reject(
                new Error("Failed to accept friend invitation: " + err.message)
              );
            } else {
              resolve({
                friend: {
                  username: fromUsername,
                  sign: friendship.from_sign,
                  isOnline: false,
                },
              });
            }
          });
        }
      );
    });
  }

  async declineFriendInvitation(userId, fromUsername) {
    return new Promise((resolve, reject) => {
      // Find and delete the pending friendship
      const deleteQuery = `
        DELETE FROM friendships 
        WHERE user2_id = ? AND requester_id = (SELECT id FROM users WHERE username = ?) AND status = 'pending'
      `;

      this.db.run(deleteQuery, [userId, fromUsername], function (err) {
        if (err) {
          reject(
            new Error("Failed to decline friend invitation: " + err.message)
          );
        } else if (this.changes === 0) {
          reject(new Error("Friend invitation not found"));
        } else {
          resolve({ fromUsername });
        }
      });
    });
  }
}

module.exports = DatabaseManager;
