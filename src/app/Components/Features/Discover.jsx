import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
} from "framer-motion";
import { useSocket } from "../../contexts/SocketContext";

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
  Aries: {
    best: ["Leo", "Sagittarius", "Gemini", "Aquarius"],
    good: ["Aries", "Libra", "Taurus"],
  },
  Taurus: {
    best: ["Virgo", "Capricorn", "Cancer", "Pisces"],
    good: ["Taurus", "Scorpio", "Gemini"],
  },
  Gemini: {
    best: ["Libra", "Aquarius", "Aries", "Leo"],
    good: ["Gemini", "Sagittarius", "Taurus"],
  },
  Cancer: {
    best: ["Scorpio", "Pisces", "Taurus", "Virgo"],
    good: ["Cancer", "Capricorn", "Gemini"],
  },
  Leo: {
    best: ["Aries", "Sagittarius", "Gemini", "Libra"],
    good: ["Leo", "Aquarius", "Cancer"],
  },
  Virgo: {
    best: ["Taurus", "Capricorn", "Cancer", "Scorpio"],
    good: ["Virgo", "Pisces", "Leo"],
  },
  Libra: {
    best: ["Gemini", "Aquarius", "Leo", "Sagittarius"],
    good: ["Libra", "Aries", "Virgo"],
  },
  Scorpio: {
    best: ["Cancer", "Pisces", "Virgo", "Capricorn"],
    good: ["Scorpio", "Taurus", "Libra"],
  },
  Sagittarius: {
    best: ["Aries", "Leo", "Libra", "Aquarius"],
    good: ["Sagittarius", "Gemini", "Scorpio"],
  },
  Capricorn: {
    best: ["Taurus", "Virgo", "Scorpio", "Pisces"],
    good: ["Capricorn", "Cancer", "Sagittarius"],
  },
  Aquarius: {
    best: ["Gemini", "Libra", "Aries", "Sagittarius"],
    good: ["Aquarius", "Leo", "Capricorn"],
  },
  Pisces: {
    best: ["Cancer", "Scorpio", "Taurus", "Capricorn"],
    good: ["Pisces", "Virgo", "Aquarius"],
  },
};

function getCompatibilityScore(mySun, theirSun) {
  if (!mySun || !theirSun) return 50;
  const compat = zodiacCompatibility[mySun];
  if (!compat) return 50;
  if (compat.best.includes(theirSun))
    return Math.floor(Math.random() * 16) + 85; // 85-100
  if (compat.good.includes(theirSun))
    return Math.floor(Math.random() * 20) + 65; // 65-84
  return Math.floor(Math.random() * 30) + 35; // 35-64
}

function getCompatibilityLabel(score) {
  if (score >= 85)
    return { label: "Cosmic Match ✨", color: "text-yellow-300" };
  if (score >= 65) return { label: "Good Vibes 💫", color: "text-purple-300" };
  return { label: "Interesting Contrast 🌙", color: "text-blue-300" };
}

function calculateAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age > 0 && age < 120 ? age : null;
}

