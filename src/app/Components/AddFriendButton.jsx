"use client";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSocket } from "../contexts/SocketContext";

/**
 * Reusable "Add Friend" button.
 * Shows an animated toast when the users are already friends.
 *
 * Props:
 *   username  – the username to add
 *   size      – "sm" (default) | "md"
 *   className – extra Tailwind classes
 */
export default function AddFriendButton({
  username,
  size = "sm",
  className = "",
}) {
  const { friends, sentInvitations, sendFriendInvitation, isAuthenticated } =
    useSocket();
  const [justSent, setJustSent] = useState(false);
  const [showAlreadyFriendsToast, setShowAlreadyFriendsToast] = useState(false);
  const toastTimer = useRef(null);

  useEffect(() => () => clearTimeout(toastTimer.current), []);

  if (!username || !isAuthenticated) return null;

  const isFriend = friends?.some(
    (f) => f.username?.toLowerCase() === username.toLowerCase(),
  );
  const isPending =
    justSent ||
    sentInvitations?.some(
      (s) => s.toUsername?.toLowerCase() === username.toLowerCase(),
    );

  const handleClick = (e) => {
    e.stopPropagation();
    if (isPending) return;
    if (isFriend) {
      // Already friends – show animated notification
      setShowAlreadyFriendsToast(true);
      clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(
        () => setShowAlreadyFriendsToast(false),
        2500,
      );
      return;
    }
    sendFriendInvitation(username);
    setJustSent(true);
  };

  const base =
    size === "md"
      ? "px-4 py-2 text-sm font-semibold rounded-xl"
      : "px-3 py-1.5 text-xs font-semibold rounded-full";

  return (
    <div className="relative inline-flex">
      {/* Already-friends toast */}
      <AnimatePresence>
        {showAlreadyFriendsToast && (
          <motion.div
            key="already-friends-toast"
            initial={{ opacity: 0, y: 8, scale: 0.85 }}
            animate={{ opacity: 1, y: -36, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 whitespace-nowrap z-50
                       bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold
                       px-3 py-1.5 rounded-full shadow-lg shadow-green-900/40 pointer-events-none
                       flex items-center gap-1.5"
          >
            <motion.span
              animate={{ rotate: [0, 20, -20, 10, 0] }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              ✨
            </motion.span>
            Already friends!
            <motion.span
              animate={{ rotate: [0, -20, 20, -10, 0] }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              ✨
            </motion.span>
          </motion.div>
        )}
      </AnimatePresence>

      {isFriend ? (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleClick}
          className={`inline-flex items-center gap-1 bg-green-600/20 border border-green-500/30 text-green-300 cursor-pointer ${base} ${className}`}
        >
          ✓ Friends
        </motion.button>
      ) : isPending ? (
        <span
          className={`inline-flex items-center gap-1 bg-white/10 border border-white/20 text-purple-300 ${base} ${className}`}
        >
          ⏳ Pending
        </span>
      ) : (
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleClick}
          className={`inline-flex items-center gap-1 bg-indigo-600/80 hover:bg-indigo-500 border border-indigo-400/30 text-white transition-all duration-200 ${base} ${className}`}
        >
          👤 Add Friend
        </motion.button>
      )}
    </div>
  );
}
