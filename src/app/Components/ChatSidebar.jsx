import React, { useEffect, useState } from "react";
import { useSocket } from "../contexts/SocketContext";
import { motion, AnimatePresence } from "framer-motion";
import friendsAPI from "../services/friendsAPI";

// Zodiac symbols mapping
const zodiacSymbols = {
  Aries: "♈",
  Taurus: "♉",
  Gemini: "♊",
  Cancer: "♋",
  Leo: "♌",
  Virgo: "♍",
  Libra: "♎",
  Scorpio: "♏",
  Sagittarius: "♐",
  Capricorn: "♑",
  Aquarius: "♒",
  Pisces: "♓",
};

export default function ChatSidebar({
  user,
  onNewMatchClick,
  onFriendsClick,
  onClose,
}) {
  const [showFriendsModal, setShowFriendsModal] = useState(false);
  const [showFriendsList, setShowFriendsList] = useState(false);
  const [showChatRequestsModal, setShowChatRequestsModal] = useState(false);
  const [searchUsername, setSearchUsername] = useState("");

  // Local friends data from friendsAPI (same as Friends component)
  const [localFriends, setLocalFriends] = useState([]);
  const [localFriendRequests, setLocalFriendRequests] = useState([]);

  const {
    socket,
    persistentChats,
    currentChatId,
    loadPersistentChats,
    openPersistentChat,
    showDeleteConfirmation,
    showDeleteModal,
    chatToDelete,
    hideDeleteConfirmation,
    confirmDeleteChat,
    isMatched,
    matchData,
    joinQueue,
    isQueuing,
    cancelQueue,
    chatClosed,
    originalTempMatch,
    // Friends functionality
    friends,
    pendingInvitations,
    sentInvitations,
    loadFriends,
    sendFriendInvitation,
    acceptFriendInvitation,
    declineFriendInvitation,
    startFriendChat,
    // Chat request functionality
    chatRequests,
    sentChatRequests,
    sendChatRequest,
    acceptChatRequest,
    declineChatRequest,
  } = useSocket();

  useEffect(() => {
    // Load persistent chats and friends when component mounts
    if (user) {
      loadPersistentChats();
      loadFriends();
    }
  }, [user?.id]); // Use user.id instead of user object to prevent unnecessary re-renders

  // Debug friends data
  useEffect(() => {
    console.log("ChatSidebar - Friends data updated:", friends);
    console.log("ChatSidebar - Pending invitations:", pendingInvitations);
  }, [friends, pendingInvitations]);

  // Load friends data from friendsAPI (same source as Friends component)
  const loadLocalFriendsData = async () => {
    if (!user?.id) {
      return;
    }

    try {
      console.log("Loading friends data from friendsAPI for user:", user.id);
      const [friendsData, requestsData] = await Promise.all([
        friendsAPI.getFriends(user.id),
        friendsAPI.getFriendRequests(user.id),
      ]);

      console.log("Loaded friends from friendsAPI:", friendsData);
      console.log("Loaded friend requests from friendsAPI:", requestsData);

      setLocalFriends(friendsData);
      setLocalFriendRequests(requestsData);
    } catch (error) {
      console.error("Error loading friends data:", error);
    }
  };

  // Load friends data when component mounts and when user changes
  useEffect(() => {
    if (user && !user.isGuest) {
      loadLocalFriendsData();
    }
  }, [user]);

  const formatLastMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));

    if (diffInMinutes < 1) return "now";
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  const getPartnerInfo = (chat) => {
    // Determine which user is the partner
    const isUser1 = chat.user1_username === user?.username;
    return {
      name: isUser1 ? chat.user2_username : chat.user1_username,
      sign: isUser1 ? chat.user2_sign : chat.user1_sign,
    };
  };

  return (
    <>
      {/* Chat Sidebar */}
      <div className="w-72 md:w-80 h-full bg-gradient-to-b from-slate-800 via-slate-900 to-black text-white flex flex-col shadow-xl border-r border-slate-700 overflow-y-auto">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-purple-900 to-indigo-900">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-white">💬 Your Chats</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden p-1 rounded hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                aria-label="Close sidebar"
              >
                ✕
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (isQueuing) {
                  cancelQueue();
                } else {
                  const userData = {
                    sign: user?.zodiacChart?.sun,
                    moon: user?.zodiacChart?.moon,
                    rising: user?.zodiacChart?.rising,
                    name: user?.username,
                  };
                  joinQueue(userData);
                }
              }}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-medium py-2 px-3 rounded-lg text-sm transition-all duration-300 transform hover:scale-105"
            >
              {isQueuing ? "🔄 Cancel Queue" : "✨ New Match"}
            </button>
            <button
              onClick={() => setShowFriendsList(!showFriendsList)}
              className={`flex-1 bg-gradient-to-r ${
                showFriendsList
                  ? "from-green-600 to-teal-700"
                  : "from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700"
              } text-white font-medium py-2 px-3 rounded-lg text-sm transition-all duration-300 transform hover:scale-105 relative`}
            >
              👥 Friends
              {localFriendRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {localFriendRequests.length}
                </span>
              )}
            </button>
          </div>

          {/* Chat Requests Button */}
          <div className="mt-2">
            <button
              onClick={() => setShowChatRequestsModal(true)}
              className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-medium py-2 px-3 rounded-lg text-sm transition-all duration-300 transform hover:scale-105 relative"
            >
              💬 Chat Requests
              {chatRequests.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-yellow-500 text-black text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                  {chatRequests.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Current Active Chat */}
        {isMatched && matchData && (
          <div className="p-3 border-b border-slate-700 bg-gradient-to-r from-purple-800 to-indigo-800">
            <div className="text-sm text-purple-200 mb-1">Current Chat</div>
            <div className="flex items-center space-x-3">
              <div className="text-2xl">
                {zodiacSymbols[matchData.partner.sign] || "⭐"}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-white">
                  {matchData.partner.name}
                </div>
                <div className="text-sm text-purple-200">
                  {matchData.isPersistent
                    ? "🔒 Saved Chat"
                    : "🔀 Temporary Match"}
                </div>
              </div>
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            </div>
          </div>
        )}

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-1 p-2">
            {/* Debug info for temporary match */}
            {originalTempMatch ? (
              <div className="text-xs text-green-400 p-1 bg-green-900/20 rounded mb-2">
                ✅ Temp Match Available: {originalTempMatch.partner?.name} |
                Closed: {chatClosed ? "Yes" : "No"} | Chat ID: {currentChatId}
              </div>
            ) : (
              <div className="text-xs text-red-400 p-1 bg-red-900/20 rounded mb-2">
                ❌ No Temp Match Available
              </div>
            )}

            {/* TEMPORARY MATCH SECTION - Always visible when available */}
            {originalTempMatch && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-purple-400 mb-2 px-2">
                  🔥 ACTIVE TEMPORARY MATCH
                </div>
                <div
                  className={`relative group p-3 rounded-lg cursor-pointer transition-all duration-200 border border-purple-400/50 ${
                    currentChatId === `match-${originalTempMatch.matchId}`
                      ? "bg-gradient-to-r from-purple-600/30 to-purple-500/30 shadow-lg border-purple-400"
                      : "bg-slate-800 hover:bg-slate-700 border-purple-400/30"
                  }`}
                  onClick={() => {
                    console.log("Temporary match clicked:", {
                      originalTempMatch,
                      currentChatId,
                      targetChatId: `match-${originalTempMatch.matchId}`,
                      chatClosed,
                    });
                    // Create a temporary match chat object
                    const tempMatchChat = {
                      chat_id: `match-${originalTempMatch.matchId}`,
                      user1_username: user?.username || "You",
                      user2_username:
                        originalTempMatch.partner?.name || "Partner",
                      user1_sign: user?.zodiacChart?.sun || "Aries",
                      user2_sign:
                        originalTempMatch.partner?.zodiacChart?.sun || "Aries",
                      last_message_at: new Date().toISOString(),
                      isTemporaryMatch: true, // Flag to identify this as a temporary match
                    };
                    console.log("Opening temp match chat:", tempMatchChat);
                    openPersistentChat(tempMatchChat, user);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-xl">
                      {zodiacSymbols[
                        originalTempMatch.partner?.zodiacChart?.sun
                      ] || "⭐"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-white truncate">
                        {originalTempMatch.partner?.name || "Partner"}
                        <span className="ml-2 text-xs bg-purple-500 px-2 py-0.5 rounded-full animate-pulse">
                          TEMP
                        </span>
                      </div>
                      <div className="text-sm text-slate-300 truncate">
                        {originalTempMatch.partner?.zodiacChart?.sun ||
                          "Unknown"}{" "}
                        • Temporary match
                      </div>
                    </div>
                    <div className="text-xs text-purple-400">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SEPARATOR */}
            {originalTempMatch && (
              <div className="border-t border-slate-700 my-4"></div>
            )}

            {/* Current Temporary Match - Always show if exists to debug */}
            {false && originalTempMatch && (
              <div
                className={`relative group p-3 rounded-lg cursor-pointer transition-all duration-200 border border-purple-400/30 ${
                  currentChatId === `match-${originalTempMatch.matchId}`
                    ? "bg-gradient-to-r from-purple-600/20 to-purple-500/20 shadow-lg"
                    : "bg-slate-800 hover:bg-slate-700"
                }`}
                onClick={() => {
                  console.log("Temporary match clicked:", {
                    originalTempMatch,
                    currentChatId,
                    targetChatId: `match-${originalTempMatch.matchId}`,
                    chatClosed,
                  });
                  // Create a temporary match chat object
                  const tempMatchChat = {
                    chat_id: `match-${originalTempMatch.matchId}`,
                    user1_username: user?.username || "You",
                    user2_username:
                      originalTempMatch.partner?.name || "Partner",
                    user1_sign: user?.zodiacChart?.sun || "Aries",
                    user2_sign:
                      originalTempMatch.partner?.zodiacChart?.sun || "Aries",
                    last_message_at: new Date().toISOString(),
                    isTemporaryMatch: true, // Flag to identify this as a temporary match
                  };
                  console.log("Opening temp match chat:", tempMatchChat);
                  openPersistentChat(tempMatchChat, user);
                }}
              >
                <div className="flex items-center space-x-3">
                  <div className="text-xl">
                    {zodiacSymbols[
                      originalTempMatch.partner?.zodiacChart?.sun
                    ] || "⭐"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">
                      {originalTempMatch.partner?.name || "Partner"}
                      <span className="ml-2 text-xs bg-purple-500 px-2 py-0.5 rounded-full">
                        TEMP
                      </span>
                    </div>
                    <div className="text-sm text-slate-300 truncate">
                      {originalTempMatch.partner?.zodiacChart?.sun || "Unknown"}{" "}
                      • Temporary match
                    </div>
                  </div>
                  <div className="text-xs text-purple-400">
                    <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"></div>
                  </div>
                </div>
              </div>
            )}

            {/* Dummy Chat #1 for Testing */}
            <div
              className={`relative group p-3 rounded-lg cursor-pointer transition-all duration-200 border border-yellow-400/20 ${
                currentChatId === "dummy-chat-1"
                  ? "bg-gradient-to-r from-yellow-600/20 to-yellow-500/20 shadow-lg"
                  : "bg-slate-800 hover:bg-slate-700"
              }`}
              onClick={() => {
                // Create a dummy chat object
                const dummyChat = {
                  chat_id: "dummy-chat-1",
                  user1_username: user?.username || "You",
                  user2_username: "Luna StarGazer",
                  user1_sign: user?.zodiacChart?.sun || "Aries",
                  user2_sign: "Scorpio",
                  last_message_at: new Date().toISOString(),
                };
                openPersistentChat(dummyChat, user);
              }}
            >
              <div className="flex items-center space-x-3">
                <div className="text-xl">♏</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">
                    Luna StarGazer
                    <span className="ml-2 text-xs bg-yellow-500 px-2 py-0.5 rounded-full">
                      TEST
                    </span>
                  </div>
                  <div className="text-sm text-slate-300 truncate">
                    Scorpio • just now
                  </div>
                </div>
                <div className="text-xs text-yellow-400">🧪</div>
              </div>
            </div>

            {/* Dummy Chat #2 for Testing */}
            <div
              className={`relative group p-3 rounded-lg cursor-pointer transition-all duration-200 border border-blue-400/20 ${
                currentChatId === "dummy-chat-2"
                  ? "bg-gradient-to-r from-blue-600/20 to-blue-500/20 shadow-lg"
                  : "bg-slate-800 hover:bg-slate-700"
              }`}
              onClick={() => {
                // Create a second dummy chat object
                const dummyChat2 = {
                  chat_id: "dummy-chat-2",
                  user1_username: user?.username || "You",
                  user2_username: "Cosmic Ray",
                  user1_sign: user?.zodiacChart?.sun || "Aries",
                  user2_sign: "Gemini",
                  last_message_at: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                };
                openPersistentChat(dummyChat2, user);
              }}
            >
              <div className="flex items-center space-x-3">
                <div className="text-xl">♊</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">
                    Cosmic Ray
                    <span className="ml-2 text-xs bg-blue-500 px-2 py-0.5 rounded-full">
                      TEST
                    </span>
                  </div>
                  <div className="text-sm text-slate-300 truncate">
                    Gemini • 1h ago
                  </div>
                </div>
                <div className="text-xs text-blue-400">🧪</div>
              </div>
            </div>

            {/* Real Persistent Chats */}
            {persistentChats.length === 0 ? (
              <div className="p-6 text-center text-slate-400">
                <div className="text-4xl mb-3">💭</div>
                <p className="text-sm">No saved chats yet</p>
                <p className="text-xs mt-1">
                  Start a conversation with another registered user!
                </p>
              </div>
            ) : (
              <>
                {persistentChats.map((chat) => {
                  const partner = getPartnerInfo(chat);
                  const isCurrentChat = currentChatId === chat.chat_id;

                  return (
                    <div
                      key={chat.chat_id}
                      className={`relative group p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                        isCurrentChat
                          ? "bg-gradient-to-r from-purple-600 to-indigo-600 shadow-lg"
                          : "bg-slate-800 hover:bg-slate-700"
                      }`}
                      onClick={() => openPersistentChat(chat, user)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-xl">
                          {zodiacSymbols[partner.sign] || "⭐"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white truncate">
                            {partner.name}
                          </div>
                          <div className="text-sm text-slate-300 truncate">
                            {partner.sign} •{" "}
                            {formatLastMessageTime(chat.last_message_at)}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            showDeleteConfirmation(chat);
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-red-500 rounded text-white text-sm"
                          title="Delete chat"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Friends List Section */}
        <AnimatePresence>
          {showFriendsList && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-slate-700 bg-slate-800"
            >
              <div className="p-3">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-medium text-gray-300">
                    👥 Your Friends ({localFriends.length})
                  </h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        console.log("Manual friends refresh clicked");
                        loadLocalFriendsData();
                      }}
                      className="text-xs bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded transition-colors"
                    >
                      🔄
                    </button>
                    <button
                      onClick={() => setShowFriendsModal(true)}
                      className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
                    >
                      Manage
                    </button>
                  </div>
                </div>

                {localFriends.length === 0 ? (
                  <div className="text-center py-4 text-gray-400">
                    <div className="text-2xl mb-1">👥</div>
                    <p className="text-xs">No friends yet</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {localFriends.map((friend, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="relative">
                            <div className="text-sm">
                              {zodiacSymbols[friend.zodiacChart?.sun] || "⭐"}
                            </div>
                            {friend.status === "online" && (
                              <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-400 rounded-full border border-slate-700"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-white text-sm">
                              {friend.username}
                            </div>
                            <div className="text-xs text-gray-400">
                              {friend.zodiacChart?.sun || "Unknown"}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            console.log(
                              "Sending chat request to:",
                              friend.username,
                            );
                            sendChatRequest(friend.username);
                            setShowFriendsList(false);
                          }}
                          className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded transition-colors"
                        >
                          Request Chat
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Pending Invitations Preview */}
                {localFriendRequests.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-600">
                    <div className="text-xs text-yellow-400 mb-2">
                      📨 {localFriendRequests.length} Pending Invitation
                      {localFriendRequests.length > 1 ? "s" : ""}
                    </div>
                    <div className="space-y-1">
                      {localFriendRequests.slice(0, 2).map((request, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-yellow-900/30 rounded text-xs"
                        >
                          <span className="text-yellow-200">
                            {zodiacSymbols[request.zodiacChart?.sun] || "⭐"}{" "}
                            {request.username}
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={async () => {
                                try {
                                  await friendsAPI.acceptFriendRequest(
                                    user.id,
                                    request.id,
                                  );
                                  loadLocalFriendsData(); // Refresh data
                                } catch (error) {
                                  console.error(
                                    "Error accepting friend request:",
                                    error,
                                  );
                                }
                              }}
                              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded"
                            >
                              ✓
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await friendsAPI.rejectFriendRequest(
                                    user.id,
                                    request.id,
                                  );
                                  loadLocalFriendsData(); // Refresh data
                                } catch (error) {
                                  console.error(
                                    "Error rejecting friend request:",
                                    error,
                                  );
                                }
                              }}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded"
                            >
                              ✗
                            </button>
                          </div>
                        </div>
                      ))}
                      {localFriendRequests.length > 2 && (
                        <div className="text-xs text-gray-400 text-center">
                          +{localFriendRequests.length - 2} more...
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div className="p-3 border-t border-slate-700 bg-slate-900">
          <button
            onClick={loadPersistentChats}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-3 rounded-lg text-sm transition-colors duration-200"
          >
            🔄 Refresh Chats
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && chatToDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={hideDeleteConfirmation}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-800 rounded-xl p-6 max-w-md mx-4 border border-slate-700"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="text-3xl mb-4">⚠️</div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Delete Chat?
                </h3>
                <p className="text-slate-300 mb-1">
                  Are you sure you want to delete your conversation with{" "}
                  <span className="font-semibold text-white">
                    {getPartnerInfo(chatToDelete).name}
                  </span>
                  ?
                </p>
                <p className="text-sm text-slate-400 mb-6">
                  This action cannot be undone. All messages will be permanently
                  deleted.
                </p>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={hideDeleteConfirmation}
                    className="px-6 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteChat}
                    className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                  >
                    Delete Chat
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Requests Modal */}
      <AnimatePresence>
        {showChatRequestsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowChatRequestsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">
                  💬 Chat Requests
                </h3>
                <button
                  onClick={() => setShowChatRequestsModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {chatRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">💬</div>
                  <p>No incoming chat requests</p>
                  <p className="text-sm">
                    Chat requests from friends will appear here
                  </p>
                </div>
              ) : (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-3">
                    Incoming Requests ({chatRequests.length})
                  </h4>
                  <div className="space-y-3">
                    {chatRequests.map((request, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-slate-700 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-lg">
                            {zodiacSymbols[request.fromSign] || "⭐"}
                          </div>
                          <div>
                            <div className="font-medium text-white">
                              {request.fromUsername}
                            </div>
                            <div className="text-sm text-gray-400">
                              {request.fromSign}
                            </div>
                            <div className="text-xs text-gray-500">
                              wants to start a chat
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              acceptChatRequest(request.fromUsername);
                              setShowChatRequestsModal(false);
                              // Show a brief success message or notification
                              console.log(
                                `Opening chat with ${request.fromUsername}...`,
                              );
                            }}
                            className="px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                          >
                            Accept & Chat
                          </button>
                          <button
                            onClick={() => {
                              declineChatRequest(request.fromUsername);
                            }}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sent Requests Preview */}
              {sentChatRequests.length > 0 && (
                <div className="mt-6 pt-4 border-t border-slate-600">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">
                    Sent Requests ({sentChatRequests.length})
                  </h4>
                  <div className="space-y-2">
                    {sentChatRequests.map((request, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-600 rounded-lg"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="text-sm">
                            {zodiacSymbols[request.toSign] || "⭐"}
                          </div>
                          <div>
                            <div className="font-medium text-white text-sm">
                              {request.toUsername}
                            </div>
                            <div className="text-xs text-gray-400">
                              pending...
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-yellow-400">
                          ⏳ Waiting
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Friends Modal */}
      <AnimatePresence>
        {showFriendsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowFriendsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">👥 Friends</h3>
                <button
                  onClick={() => setShowFriendsModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* Add Friend Section */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-300 mb-2">
                  Add Friend
                </h4>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchUsername}
                    onChange={(e) => setSearchUsername(e.target.value)}
                    placeholder="Enter username..."
                    className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={() => {
                      if (searchUsername.trim()) {
                        sendFriendInvitation(searchUsername);
                        setSearchUsername("");
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Pending Invitations */}
              {pendingInvitations.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">
                    Pending Invitations ({pendingInvitations.length})
                  </h4>
                  <div className="space-y-2">
                    {pendingInvitations.map((invitation, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-lg">
                            {zodiacSymbols[invitation.fromSign] || "⭐"}
                          </div>
                          <div>
                            <div className="font-medium text-white">
                              {invitation.fromUsername}
                            </div>
                            <div className="text-sm text-gray-400">
                              {invitation.fromSign}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              acceptFriendInvitation(invitation.fromUsername);
                            }}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => {
                              declineFriendInvitation(invitation.fromUsername);
                            }}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Friends List */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">
                  Your Friends ({friends.length})
                </h4>
                {friends.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <div className="text-4xl mb-2">👥</div>
                    <p>No friends yet</p>
                    <p className="text-sm">Add friends to start chatting!</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {friends.map((friend, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-700 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="relative">
                            <div className="text-lg">
                              {zodiacSymbols[friend.sign] || "⭐"}
                            </div>
                            {friend.isOnline && (
                              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-700"></div>
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-white">
                              {friend.username}
                            </div>
                            <div className="text-sm text-gray-400">
                              {friend.sign} •{" "}
                              {friend.isOnline ? "Online" : "Offline"}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            startFriendChat(friend.username);
                            setShowFriendsModal(false);
                          }}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors"
                        >
                          Chat
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
