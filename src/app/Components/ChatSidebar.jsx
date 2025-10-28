import React, { useEffect } from "react";
import { useSocket } from "../contexts/SocketContext";
import { motion, AnimatePresence } from "framer-motion";

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

export default function ChatSidebar({ user, onNewMatchClick, onFriendsClick }) {
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
  } = useSocket();

  useEffect(() => {
    // Load persistent chats when component mounts
    if (user) {
      loadPersistentChats();
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
      <div className="w-80 bg-gradient-to-b from-slate-800 via-slate-900 to-black text-white flex flex-col shadow-xl border-r border-slate-700">
        {/* Header */}
        <div className="p-4 border-b border-slate-700 bg-gradient-to-r from-purple-900 to-indigo-900">
          <h2 className="text-xl font-bold text-white mb-2">💬 Your Chats</h2>
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
              onClick={onFriendsClick}
              className="flex-1 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-medium py-2 px-3 rounded-lg text-sm transition-all duration-300 transform hover:scale-105"
            >
              👥 Friends
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
            {/* Current Temporary Match - Only show for non-persistent matches */}
            {originalTempMatch && !chatClosed && (
              <div
                className={`relative group p-3 rounded-lg cursor-pointer transition-all duration-200 border border-purple-400/30 ${
                  currentChatId === `match-${originalTempMatch.matchId}`
                    ? "bg-gradient-to-r from-purple-600/20 to-purple-500/20 shadow-lg"
                    : "bg-slate-800 hover:bg-slate-700"
                }`}
                onClick={() => {
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
    </>
  );
}
