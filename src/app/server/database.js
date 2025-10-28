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

  // Create or get a persistent chat between two registered users
  async createPersistentChat(user1Data, user2Data, chatId) {
    return new Promise((resolve, reject) => {
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

          this.db.run(
            insertChat,
            [
              chatId,
              user1Data.id,
              user2Data.id,
              user1Data.username,
              user2Data.username,
              user1Data.zodiacChart.sun,
              user2Data.zodiacChart.sun,
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
                  user1_sign: user1Data.zodiacChart.sun,
                  user2_sign: user2Data.zodiacChart.sun,
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

      this.db.run(
        insertMessage,
        [messageId, chatId, senderId, senderUsername, messageText, messageType],
        function (err) {
          if (err) {
            reject(new Error("Failed to save message: " + err.message));
          } else {
            // Update last_message_at in persistent_chats
            const updateChat = `
              UPDATE persistent_chats 
              SET last_message_at = CURRENT_TIMESTAMP 
              WHERE chat_id = ?
            `;

            this.db.run(updateChat, [chatId], (updateErr) => {
              if (updateErr) {
                console.error(
                  "Error updating chat timestamp:",
                  updateErr.message
                );
              }
            });

            resolve({
              id: this.lastID,
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

        this.db.run(updateQuery, [chatId], function (err) {
          if (err) {
            reject(new Error("Failed to delete chat: " + err.message));
          } else {
            // Check if both users have deleted the chat
            const checkBothDeleted = `
              SELECT * FROM persistent_chats 
              WHERE chat_id = ? AND deleted_by_user1 = TRUE AND deleted_by_user2 = TRUE
            `;

            this.db.get(checkBothDeleted, [chatId], (err, deletedChat) => {
              if (deletedChat) {
                // Both users deleted, remove messages and chat record
                this.db.run(`DELETE FROM chat_messages WHERE chat_id = ?`, [
                  chatId,
                ]);
                this.db.run(`DELETE FROM persistent_chats WHERE chat_id = ?`, [
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
}

module.exports = DatabaseManager;
