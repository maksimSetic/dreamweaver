import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import ZodiacCompatibility from "../Components/Features/ZodiacCompatibility";
import Notes from "../Components/Features/Notes";
import MysticElements from "../Components/Features/MysticElements";
import { useSocket } from "../contexts/SocketContext";

// Zodiac symbols mapping (needed for chat interface)
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

// Notable traits for each zodiac sign (needed for character selection)
const zodiacTraits = {
  Aries: ["Annie Leonhart", "Eren Yeager", "Hidan"],
  Taurus: ["Choji Akimichi", "Deidara", "Kankuro"],
  Gemini: ["Itachi Uchiha", "Ymir", "Karin Uzumaki"],
  Cancer: ["Neji Hyuga", "Kushina Uzumaki", "Madara Uchiha"],
  Leo: ["Sasuke Uchiha", "Historia Reiss", "Fugaku Uchiha"],
  Virgo: ["Hange Zoë", "Kakashi Hatake", "Shikamaru Nara"],
  Libra: ["Ino Yamanaka", "Naruto Uzumaki", "Mikoto Uchiha"],
  Scorpio: ["L Lawliet", "Armin Arlert", "Yagura Karatachi"],
  Sagittarius: ["Zabuza Momochi", "Mikoto Uchiha", "Mello"],
  Capricorn: ["Levi Ackerman", "Misa Amane", "Gaara"],
  Aquarius: ["Mikasa Ackerman", "Obito Uchiha", "Konohamaru Sarutobi"],
  Pisces: ["Light Yagami", "Rin Nohara", "Isaribi"],
};

