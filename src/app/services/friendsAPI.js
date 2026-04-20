// Friends API Service
// This file contains implementations that connect to the real server

import { io } from "socket.io-client";

class FriendsAPI {
  constructor() {
    // Mock friendships data (this will be replaced with real backend later)
    this.mockFriendships = new Map();
    this.mockFriendRequests = new Map();

    // Real users from server
    this.serverUsers = [];
    this.socket = null;
    this.isConnected = false;

    // Load persisted data from localStorage
    this.loadPersistedData();

    this.initializeSocket();
  }

  // Initialize socket connection to get real users
  initializeSocket() {
    const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    this.socket = io(SOCKET_URL);

    this.socket.on("connect", () => {
      this.isConnected = true;
      console.log("FriendsAPI connected to server");
      this.loadServerUsers();
    });

    this.socket.on("disconnect", () => {
      this.isConnected = false;
      console.log("FriendsAPI disconnected from server");
    });

    this.socket.on("debug-users", (users) => {
      console.log("Received users from server:", users);
      this.serverUsers = users.map((user) => ({
        id: user.id,
        username: user.username,
        zodiacChart: {
          sun: user.sun_sign,
          moon: user.moon_sign,
          rising: user.rising_sign,
        },
        status: "online", // Default status
        lastSeen: null,
        registeredAt: user.created_at,
      }));
      console.log("Processed server users:", this.serverUsers);
    });
  }

  // Load persisted friendships and requests from localStorage
  loadPersistedData() {
    try {
      // Load friendships
      const friendshipsData = localStorage.getItem("dreamweaver_friendships");
      if (friendshipsData) {
        const friendshipsObj = JSON.parse(friendshipsData);
        this.mockFriendships = new Map(
          Object.entries(friendshipsObj).map(([k, v]) => [parseInt(k), v])
        );
      }

      // Load friend requests
      const requestsData = localStorage.getItem("dreamweaver_friend_requests");
      if (requestsData) {
        const requestsObj = JSON.parse(requestsData);
        this.mockFriendRequests = new Map(
          Object.entries(requestsObj).map(([k, v]) => [parseInt(k), v])
        );
      }

      console.log("Loaded persisted data:", {
        friendships: this.mockFriendships,
        requests: this.mockFriendRequests,
      });
    } catch (error) {
      console.error("Error loading persisted data:", error);
    }
  }

  // Save friendships and requests to localStorage
  savePersistedData() {
    try {
      // Save friendships
      const friendshipsObj = Object.fromEntries(this.mockFriendships);
      localStorage.setItem(
        "dreamweaver_friendships",
        JSON.stringify(friendshipsObj)
      );

      // Save friend requests
      const requestsObj = Object.fromEntries(this.mockFriendRequests);
      localStorage.setItem(
        "dreamweaver_friend_requests",
        JSON.stringify(requestsObj)
      );

      console.log("Saved persisted data to localStorage");
    } catch (error) {
      console.error("Error saving persisted data:", error);
    }
  }

  // Force reload persisted data from localStorage
  reloadPersistedData() {
    console.log("Force reloading persisted data from localStorage...");
    this.loadPersistedData();
  }

  // Load users from server
  async loadServerUsers() {
    if (this.socket && this.isConnected) {
      console.log("Requesting users from server...");
      this.socket.emit("debug-get-users");
    }
  }

  // Simulate API delay
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Search users by username (using real server data)
  async searchUsers(username, currentUserId, currentUsername) {
    await this.delay(500); // Shorter delay for better UX

    // Ensure we have fresh user data
    if (this.serverUsers.length === 0) {
      await this.loadServerUsers();
      await this.delay(1000); // Wait for server response
    }

    console.log("Search called with:", {
      username,
      currentUserId,
      currentUsername,
    });
    console.log(
      "Available server users:",
      this.serverUsers.map((u) => ({ id: u.id, username: u.username }))
    );

    if (!username.trim()) {
      // For debugging: if no search term, return all users except current
      const allUsers = this.serverUsers
        .filter((user) => {
          // Filter by both ID and username
          const isCurrentUserById = currentUserId && user.id === currentUserId;
          const isCurrentUserByName =
            currentUsername && user.username === currentUsername;
          return !(isCurrentUserById || isCurrentUserByName);
        })
        .map((user) => ({
          ...user,
          isFriend: this.areFriends(currentUserId, user.id),
          hasRequestSent: this.hasRequestSent(currentUserId, user.id),
          hasRequestReceived: this.hasRequestSent(user.id, currentUserId),
        }));
      console.log(
        "Returning all users for empty search:",
        allUsers.map((u) => u.username)
      );
      return allUsers;
    }

    // Enhanced search: match username and partial matches
    const searchTerm = username.toLowerCase().trim();

    const filteredUsers = this.serverUsers
      .filter((user) => {
        // Filter out current user by both ID and username
        const isCurrentUserById = currentUserId && user.id === currentUserId;
        const isCurrentUserByName =
          currentUsername && user.username === currentUsername;

        if (isCurrentUserById || isCurrentUserByName) {
          console.log("Filtering out current user:", user.username);
          return false;
        }

        const usernameLower = user.username.toLowerCase();

        // Exact match, starts with, or contains
        const matches =
          usernameLower === searchTerm ||
          usernameLower.startsWith(searchTerm) ||
          usernameLower.includes(searchTerm);

        if (matches) {
          console.log("Found match:", user.username);
        }

        return matches;
      })
      .sort((a, b) => {
        // Sort by relevance: exact match first, then starts with, then contains
        const aLower = a.username.toLowerCase();
        const bLower = b.username.toLowerCase();

        if (aLower === searchTerm && bLower !== searchTerm) return -1;
        if (bLower === searchTerm && aLower !== searchTerm) return 1;
        if (aLower.startsWith(searchTerm) && !bLower.startsWith(searchTerm))
          return -1;
        if (bLower.startsWith(searchTerm) && !aLower.startsWith(searchTerm))
          return 1;

        return aLower.localeCompare(bLower);
      })
      .map((user) => ({
        ...user,
        isFriend: this.areFriends(currentUserId, user.id),
        hasRequestSent: this.hasRequestSent(currentUserId, user.id),
        hasRequestReceived: this.hasRequestSent(user.id, currentUserId),
      }));

    console.log(
      "Search results:",
      filteredUsers.map((u) => u.username)
    );
    return filteredUsers;
  }

