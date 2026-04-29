import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../../contexts/SocketContext";
import AddFriendButton from "../AddFriendButton";
import MeetButton from "../MeetButton";

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

const zodiacCompatibility = {
  Aries: { best: ["Leo", "Sagittarius", "Gemini", "Aquarius"] },
  Taurus: { best: ["Virgo", "Capricorn", "Cancer", "Pisces"] },
  Gemini: { best: ["Libra", "Aquarius", "Aries", "Leo"] },
  Cancer: { best: ["Scorpio", "Pisces", "Taurus", "Virgo"] },
  Leo: { best: ["Aries", "Sagittarius", "Gemini", "Libra"] },
  Virgo: { best: ["Taurus", "Capricorn", "Cancer", "Scorpio"] },
  Libra: { best: ["Gemini", "Aquarius", "Leo", "Sagittarius"] },
  Scorpio: { best: ["Cancer", "Pisces", "Virgo", "Capricorn"] },
  Sagittarius: { best: ["Aries", "Leo", "Libra", "Aquarius"] },
  Capricorn: { best: ["Taurus", "Virgo", "Scorpio", "Pisces"] },
  Aquarius: { best: ["Gemini", "Libra", "Aries", "Sagittarius"] },
  Pisces: { best: ["Cancer", "Scorpio", "Taurus", "Capricorn"] },
};

function getCompatibilityScore(mySun, theirSun) {
  if (!mySun || !theirSun) return 72;
  const best = zodiacCompatibility[mySun]?.best || [];
  if (best.includes(theirSun)) return 92;
  return 68;
}

function timeSince(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function MatchCard({ match, mySun, onStartChat }) {
  const score = getCompatibilityScore(mySun, match.sun_sign);
  const emoji = match.profile_emoji || "✨";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-purple-900/60 via-indigo-900/60 to-blue-900/60 border border-white/15 rounded-2xl p-4 flex flex-col gap-3 hover:border-purple-400/40 transition-all duration-200 group"
    >
      {/* Avatar + Name row */}
      <div className="flex items-center gap-3">
        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-2xl flex-shrink-0 shadow-lg border-2 border-white/20">
          {emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-bold truncate">
              {match.partner_username}
            </h3>
            <span className="text-yellow-300 text-xs font-bold flex-shrink-0">
              {score}% ⚡
            </span>
          </div>
          {match.sun_sign && (
            <p className="text-purple-300 text-xs">
              {zodiacSymbols[match.sun_sign]} {match.sun_sign}
              {match.moon_sign && ` · 🌙 ${match.moon_sign}`}
            </p>
          )}
        </div>
        <div className="text-xs text-purple-400/60 flex-shrink-0">
          {timeSince(match.matched_at)}
        </div>
      </div>

      {/* Bio snippet */}
      {match.bio && (
        <p className="text-purple-300 text-sm line-clamp-2 leading-relaxed">
          {match.bio}
        </p>
      )}

      {/* Signs row */}
      <div className="flex gap-1.5 flex-wrap">
        {[
          { label: "☀️", sign: match.sun_sign },
          { label: "🌙", sign: match.moon_sign },
          { label: "⬆️", sign: match.rising_sign },
        ].map(
          ({ label, sign }) =>
            sign && (
              <span
                key={label}
                className="bg-white/10 text-purple-200 text-xs px-2 py-0.5 rounded-full"
              >
                {label} {sign}
              </span>
            ),
        )}
        {match.looking_for && match.looking_for !== "everyone" && (
          <span className="bg-pink-500/20 border border-pink-500/30 text-pink-300 text-xs px-2 py-0.5 rounded-full capitalize">
            {match.looking_for}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => onStartChat(match)}
          className="flex-1 bg-gradient-to-r from-pink-600/80 to-purple-600/80 hover:from-pink-500 hover:to-purple-500 border border-pink-500/30 text-white text-sm font-semibold py-2.5 rounded-xl transition-all duration-200 group-hover:shadow-lg group-hover:shadow-pink-900/30"
        >
          💬 Send a Message
        </button>
        <AddFriendButton username={match.partner_username} size="md" />
        <MeetButton username={match.partner_username} size="md" />
      </div>
    </motion.div>
  );
}

export default function Matches({ user, onLogin, onStartChat }) {
  const { socket, isAuthenticated } = useSocket();
  const [matches, setMatches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // all | recent | compatible

  const isGuest = user?.isGuest || !user;

  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    const timeout = setTimeout(() => setIsLoading(false), 10000);

    const handleMatches = (data) => {
      clearTimeout(timeout);
      setMatches(data);
      setIsLoading(false);
    };

    const handleMatchesError = () => {
      clearTimeout(timeout);
      setIsLoading(false);
    };

    socket.on("dating-matches", handleMatches);
    socket.on("dating-matches-error", handleMatchesError);

    // Listen for new real-time matches
    socket.on("dating-match", () => {
      // Refresh the matches list when a new match comes in
      socket.emit("get-dating-matches");
    });

    socket.emit("get-dating-matches");

    return () => {
      clearTimeout(timeout);
      socket.off("dating-matches", handleMatches);
      socket.off("dating-matches-error", handleMatchesError);
      socket.off("dating-match");
    };
  }, [socket, isAuthenticated]);

  if (isGuest) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">💕</div>
          <h2 className="text-2xl font-bold text-white mb-3">Your Matches</h2>
          <p className="text-purple-300 mb-6">
            Sign in to see who likes you back.
          </p>
          <button
            onClick={onLogin}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white py-3 px-8 rounded-full font-bold text-lg transition-all duration-200 shadow-lg shadow-pink-900/40"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const mySun = user?.zodiacChart?.sun;

  const filteredMatches = (() => {
    if (filter === "recent")
      return [...matches].sort(
        (a, b) => new Date(b.matched_at) - new Date(a.matched_at),
      );
    if (filter === "compatible") {
      return [...matches].sort(
        (a, b) =>
          getCompatibilityScore(mySun, b.sun_sign) -
          getCompatibilityScore(mySun, a.sun_sign),
      );
    }
    return matches;
  })();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold text-white">
            💕 Matches
            {matches.length > 0 && (
              <span className="ml-2 bg-pink-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {matches.length}
              </span>
            )}
          </h1>
          <button
            onClick={() => {
              setIsLoading(true);
              socket?.emit("get-dating-matches");
            }}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm px-3 py-1.5 rounded-full transition-all duration-200"
          >
            🔄
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {[
            { id: "all", label: "All" },
            { id: "recent", label: "Recent" },
            { id: "compatible", label: "Most Compatible" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-all duration-200 ${
                filter === tab.id
                  ? "bg-purple-600 text-white border border-purple-400"
                  : "bg-white/10 text-purple-300 border border-white/20 hover:bg-white/20"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-4 pb-4 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredMatches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-5xl mb-4">🌌</div>
            <h3 className="text-lg font-bold text-white mb-2">
              No matches yet
            </h3>
            <p className="text-purple-300 text-sm">
              Start swiping in Discover to find your cosmic connections!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence>
              {filteredMatches.map((match) => (
                <MatchCard
                  key={match.match_id}
                  match={match}
                  mySun={mySun}
                  onStartChat={onStartChat}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
