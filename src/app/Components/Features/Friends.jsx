import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import friendsAPI from "../../services/friendsAPI";

const Friends = ({ user, onLogin }) => {
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchUsername, setSearchUsername] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("friends"); // friends, requests, sent

  // Check if user is a guest
  const isGuest = user?.isGuest || !user;

  // Load real server users when component loads
  useEffect(() => {
    // Load real users from server
    friendsAPI.loadServerUsers();

    if (user && !user.isGuest) {
      loadFriendsData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  // Auto-refresh friends data every 3 seconds for more real-time updates
  useEffect(() => {
    if (!user || user.isGuest) return;

    const refreshInterval = setInterval(() => {
      // Only refresh if not currently loading to avoid UI flicker
      if (!isLoading) {
        loadFriendsData();
      }
    }, 3000); // Refresh every 3 seconds for faster updates

    return () => clearInterval(refreshInterval);
  }, [user, isLoading]);

  // Listen for localStorage changes to detect friend requests from other tabs/sessions
  useEffect(() => {
    if (!user || user.isGuest) return;

    const handleStorageChange = (e) => {
      if (
        e.key === "dreamweaver_friend_requests" &&
        e.newValue !== e.oldValue
      ) {
        console.log("Friend requests updated in localStorage, refreshing...");
        // Small delay to ensure the change is fully persisted
        setTimeout(() => {
          loadFriendsData();
        }, 500);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user]); // Real-time search with debouncing
  useEffect(() => {
    if (!showAddFriend || !searchUsername.trim()) {
      setSearchResults([]);
      return;
    }

    const searchTimer = setTimeout(() => {
      if (user && !user.isGuest) {
        searchUsers(searchUsername);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(searchTimer);
  }, [searchUsername, showAddFriend, user]);

  // Function to close modal and clear search
  const closeAddFriendModal = () => {
    setShowAddFriend(false);
    setSearchUsername("");
    setSearchResults([]);
    setIsSearching(false);
  };

  // Debug function to check users
  const debugUsers = () => {
    const allUsers = friendsAPI.getAllUsers();
    console.log("=== FRIENDS DEBUG ===");
    console.log("All users from server:", allUsers);
    console.log("Current user:", user);
    console.log("Current user ID:", user?.id);
    console.log("Current user username:", user?.username);
    console.log("Current friends:", friends);
    console.log("Current friend requests:", friendRequests);
    console.log("Current sent requests:", sentRequests);

    // Check friend requests state in API
    if (user?.id) {
      friendsAPI.getFriendRequests(user.id).then((requests) => {
        console.log("Fresh friend requests from API:", requests);
      });
    }

    // Refresh users from server
    friendsAPI.loadServerUsers();

    // Also refresh friends data
    loadFriendsData();

    setTimeout(() => {
      const refreshedUsers = friendsAPI.getAllUsers();
      console.log("Refreshed users from server:", refreshedUsers);
    }, 1500);
  };

  // Manual refresh function
  const refreshFriendsData = () => {
    console.log("Manually refreshing friends data...");
    loadFriendsData();
  };

  // Debug API state
  const debugAPIState = () => {
    console.log("=== API STATE DEBUG ===");
    friendsAPI.debugCurrentState();
  };

  // Clear all friendship data
  const clearAllData = () => {
    if (
      confirm(
        "Are you sure you want to clear all friendship data? This will remove all friends and requests."
      )
    ) {
      friendsAPI.clearAllData();
      setFriends([]);
      setFriendRequests([]);
      setSentRequests([]);
      console.log("All friendship data cleared!");
    }
  };

  const loadFriendsData = async () => {
    if (!user?.id) {
      console.error("User ID not available for loading friends data");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // Force reload persisted data to get latest changes
      friendsAPI.reloadPersistedData();

      const [friendsData, requestsData, sentData] = await Promise.all([
        friendsAPI.getFriends(user.id),
        friendsAPI.getFriendRequests(user.id),
        friendsAPI.getSentRequests(user.id),
      ]);

      // Only update state if data has actually changed to prevent unnecessary re-renders
      setFriends((prevFriends) => {
        if (JSON.stringify(prevFriends) !== JSON.stringify(friendsData)) {
          return friendsData;
        }
        return prevFriends;
      });

      setFriendRequests((prevRequests) => {
        if (JSON.stringify(prevRequests) !== JSON.stringify(requestsData)) {
          return requestsData;
        }
        return prevRequests;
      });

      setSentRequests((prevSent) => {
        if (JSON.stringify(prevSent) !== JSON.stringify(sentData)) {
          return sentData;
        }
        return prevSent;
      });
    } catch (error) {
      console.error("Error loading friends data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchUsers = async (username) => {
    if (!username.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const userId = user?.id; // Allow undefined ID
    const currentUsername = user?.username; // Also pass username for filtering
    console.log("Searching for users with:", {
      username,
      userId,
      currentUsername,
      user,
    });

    try {
      const results = await friendsAPI.searchUsers(
        username,
        userId,
        currentUsername
      );
      console.log("Search results received:", results);
      setSearchResults(results);
    } catch (error) {
      console.error("Error searching users:", error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (targetUser) => {
    if (!user?.id) {
      console.error("User ID not available");
      return;
    }

    try {
      await friendsAPI.sendFriendRequest(user.id, targetUser.id);

      // Update local state
      setSentRequests((prev) => [...prev, targetUser]);
      setSearchResults((prev) =>
        prev.map((u) =>
          u.id === targetUser.id ? { ...u, hasRequestSent: true } : u
        )
      );
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  const acceptFriendRequest = async (requestUser) => {
    if (!user?.id) {
      console.error("User ID not available");
      return;
    }

    try {
      await friendsAPI.acceptFriendRequest(user.id, requestUser.id);

      // Update local state
      setFriends((prev) => [
        ...prev,
        { ...requestUser, status: "offline", lastSeen: "just now" },
      ]);
      setFriendRequests((prev) =>
        prev.filter((req) => req.id !== requestUser.id)
      );
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  const rejectFriendRequest = async (requestUser) => {
    if (!user?.id) {
      console.error("User ID not available");
      return;
    }

    try {
      await friendsAPI.rejectFriendRequest(user.id, requestUser.id);

      // Update local state
      setFriendRequests((prev) =>
        prev.filter((req) => req.id !== requestUser.id)
      );
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };

  const cancelSentRequest = async (targetUser) => {
    if (!user?.id) {
      console.error("User ID not available");
      return;
    }

    try {
      await friendsAPI.cancelFriendRequest(user.id, targetUser.id);

      // Update local state
      setSentRequests((prev) => prev.filter((req) => req.id !== targetUser.id));
    } catch (error) {
      console.error("Error cancelling friend request:", error);
    }
  };

  const removeFriend = async (friendId) => {
    if (!user?.id) {
      console.error("User ID not available");
      return;
    }

    try {
      await friendsAPI.removeFriend(user.id, friendId);

      // Update local state
      setFriends((prev) => prev.filter((friend) => friend.id !== friendId));
    } catch (error) {
      console.error("Error removing friend:", error);
    }
  };

  if (!user || user.isGuest) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-xl p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">👥</div>
          <h2 className="text-2xl font-bold text-white mb-4">
            {!user ? "Friends Await You" : "Register to Connect"}
          </h2>
          <p className="text-gray-300 mb-6">
            {!user
              ? "Connect with like-minded souls and discover cosmic friendships. Sign in to start building your astral social network."
              : "Guest accounts cannot add friends. Create a registered account to connect with other cosmic souls and build your astral network."}
          </p>
          <button
            onClick={onLogin}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
          >
            {!user ? "Sign In to Connect" : "Create Account"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-xl p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white mb-6">Cosmic Friends</h1>
          <div className="flex space-x-2">
            <button
              onClick={refreshFriendsData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
              title="Refresh friends data"
            >
              🔄
            </button>
            <button
              onClick={debugAPIState}
              className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm"
              title="Debug API State"
            >
              API
            </button>
            <button
              onClick={clearAllData}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
              title="Clear all friendship data"
            >
              Clear
            </button>
            <button
              onClick={debugUsers}
              className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
            >
              Debug
            </button>
            <button
              onClick={() => setShowAddFriend(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
            >
              <span>+</span>
              <span>Add Friend</span>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-white/10 rounded-lg p-1">
          {[
            { id: "friends", label: `Friends (${friends.length})` },
            { id: "requests", label: `Requests (${friendRequests.length})` },
            { id: "sent", label: `Sent (${sentRequests.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-4 rounded-md transition-all duration-200 ${
                activeTab === tab.id
                  ? "bg-white text-indigo-900 font-medium"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-white text-lg">
                Loading cosmic connections...
              </div>
            </div>
          ) : (
            <>
              {activeTab === "friends" && (
                <div className="space-y-4">
                  {friends.length === 0 ? (
                    <div className="text-center py-12 text-gray-300">
                      <div className="text-4xl mb-4">🌟</div>
                      <p className="text-lg">No cosmic friends yet</p>
                      <p className="text-sm opacity-70">
                        Start connecting with fellow stargazers!
                      </p>
                    </div>
                  ) : (
                    friends.map((friend) => (
                      <motion.div
                        key={friend.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                              <span className="text-xl font-bold text-white">
                                {friend.username
                                  ? friend.username.charAt(0).toUpperCase()
                                  : "?"}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-white font-semibold flex items-center space-x-2">
                                <span>{friend.username || "Unknown User"}</span>
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    friend.status === "online"
                                      ? "bg-green-400"
                                      : "bg-gray-400"
                                  }`}
                                ></span>
                              </h3>
                              <p className="text-gray-300 text-sm">
                                {friend.zodiacChart.sun} ☉{" "}
                                {friend.zodiacChart.moon} ☽{" "}
                                {friend.zodiacChart.rising} ↗
                              </p>
                              {friend.status === "offline" && (
                                <p className="text-gray-400 text-xs">
                                  Last seen {friend.lastSeen}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-1 rounded-md text-sm transition-colors">
                              Chat
                            </button>
                            <button
                              onClick={() => removeFriend(friend.id)}
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1 rounded-md text-sm transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "requests" && (
                <div className="space-y-4">
                  {friendRequests.length === 0 ? (
                    <div className="text-center py-12 text-gray-300">
                      <div className="text-4xl mb-4">📬</div>
                      <p className="text-lg">No friend requests</p>
                      <p className="text-sm opacity-70">
                        New requests will appear here
                      </p>
                    </div>
                  ) : (
                    friendRequests.map((request) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                              <span className="text-xl font-bold text-white">
                                {request.username
                                  ? request.username.charAt(0).toUpperCase()
                                  : "?"}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-white font-semibold">
                                {request.username || "Unknown User"}
                              </h3>
                              <p className="text-gray-300 text-sm">
                                {request.zodiacChart
                                  ? `${request.zodiacChart.sun} ☉ ${request.zodiacChart.moon} ☽ ${request.zodiacChart.rising} ↗`
                                  : "Zodiac info unavailable"}
                              </p>
                              <p className="text-gray-400 text-xs">
                                Sent {request.sentAt}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => acceptFriendRequest(request)}
                              className="bg-green-500/20 hover:bg-green-500/30 text-green-300 px-3 py-1 rounded-md text-sm transition-colors"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => rejectFriendRequest(request)}
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1 rounded-md text-sm transition-colors"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}

              {activeTab === "sent" && (
                <div className="space-y-4">
                  {sentRequests.length === 0 ? (
                    <div className="text-center py-12 text-gray-300">
                      <div className="text-4xl mb-4">✉️</div>
                      <p className="text-lg">No sent requests</p>
                      <p className="text-sm opacity-70">
                        Friend requests you send will appear here
                      </p>
                    </div>
                  ) : (
                    sentRequests.map((request) => (
                      <motion.div
                        key={request.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                              <span className="text-xl font-bold text-white">
                                {request.username
                                  ? request.username.charAt(0).toUpperCase()
                                  : "?"}
                              </span>
                            </div>
                            <div>
                              <h3 className="text-white font-semibold">
                                {request.username || "Unknown User"}
                              </h3>
                              <p className="text-gray-300 text-sm">
                                {request.zodiacChart
                                  ? `${request.zodiacChart.sun} ☉ ${request.zodiacChart.moon} ☽ ${request.zodiacChart.rising} ↗`
                                  : "Zodiac info unavailable"}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-yellow-300 text-sm">
                              Pending...
                            </span>
                            <button
                              onClick={() => cancelSentRequest(request)}
                              className="bg-red-500/20 hover:bg-red-500/30 text-red-300 px-3 py-1 rounded-md text-sm transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Friend Modal */}
      <AnimatePresence>
        {showAddFriend && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6 rounded-2xl border border-purple-300/30 max-w-md w-full"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Add Friend</h2>
                <button
                  onClick={closeAddFriendModal}
                  className="text-white/50 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    value={searchUsername}
                    onChange={(e) => setSearchUsername(e.target.value)}
                    placeholder="Search by username..."
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                  <p className="text-xs text-gray-300 mt-1">
                    {isSearching
                      ? "Searching..."
                      : "Type to search for cosmic souls"}
                  </p>
                </div>

                {/* Search Results */}
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {searchResults.length > 0 && (
                    <div className="text-center py-2 text-gray-300 text-sm border-b border-white/10">
                      Found {searchResults.length} cosmic soul
                      {searchResults.length !== 1 ? "s" : ""}
                    </div>
                  )}

                  {searchResults.length === 0 &&
                  searchUsername.trim() &&
                  !isSearching ? (
                    <div className="text-center py-6 text-gray-300">
                      <div className="text-2xl mb-2">🔍</div>
                      <p>No users found matching "{searchUsername}"</p>
                      <p className="text-sm opacity-70 mt-1">
                        Try a different username
                      </p>
                    </div>
                  ) : (
                    searchResults.map((result) => (
                      <div
                        key={result.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-white">
                              {result.username
                                ? result.username.charAt(0).toUpperCase()
                                : "?"}
                            </span>
                          </div>
                          <div>
                            <p className="text-white font-medium">
                              {result.username || "Unknown User"}
                            </p>
                            <p className="text-gray-300 text-xs">
                              {result.zodiacChart
                                ? `${result.zodiacChart.sun} ☉ ${result.zodiacChart.moon} ☽ ${result.zodiacChart.rising} ↗`
                                : "Zodiac info unavailable"}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => sendFriendRequest(result)}
                          disabled={result.isFriend || result.hasRequestSent}
                          className={`px-3 py-1 rounded text-sm transition-colors ${
                            result.isFriend
                              ? "bg-gray-500/20 text-gray-400 cursor-not-allowed"
                              : result.hasRequestSent
                              ? "bg-yellow-500/20 text-yellow-300 cursor-not-allowed"
                              : "bg-green-500/20 hover:bg-green-500/30 text-green-300"
                          }`}
                        >
                          {result.isFriend
                            ? "Friends"
                            : result.hasRequestSent
                            ? "Sent"
                            : "Add"}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Friends;
