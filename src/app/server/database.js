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

    this.db.run(createUsersTable, (err) => {
      if (err) {
        console.error("Error creating users table:", err.message);
      } else {
        console.log("Users table initialized");
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