export default function MainContent({ active, user, onLogin, setActive }) {
  const {
    isQueuing,
    joinQueue,
    cancelQueue,
    isConnected,
    isMatched,
    matchData,
    messages,
    sendMessage,
    partnerDisconnected,
    chatClosed,
    startNewMatch,
    closeChat,
    reopenChat,
  } = useSocket();
  const [messageInput, setMessageInput] = useState("");
  const [usedQuotes, setUsedQuotes] = useState({});

  // Force navigation to chat when match is found
  useEffect(() => {
    if (isMatched && matchData && !chatClosed && active !== "chat") {
      console.log("Match found but not on chat page, navigating to chat");
      setActive("chat");
    }
  }, [isMatched, matchData, chatClosed, active, setActive]);

  // Character data for quote functionality (simplified version)
  const characterData = {
    "Annie Leonhart": {
      image:
        "https://static.wikia.nocookie.net/shingekinokyojin/images/9/9c/Annie_Leonhart_%28Anime%29_character_image.png",
      quotes: [
        "I just want to go home.",
        "I'm going to see my father again.",
        "I failed to become a warrior.",
        "The worst part about people is that they're all so selfish.",
        "I don't think I'm a good person.",
        "I'll do whatever it takes to return home.",
        "I can't be the good person everyone wants me to be.",
        "My father is waiting for me.",
        "I've done terrible things to get this far.",
      ],
    },
    "Eren Yeager": {
      image:
        "https://static.wikia.nocookie.net/shingekinokyojin/images/d/d8/Eren_Yeager_%28Anime%29_character_image.png",
      quotes: [
        "I'll kill them all! Every last one of them!",
        "If you win, you live. If you lose, you die. If you don't fight, you can't win!",
        "I'm free.",
        "Because I was born into this world.",
        "Fight! Fight! Fight!",
        "Freedom is what I seek.",
        "I keep moving forward, until my enemies are destroyed.",
        "The only way to truly escape the monsters is to become a monster yourself.",
        "I won't hesitate anymore. No matter what enemies I face, I won't let anyone else die.",
      ],
    },
    // Add more characters as needed...
  };

  const handleCharacterClick = (character) => {
    const characterInfo = characterData[character];
    if (!characterInfo || !characterInfo.quotes) return;

    // Get random quote that hasn't been used
    const availableQuotes = characterInfo.quotes.filter(
      (_, index) => !usedQuotes[character]?.includes(index)
    );

    if (availableQuotes.length === 0) {
      // Reset if all quotes used
      setUsedQuotes((prev) => ({ ...prev, [character]: [] }));
      return;
    }

    const randomQuote =
      availableQuotes[Math.floor(Math.random() * availableQuotes.length)];
    const quoteIndex = characterInfo.quotes.indexOf(randomQuote);

    // Mark quote as used
    setUsedQuotes((prev) => ({
      ...prev,
      [character]: [...(prev[character] || []), quoteIndex],
    }));

    // Send the quote as a message
    sendMessage(randomQuote);
  };
  const AuthPrompt = ({ feature }) => (
    <div className="flex flex-col items-center justify-center min-h-[60vh] bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-8">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🔮</div>
        <h2 className="text-2xl font-bold text-indigo-900 mb-4">
          Sign In Required
        </h2>
        <p className="text-gray-700 mb-6">
          Create an account or sign in to access {feature} and unlock your full
          cosmic potential.
        </p>
        <button
          onClick={onLogin}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-300"
        >
          Sign In / Create Account
        </button>
      </div>
    </div>
  );

  return (
    <main className="flex-1 p-6 md:p-10 overflow-auto">
      {active === "zodiac" && (
        <div>
          <ZodiacCompatibility user={user} onLogin={onLogin} />
        </div>
      )}
      {active === "chat" && (
        <div>
          {user ? (
            <>
              {isMatched && matchData && !chatClosed ? (
                // Chat Interface - Use the same interface from ZodiacCompatibility
                <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white p-4 sm:p-6 md:p-8">
                  <div className="max-w-4xl mx-auto">
                    {/* Chat Header */}
                    <motion.div
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4 bg-white/10 p-4 rounded-xl backdrop-blur-sm"
                    >
                      <button
                        onClick={closeChat}
                        className="flex items-center space-x-2 bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded-lg transition-colors text-sm w-full sm:w-auto justify-center sm:justify-start text-white"
                        title="Close chat and return to queue"
                      >
                        <span>✕</span>
                        <span>Close</span>
                      </button>

                      <div className="text-center flex-1">
                        <h1 className="text-xl sm:text-2xl font-bold">
                          💬 Chatting with{" "}
                          {matchData?.partner?.name || "Partner"}
                        </h1>
                        <p className="text-sm text-purple-200">
                          {matchData?.partner?.sign &&
                            zodiacSymbols[matchData.partner.sign]}{" "}
                          {matchData?.partner?.sign || "Unknown"} •
                          {partnerDisconnected
                            ? " Partner disconnected"
                            : " Real person!"}
                        </p>
                      </div>

                      {partnerDisconnected ? (
                        <button
                          onClick={() => {
                            startNewMatch();
                            // Optionally navigate back to zodiac compatibility
                            setActive("zodiac");
                          }}
                          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-4 py-2 rounded-lg transition-colors text-sm text-white font-medium"
                        >
                          🔍 Back to Matching
                        </button>
                      ) : (
                        <div className="text-green-400 text-sm">
                          🟢 Connected
                        </div>
                      )}
                    </motion.div>

                    {/* Chat Messages */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="bg-white/5 rounded-xl p-4 mb-4 h-96 overflow-y-auto space-y-3"
                    >
                      {messages.map((message) => (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${
                            message.type === "sent"
                              ? "justify-end"
                              : message.type === "system"
                              ? "justify-center"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs sm:max-w-md p-3 rounded-lg ${
                              message.type === "sent"
                                ? "bg-gradient-to-r from-pink-500 to-purple-600 text-white"
                                : message.type === "system"
                                ? "bg-yellow-500/20 text-yellow-200 text-center text-sm"
                                : "bg-white/10 text-white"
                            }`}
                          >
                            <p className="text-sm sm:text-base">
                              {message.text}
                            </p>
                            <p className="text-xs opacity-70 mt-1">
                              {message.timestamp}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>

                    {/* Your Zodiac Characters Section */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                      className="bg-white/5 rounded-xl p-4 mb-4 border border-purple-300/20"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-2xl">
                          {zodiacSymbols[user?.zodiacChart?.sun]}
                        </span>
                        <h3 className="text-lg font-semibold text-purple-200">
                          Your {user?.zodiacChart?.sun} Characters
                        </h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {zodiacTraits[user?.zodiacChart?.sun]?.map(
                          (character, index) => {
                            const characterInfo = characterData[character];
                            return (
                              <button
                                key={index}
                                onClick={() => handleCharacterClick(character)}
                                className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 border border-purple-300/30 rounded-lg p-3 text-sm text-white transition-all duration-200 hover:scale-105 flex flex-col items-center gap-2"
                              >
                                {/* Character Image */}
                                <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                                  {characterInfo?.image ? (
                                    <img
                                      src={characterInfo.image}
                                      alt={character}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.style.display = "none";
                                        e.target.nextSibling.style.display =
                                          "flex";
                                      }}
                                    />
                                  ) : null}
                                  <div
                                    className="w-full h-full bg-purple-600 flex items-center justify-center text-white font-bold text-lg"
                                    style={{
                                      display: characterInfo?.image
                                        ? "none"
                                        : "flex",
                                    }}
                                  >
                                    {character
                                      .split(" ")
                                      .map((name) => name[0])
                                      .join("")}
                                  </div>
                                </div>

                                {/* Character Name */}
                                <div className="text-center">
                                  <span className="font-medium text-xs leading-tight">
                                    {character}
                                  </span>
                                </div>
                              </button>
                            );
                          }
                        )}
                      </div>
                      <p className="text-xs text-purple-300/70 mt-3 text-center">
                        Click a character to share a random quote! Each quote
                        appears only once until all are used.
                      </p>
                    </motion.div>

                    {/* Message Input */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && messageInput.trim()) {
                            sendMessage(messageInput.trim());
                            setMessageInput("");
                          }
                        }}
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-400"
                      />
                      <button
                        onClick={() => {
                          if (messageInput.trim()) {
                            sendMessage(messageInput.trim());
                            setMessageInput("");
                          }
                        }}
                        disabled={!messageInput.trim()}
                        className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all duration-200"
                      >
                        Send
                      </button>
                    </motion.div>
                  </div>
                </div>
              ) : (
                // Queue Interface - When not matched or chat closed
                <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-xl p-8">
                  <div className="text-center max-w-md">
                    <div className="text-6xl mb-6">💬</div>

                    {/* Show reopen chat option if there's an existing match */}
                    {isMatched && matchData && chatClosed ? (
                      <>
                        <h2 className="text-3xl font-bold text-white mb-4">
                          Chat Available
                        </h2>
                        <p className="text-purple-200 mb-8 text-lg">
                          You have an active conversation with{" "}
                          {matchData.partner.name}.
                          {partnerDisconnected ? " (Partner disconnected)" : ""}
                        </p>
                        <div className="flex flex-col gap-4">
                          <button
                            onClick={reopenChat}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                          >
                            💬 Reopen Chat
                          </button>
                          {!partnerDisconnected && (
                            <button
                              onClick={() => {
                                if (isQueuing) {
                                  cancelQueue();
                                } else {
                                  const userData = {
                                    sign: user.zodiacChart.sun,
                                    moon: user.zodiacChart.moon,
                                    rising: user.zodiacChart.rising,
                                    name: user.username,
                                  };
                                  joinQueue(userData);
                                }
                              }}
                              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-3 px-6 rounded-xl text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            >
                              {isQueuing
                                ? "🔄 Cancel Queue"
                                : "🌟 Find New Match 🌟"}
                            </button>
                          )}
                          {partnerDisconnected && (
                            <button
                              onClick={() => {
                                startNewMatch();
                                setActive("zodiac");
                              }}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-3 px-6 rounded-xl text-base shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                            >
                              🔍 Start Fresh Match
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <h2 className="text-3xl font-bold text-white mb-4">
                          {isQueuing
                            ? "Finding Your Match..."
                            : "Find Your Cosmic Match"}
                        </h2>
                        <p className="text-purple-200 mb-8 text-lg">
                          {isQueuing
                            ? "We're searching for someone who shares your zodiac energy..."
                            : "Connect with someone who shares your zodiac energy and discover your cosmic compatibility!"}
                        </p>
                        {isQueuing && (
                          <div className="mb-6">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                          </div>
                        )}
                        <button
                          onClick={() => {
                            if (!user) {
                              onLogin?.();
                              return;
                            }

                            if (isQueuing) {
                              cancelQueue();
                            } else {
                              const userData = {
                                sign: user.zodiacChart.sun,
                                moon: user.zodiacChart.moon,
                                rising: user.zodiacChart.rising,
                                name: user.username,
                              };
                              joinQueue(userData);
                            }
                          }}
                          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl text-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                        >
                          {isQueuing ? "🔄 Cancel Queue" : "🌟 Queue Up 🌟"}
                        </button>
                        <p className="text-purple-300 mt-4 text-sm">
                          Based on your {user.zodiacChart?.sun || "zodiac"} sign
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <AuthPrompt feature="Chat & Matching" />
          )}
        </div>
      )}
      {active === "storyteller" && (
        <div>
          {user ? (
            <div>
              <h1 className="text-3xl font-bold mb-6 text-indigo-900">
                Your Profile
              </h1>
              <div className="bg-white rounded-xl p-6 shadow-lg">
                <div className="flex items-center space-x-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {user.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-indigo-900">
                      {user.username}
                    </h2>
                    <p className="text-gray-600">
                      {user.zodiacChart.sun} ☉ {user.zodiacChart.moon} ☽{" "}
                      {user.zodiacChart.rising} ↗
                    </p>
                  </div>
                </div>
                <p className="text-gray-700">
                  Welcome to your cosmic profile! Visit the full profile page to
                  explore your complete astrological chart and discover your
                  unique cosmic blueprint.
                </p>
              </div>
            </div>
          ) : (
            <AuthPrompt feature="your profile" />
          )}
        </div>
      )}
      {active === "dreammaker" && (
        <div>
          {user ? (
            <div>
              <h1 className="text-3xl font-bold mb-6 text-indigo-900">
                Dreammaker
              </h1>
              <p className="text-gray-700 text-lg">
                Bring your dreams to life with AI.
              </p>
            </div>
          ) : (
            <AuthPrompt feature="Dreammaker" />
          )}
        </div>
      )}
      {active === "notes" && (
        <div>
          {user ? (
            <Notes user={user} />
          ) : (
            <AuthPrompt feature="your personal notes" />
          )}
        </div>
      )}
      {active === "cardgame" && (
        <div>
          <MysticElements user={user} onLogin={onLogin} />
        </div>
      )}
    </main>
  );
}