// Swipeable card component
function SwipeCard({ profile, mySun, onSwipe, isTop }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 0, 200], [-25, 0, 25]);
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const passOpacity = useTransform(x, [-100, -20], [1, 0]);

  const compatibility = getCompatibilityScore(mySun, profile.sun_sign);
  const { label: compatLabel, color: compatColor } =
    getCompatibilityLabel(compatibility);
  const age = calculateAge(profile.birth_date);
  const emoji = profile.profile_emoji || "✨";

  const handleDragEnd = (_, info) => {
    if (info.offset.x > 100) {
      onSwipe("like", profile.id);
    } else if (info.offset.x < -100) {
      onSwipe("pass", profile.id);
    }
  };

  return (
    <motion.div
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      style={{ x, rotate }}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 cursor-grab active:cursor-grabbing select-none"
      whileDrag={{ scale: 1.03 }}
    >
      {/* Like / Pass overlays */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute top-8 left-8 z-10 bg-green-500/90 text-white text-2xl font-black px-4 py-2 rounded-xl border-4 border-green-400 rotate-[-15deg]"
      >
        LIKE 💚
      </motion.div>
      <motion.div
        style={{ opacity: passOpacity }}
        className="absolute top-8 right-8 z-10 bg-red-500/90 text-white text-2xl font-black px-4 py-2 rounded-xl border-4 border-red-400 rotate-[15deg]"
      >
        NOPE 💔
      </motion.div>

      {/* Card */}
      <div className="w-full h-full bg-gradient-to-br from-purple-900/90 via-indigo-900/90 to-blue-900/90 rounded-3xl border border-white/20 shadow-2xl overflow-hidden backdrop-blur-md flex flex-col">
        {/* Avatar section */}
        <div className="relative flex-shrink-0 h-52 bg-gradient-to-br from-purple-700 via-pink-700 to-indigo-700 flex items-center justify-center">
          <div className="w-28 h-28 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/30">
            <span className="text-5xl">{emoji}</span>
          </div>
          {/* Compatibility badge */}
          <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-bold text-yellow-300 border border-yellow-500/30">
            {compatibility}% ⚡
          </div>
        </div>

        {/* Info section */}
        <div className="flex-1 p-5 overflow-auto">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-xl font-bold text-white truncate">
              {profile.username}
            </h2>
            {age && (
              <span className="text-purple-300 text-sm font-semibold">
                {age}
              </span>
            )}
          </div>

          <p className={`text-sm font-semibold mb-3 ${compatColor}`}>
            {compatLabel}
          </p>

          {/* Zodiac signs */}
          <div className="flex gap-2 flex-wrap mb-4">
            {[
              { label: "Sun", sign: profile.sun_sign },
              { label: "Moon", sign: profile.moon_sign },
              { label: "Rising", sign: profile.rising_sign },
            ].map(
              ({ label, sign }) =>
                sign && (
                  <span
                    key={label}
                    className="bg-white/10 border border-white/20 text-white text-xs px-2 py-1 rounded-full"
                  >
                    {zodiacSymbols[sign] || ""} {label}: {sign}
                  </span>
                ),
            )}
          </div>

          {/* Bio */}
          {profile.bio && (
            <p className="text-purple-200 text-sm leading-relaxed line-clamp-3">
              {profile.bio}
            </p>
          )}
          {!profile.bio && (
            <p className="text-purple-400/60 text-sm italic">No bio yet...</p>
          )}

          {/* Looking for */}
          {profile.looking_for && profile.looking_for !== "everyone" && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-purple-300">Looking for:</span>
              <span className="text-xs bg-purple-600/40 border border-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full capitalize">
                {profile.looking_for}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function Discover({ user, onLogin, onNewMatch }) {
  const { socket, isAuthenticated } = useSocket();
  const [profiles, setProfiles] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  // Start false — only flip to true when we actually fire a request
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [matchNotification, setMatchNotification] = useState(null);
  const [swipeHistory, setSwipeHistory] = useState([]); // for undo
  const [datingProfile, setDatingProfile] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editLookingFor, setEditLookingFor] = useState("everyone");
  const [editEmoji, setEditEmoji] = useState("✨");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [outOfProfiles, setOutOfProfiles] = useState(false);

  const isGuest = user?.isGuest || !user;

  useEffect(() => {
    if (!socket || !isAuthenticated) return;

    setIsLoading(true);
    setLoadError(null);

    // Timeout guard — if server never responds, stop spinning after 10 s
    const timeout = setTimeout(() => {
      setIsLoading(false);
      setLoadError("Couldn't reach the server. Please refresh or try again.");
    }, 10000);

    // Use named functions so we can cleanly remove exactly these listeners
    const handleProfiles = (data) => {
      clearTimeout(timeout);
      setProfiles(data);
      setCurrentIndex(0);
      setOutOfProfiles(data.length === 0);
      setIsLoading(false);
      setLoadError(null);
    };

    const handleProfilesError = (err) => {
      clearTimeout(timeout);
      setIsLoading(false);
      setLoadError(err?.message || "Failed to load profiles.");
    };

    const handleDatingMatch = (data) => {
      setMatchNotification(data);
      if (onNewMatch) onNewMatch(data);
    };

    const handleDatingProfile = (profile) => {
      if (profile) {
        setDatingProfile(profile);
        setEditBio(profile.bio || "");
        setEditLookingFor(profile.looking_for || "everyone");
        setEditEmoji(profile.profile_emoji || "✨");
      }
    };

    const handleProfileUpdated = (profile) => {
      setDatingProfile(profile);
      setIsSavingProfile(false);
      setShowEditProfile(false);
    };

    socket.on("discover-profiles", handleProfiles);
    socket.on("discover-profiles-error", handleProfilesError);
    socket.on("dating-match", handleDatingMatch);
    socket.on("dating-profile", handleDatingProfile);
    socket.on("dating-profile-updated", handleProfileUpdated);

    socket.emit("get-discover-profiles");
    socket.emit("get-dating-profile");

    return () => {
      clearTimeout(timeout);
      socket.off("discover-profiles", handleProfiles);
      socket.off("discover-profiles-error", handleProfilesError);
      socket.off("dating-match", handleDatingMatch);
      socket.off("dating-profile", handleDatingProfile);
      socket.off("dating-profile-updated", handleProfileUpdated);
    };
  }, [socket, isAuthenticated]);

  const handleSwipe = useCallback(
    (direction, profileId) => {
      if (!socket || !isAuthenticated) return;

      const swipedProfile = profiles[currentIndex];
      setSwipeHistory((h) => [
        ...h,
        { index: currentIndex, profile: swipedProfile },
      ]);

      socket.emit("swipe", { targetId: profileId, direction });

      setCurrentIndex((i) => {
        const next = i + 1;
        if (next >= profiles.length) setOutOfProfiles(true);
        return next;
      });
    },
    [socket, isAuthenticated, profiles, currentIndex],
  );

  const handleUndo = () => {
    if (swipeHistory.length === 0) return;
    const last = swipeHistory[swipeHistory.length - 1];
    setSwipeHistory((h) => h.slice(0, -1));
    setCurrentIndex(last.index);
    setOutOfProfiles(false);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    setLoadError(null);
    setOutOfProfiles(false);
    setSwipeHistory([]);
    if (socket && isAuthenticated) {
      socket.emit("get-discover-profiles");
    }
  };

  const handleSaveProfile = () => {
    if (!socket || !isAuthenticated) return;
    setIsSavingProfile(true);
    socket.emit("update-dating-profile", {
      bio: editBio,
      lookingFor: editLookingFor,
      profileEmoji: editEmoji,
    });
  };

  // Guest screen
  if (isGuest) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-center max-w-sm">
          <div className="text-6xl mb-4">🔥</div>
          <h2 className="text-2xl font-bold text-white mb-3">
            Discover People
          </h2>
          <p className="text-purple-300 mb-6">
            Sign in to start swiping and find your cosmic match.
          </p>
          <button
            onClick={onLogin}
            className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white py-3 px-8 rounded-full font-bold text-lg transition-all duration-200 shadow-lg shadow-pink-900/40"
          >
            Sign In to Discover
          </button>
        </div>
      </div>
    );
  }

  const remainingProfiles = profiles.slice(currentIndex);
  const currentProfile = profiles[currentIndex];
  const mySun = user?.zodiacChart?.sun;

  const EMOJI_OPTIONS = [
    "✨",
    "🌙",
    "⭐",
    "🔥",
    "💫",
    "🌟",
    "🌸",
    "🦋",
    "🌈",
    "🎭",
    "🌺",
    "🦄",
    "🪐",
    "🌊",
    "🦅",
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 flex-shrink-0">
        <h1 className="text-xl font-bold text-white">Discover</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowEditProfile(true)}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm px-3 py-1.5 rounded-full transition-all duration-200"
          >
            ✏️ My Profile
          </button>
          <button
            onClick={handleRefresh}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm px-3 py-1.5 rounded-full transition-all duration-200"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 min-h-0">
        {/* Not yet connected to socket */}
        {!isAuthenticated && !isLoading ? (
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-purple-300">Connecting to server...</p>
          </div>
        ) : isLoading ? (
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-purple-300">Finding cosmic connections...</p>
          </div>
        ) : loadError ? (
          <div className="text-center max-w-xs">
            <div className="text-5xl mb-4">⚠️</div>
            <h3 className="text-lg font-bold text-white mb-2">
              Something went wrong
            </h3>
            <p className="text-purple-300 text-sm mb-5">{loadError}</p>
            <button
              onClick={handleRefresh}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-2 px-6 rounded-full font-semibold transition-all duration-200"
            >
              Try Again 🔄
            </button>
          </div>
        ) : outOfProfiles || remainingProfiles.length === 0 ? (
          <div className="text-center max-w-xs">
            <div className="text-6xl mb-4">🌌</div>
            <h3 className="text-xl font-bold text-white mb-2">
              You've seen everyone!
            </h3>
            <p className="text-purple-300 mb-6 text-sm">
              Check back later for new cosmic souls or refresh to start over.
            </p>
            <button
              onClick={handleRefresh}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white py-2 px-6 rounded-full font-semibold transition-all duration-200"
            >
              Refresh 🔄
            </button>
          </div>
        ) : (
          <div className="relative w-full max-w-sm h-[480px]">
            {/* Render up to 3 cards stacked, back to front */}
            {remainingProfiles.slice(0, 3).map((profile, i) => (
              <motion.div
                key={profile.id}
                className="absolute inset-0"
                style={{
                  zIndex: remainingProfiles.length - i,
                  scale: 1 - i * 0.04,
                  y: i * 10,
                }}
                initial={false}
              >
                {i === 0 ? (
                  <SwipeCard
                    profile={profile}
                    mySun={mySun}
                    onSwipe={handleSwipe}
                    isTop={true}
                  />
                ) : (
                  <div
                    className="w-full h-full bg-gradient-to-br from-purple-900/60 via-indigo-900/60 to-blue-900/60 rounded-3xl border border-white/10"
                    style={{ pointerEvents: "none" }}
                  />
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Action buttons */}
      {!isLoading && !outOfProfiles && remainingProfiles.length > 0 && (
        <div className="flex items-center justify-center gap-6 pb-6 pt-2 flex-shrink-0">
          {/* Undo */}
          <button
            onClick={handleUndo}
            disabled={swipeHistory.length === 0}
            className="w-12 h-12 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-xl transition-all duration-200"
            title="Undo"
          >
            ↩️
          </button>
          {/* Pass */}
          <button
            onClick={() =>
              currentProfile && handleSwipe("pass", currentProfile.id)
            }
            className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-400/60 hover:bg-red-500/40 flex items-center justify-center text-3xl transition-all duration-200 shadow-lg shadow-red-900/30"
            title="Pass"
          >
            ✕
          </button>
          {/* Like */}
          <button
            onClick={() =>
              currentProfile && handleSwipe("like", currentProfile.id)
            }
            className="w-16 h-16 rounded-full bg-green-500/20 border-2 border-green-400/60 hover:bg-green-500/40 flex items-center justify-center text-3xl transition-all duration-200 shadow-lg shadow-green-900/30"
            title="Like"
          >
            💚
          </button>
          {/* Super like */}
          <button
            onClick={() =>
              currentProfile && handleSwipe("like", currentProfile.id)
            }
            className="w-12 h-12 rounded-full bg-blue-500/20 border border-blue-400/60 hover:bg-blue-500/40 flex items-center justify-center text-xl transition-all duration-200"
            title="Super Like"
          >
            ⭐
          </button>
        </div>
      )}

      {/* Profiles remaining counter */}
      {!isLoading && remainingProfiles.length > 0 && (
        <div className="text-center pb-2 text-xs text-purple-400/60">
          {remainingProfiles.length} profile
          {remainingProfiles.length !== 1 ? "s" : ""} remaining
        </div>
      )}

      {/* Match notification */}
      <AnimatePresence>
        {matchNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setMatchNotification(null)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.5, opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-gradient-to-br from-pink-900 via-purple-900 to-indigo-900 p-8 rounded-3xl border border-pink-400/40 max-w-sm w-full text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="text-6xl mb-4"
              >
                💕
              </motion.div>
              <h2 className="text-3xl font-black text-white mb-2">
                It's a Match!
              </h2>
              <p className="text-pink-300 text-lg mb-1">You and</p>
              <p className="text-2xl font-bold text-white mb-1">
                {matchNotification.partnerUsername}
              </p>
              <p className="text-pink-300 mb-6">liked each other ✨</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setMatchNotification(null)}
                  className="flex-1 bg-white/10 border border-white/20 text-white py-3 rounded-xl hover:bg-white/20 transition-all duration-200 font-semibold"
                >
                  Keep Swiping
                </button>
                <button
                  onClick={() => {
                    setMatchNotification(null);
                    if (onNewMatch) onNewMatch(matchNotification);
                  }}
                  className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 text-white py-3 rounded-xl hover:from-pink-500 hover:to-purple-500 transition-all duration-200 font-semibold"
                >
                  Say Hi 💬
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {showEditProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowEditProfile(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 p-6 rounded-3xl border border-purple-400/30 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-white mb-5">
                Your Dating Profile
              </h3>

              {/* Emoji picker */}
              <div className="mb-5">
                <label className="text-purple-300 text-sm block mb-2">
                  Profile Emoji
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMOJI_OPTIONS.map((em) => (
                    <button
                      key={em}
                      onClick={() => setEditEmoji(em)}
                      className={`w-10 h-10 rounded-full text-xl flex items-center justify-center transition-all duration-150 ${
                        editEmoji === em
                          ? "bg-purple-500/60 border-2 border-purple-400 scale-110"
                          : "bg-white/10 border border-white/20 hover:bg-white/20"
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bio */}
              <div className="mb-5">
                <label className="text-purple-300 text-sm block mb-2">
                  Bio
                </label>
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Tell people about yourself..."
                  maxLength={200}
                  rows={3}
                  className="w-full bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-400/60 px-4 py-3 text-sm resize-none focus:outline-none focus:border-purple-400"
                />
                <div className="text-right text-xs text-purple-400/60 mt-1">
                  {editBio.length}/200
                </div>
              </div>

              {/* Looking for */}
              <div className="mb-6">
                <label className="text-purple-300 text-sm block mb-2">
                  Looking for
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "everyone",
                    "friendship",
                    "casual",
                    "relationship",
                    "soulmate",
                  ].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setEditLookingFor(opt)}
                      className={`px-3 py-1.5 rounded-full text-sm capitalize transition-all duration-150 ${
                        editLookingFor === opt
                          ? "bg-purple-600 text-white border border-purple-400"
                          : "bg-white/10 text-purple-300 border border-white/20 hover:bg-white/20"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowEditProfile(false)}
                  className="flex-1 bg-white/10 border border-white/20 text-white py-3 rounded-xl hover:bg-white/20 transition-all duration-200 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSavingProfile}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl hover:from-purple-500 hover:to-pink-500 transition-all duration-200 font-semibold disabled:opacity-60"
                >
                  {isSavingProfile ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