  // Debug method to get all users (now returns server users)
  getAllUsers() {
    return this.serverUsers;
  }

  // Get user's friends list
  async getFriends(userId) {
    await this.delay(300);

    const friendIds = this.mockFriendships.get(userId) || [];
    return friendIds
      .map((friendId) => {
        const friend = this.serverUsers.find((u) => u.id === friendId);
        if (!friend) {
          console.warn(`Friend with ID ${friendId} not found in serverUsers`);
          return null;
        }
        return {
          ...friend,
          status: Math.random() > 0.5 ? "online" : "offline",
          lastSeen:
            friend.status === "offline" ? this.getRandomLastSeen() : null,
        };
      })
      .filter((friend) => friend !== null); // Filter out null entries
  }

  // Get pending friend requests (received)
  async getFriendRequests(userId) {
    await this.delay(300);

    // Ensure ID is consistent
    const userIdNum = typeof userId === "string" ? parseInt(userId) : userId;

    console.log(
      `Getting friend requests for user ${userIdNum} (original: ${userId})`
    );
    console.log("User ID type:", typeof userIdNum);
    console.log("Current mockFriendRequests:", this.mockFriendRequests);

    const requests = [];
    for (let [senderId, receiverIds] of this.mockFriendRequests.entries()) {
      console.log(
        `Checking sender ${senderId} (type: ${typeof senderId}) with receivers:`,
        receiverIds
      );
      if (receiverIds.includes(userIdNum)) {
        console.log(`Found request from ${senderId} to ${userIdNum}`);
        const sender = this.serverUsers.find((u) => u.id === senderId);
        if (sender) {
          requests.push({
            ...sender,
            sentAt: this.getRandomSentTime(),
            requestId: `${senderId}_${userIdNum}`,
          });
        } else {
          console.warn(`Sender with ID ${senderId} not found in serverUsers`);
        }
      }
    }

    console.log(
      `Returning ${requests.length} friend requests for user ${userIdNum}:`,
      requests
    );
    return requests;
  }

  // Get sent friend requests
  async getSentRequests(userId) {
    await this.delay(300);

    const receiverIds = this.mockFriendRequests.get(userId) || [];
    return receiverIds
      .map((receiverId) => {
        const receiver = this.serverUsers.find((u) => u.id === receiverId);
        if (!receiver) {
          console.warn(
            `Receiver with ID ${receiverId} not found in serverUsers`
          );
          return null;
        }
        return {
          ...receiver,
          sentAt: this.getRandomSentTime(),
          requestId: `${userId}_${receiverId}`,
        };
      })
      .filter((request) => request !== null); // Filter out null entries
  }

  // Send friend request
  async sendFriendRequest(senderId, receiverId) {
    await this.delay(500);

    // Ensure IDs are consistent (convert to numbers if they're strings)
    const senderIdNum =
      typeof senderId === "string" ? parseInt(senderId) : senderId;
    const receiverIdNum =
      typeof receiverId === "string" ? parseInt(receiverId) : receiverId;

    console.log(
      `Sending friend request from ${senderIdNum} to ${receiverIdNum}`
    );
    console.log(
      "Sender ID type:",
      typeof senderIdNum,
      "Receiver ID type:",
      typeof receiverIdNum
    );
    console.log("Current mockFriendRequests:", this.mockFriendRequests);

    if (
      this.areFriends(senderIdNum, receiverIdNum) ||
      this.hasRequestSent(senderIdNum, receiverIdNum) ||
      this.hasRequestSent(receiverIdNum, senderIdNum)
    ) {
      throw new Error("Cannot send friend request");
    }

    const senderRequests = this.mockFriendRequests.get(senderIdNum) || [];
    senderRequests.push(receiverIdNum);
    this.mockFriendRequests.set(senderIdNum, senderRequests);

    // Save to localStorage for persistence across browser sessions
    this.savePersistedData();

    console.log("Updated mockFriendRequests:", this.mockFriendRequests);
    console.log(`Friend request sent from ${senderIdNum} to ${receiverIdNum}`);

    return { success: true, message: "Friend request sent!" };
  }

