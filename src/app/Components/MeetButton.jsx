"use client";
import React from "react";
import { motion } from "framer-motion";
import { useSocket } from "../contexts/SocketContext";

/**
 * Reusable "Meet" button – sends a direct video-call invite to `username`.
 *
 * Props:
 *   username  – target username
 *   size      – "sm" (default) | "md"
 *   className – extra Tailwind classes
 */
export default function MeetButton({ username, size = "sm", className = "" }) {
  const { isAuthenticated, sendMeetInvite, pendingMeetInvites } = useSocket();

  if (!username || !isAuthenticated) return null;

  const isPending = pendingMeetInvites?.some(
    (i) => i.toUsername?.toLowerCase() === username.toLowerCase(),
  );

  const base =
    size === "md"
      ? "px-4 py-2 text-sm font-semibold rounded-xl"
      : "px-3 py-1.5 text-xs font-semibold rounded-full";

  const handleClick = (e) => {
    e.stopPropagation();
    if (isPending) return;
    sendMeetInvite(username);
  };

  if (isPending) {
    return (
      <motion.span
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        className={`inline-flex items-center gap-1 bg-blue-600/20 border border-blue-400/30 text-blue-300 ${base} ${className}`}
      >
        📡 Invite Sent
      </motion.span>
    );
  }

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleClick}
      className={`inline-flex items-center gap-1 bg-gradient-to-r from-blue-600/80 to-cyan-600/80 hover:from-blue-500 hover:to-cyan-500 border border-blue-400/30 text-white transition-all duration-200 ${base} ${className}`}
    >
      🌐 Meet
    </motion.button>
  );
}