  // Accept friend request
  async acceptFriendRequest(userId, senderId) {
    await this.delay(500);

    // Remove from requests
    const senderRequests = this.mockFriendRequests.get(senderId) || [];
    const updatedRequests = senderRequests.filter((id) => id !== userId);
    this.mockFriendRequests.set(senderId, updatedRequests);

    // Add to friendships
    const userFriends = this.mockFriendships.get(userId) || [];
    const senderFriends = this.mockFriendships.get(senderId) || [];

    userFriends.push(senderId);
    senderFriends.push(userId);

    this.mockFriendships.set(userId, userFriends);
    this.mockFriendships.set(senderId, senderFriends);

    // Save to localStorage
    this.savePersistedData();

    return { success: true, message: "Friend request accepted!" };
  }

  // Reject friend request
  async rejectFriendRequest(userId, senderId) {
    await this.delay(500);

    const senderRequests = this.mockFriendRequests.get(senderId) || [];
    const updatedRequests = senderRequests.filter((id) => id !== userId);
    this.mockFriendRequests.set(senderId, updatedRequests);

    // Save to localStorage
    this.savePersistedData();

    return { success: true, message: "Friend request rejected" };
  }

  // Cancel sent friend request
  async cancelFriendRequest(senderId, receiverId) {
    await this.delay(500);

    const senderRequests = this.mockFriendRequests.get(senderId) || [];
    const updatedRequests = senderRequests.filter((id) => id !== receiverId);
    this.mockFriendRequests.set(senderId, updatedRequests);

    // Save to localStorage
    this.savePersistedData();

    return { success: true, message: "Friend request cancelled" };
  }

  // Remove friend
  async removeFriend(userId, friendId) {
    await this.delay(500);

    const userFriends = this.mockFriendships.get(userId) || [];
    const friendFriends = this.mockFriendships.get(friendId) || [];

    const updatedUserFriends = userFriends.filter((id) => id !== friendId);
    const updatedFriendFriends = friendFriends.filter((id) => id !== userId);

    this.mockFriendships.set(userId, updatedUserFriends);
    this.mockFriendships.set(friendId, updatedFriendFriends);

    // Save to localStorage
    this.savePersistedData();

    return { success: true, message: "Friend removed" };
  }

  // Helper methods
  areFriends(userId1, userId2) {
    const user1Friends = this.mockFriendships.get(userId1) || [];
    return user1Friends.includes(userId2);
  }

  hasRequestSent(senderId, receiverId) {
    const senderRequests = this.mockFriendRequests.get(senderId) || [];
    return senderRequests.includes(receiverId);
  }

  getRandomLastSeen() {
    const options = [
      "2 minutes ago",
      "1 hour ago",
      "3 hours ago",
      "1 day ago",
      "2 days ago",
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  getRandomSentTime() {
    const options = [
      "just now",
      "5 minutes ago",
      "1 hour ago",
      "2 hours ago",
      "1 day ago",
    ];
    return options[Math.floor(Math.random() * options.length)];
  }

  // Initialize with some mock data
  // Initialize mock data (for testing only - remove this for production)
  initializeMockData() {
    // Start with empty friendships and requests
    // This allows for clean testing without fake relationships
    console.log("FriendsAPI initialized with empty friendship data");
  }

  // Debug function to show current state
  debugCurrentState() {
    console.log("=== FRIENDS API DEBUG STATE ===");
    console.log("Server users:", this.serverUsers);
    console.log("Mock friendships:", this.mockFriendships);
    console.log("Mock friend requests:", this.mockFriendRequests);
    console.log("Socket connected:", this.isConnected);
    return {
      serverUsers: this.serverUsers,
      mockFriendships: this.mockFriendships,
      mockFriendRequests: this.mockFriendRequests,
      isConnected: this.isConnected,
    };
  }

  // Clear all friendship data (for testing)
  clearAllData() {
    this.mockFriendships.clear();
    this.mockFriendRequests.clear();
    localStorage.removeItem("dreamweaver_friendships");
    localStorage.removeItem("dreamweaver_friend_requests");
    console.log("All friendship data cleared!");
  }
}

// Create singleton instance
const friendsAPI = new FriendsAPI();
friendsAPI.initializeMockData();

export default friendsAPI;
