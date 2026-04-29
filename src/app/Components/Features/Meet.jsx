"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
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

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

// Phase states: idle | requesting-camera | queuing | connected | ended

export default function Meet({ user, onLogin }) {
  const { socket, directMeetSession, clearDirectMeetSession } = useSocket();

  const [phase, setPhase] = useState("idle");
  const [camError, setCamError] = useState(null);
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const pcRef = useRef(null);
  const matchIdRef = useRef(null);
  const isInitiatorRef = useRef(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const phaseRef = useRef("idle");

  const mySun = user?.zodiacChart?.sun;

  // Keep a ref so reconnect handlers can read the current phase without stale closures
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const stopLocalStream = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
  }, []);

  const closePeerConnection = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
  }, []);

  const leaveSession = useCallback(
    (nextPhase = "idle") => {
      if (socket && matchIdRef.current) {
        socket.emit("meet-leave", { matchId: matchIdRef.current });
      }
      closePeerConnection();
      stopLocalStream();
      matchIdRef.current = null;
      isInitiatorRef.current = false;
      setPartner(null);
      setMessages([]);
      setPhase(nextPhase);
    },
    [socket, closePeerConnection, stopLocalStream],
  );

  const startCamera = useCallback(async () => {
    setCamError(null);
    setPhase("requesting-camera");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      return stream;
    } catch (err) {
      setCamError(
        err.name === "NotAllowedError"
          ? "Camera/microphone permission denied. Please allow access and try again."
          : "Could not access camera or microphone.",
      );
      setPhase("idle");
      return null;
    }
  }, []);

  const handleStart = useCallback(async () => {
    if (!user) {
      onLogin?.();
      return;
    }
    const stream = await startCamera();
    if (!stream || !socket) return;
    setPhase("queuing");
    socket.emit("meet-join-queue", {
      name: user.username,
      sign: user.zodiacChart?.sun || null,
    });
  }, [user, onLogin, startCamera, socket]);

  const handleNext = useCallback(() => {
    closePeerConnection();
    if (socket && matchIdRef.current)
      socket.emit("meet-leave", { matchId: matchIdRef.current });
    matchIdRef.current = null;
    isInitiatorRef.current = false;
    setPartner(null);
    setMessages([]);
    setPhase("queuing");
    if (socket)
      socket.emit("meet-join-queue", {
        name: user.username,
        sign: user.zodiacChart?.sun || null,
      });
  }, [socket, user, closePeerConnection]);

  const handleStop = useCallback(() => {
    if (socket) socket.emit("meet-cancel-queue");
    leaveSession("idle");
  }, [socket, leaveSession]);

  const createPeerConnection = useCallback(() => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;
    if (localStreamRef.current) {
      localStreamRef.current
        .getTracks()
        .forEach((track) => pc.addTrack(track, localStreamRef.current));
    }
    pc.ontrack = (e) => {
      if (remoteVideoRef.current && e.streams[0])
        remoteVideoRef.current.srcObject = e.streams[0];
    };
    pc.onicecandidate = (e) => {
      if (e.candidate && socket && matchIdRef.current) {
        socket.emit("meet-webrtc-ice-candidate", {
          matchId: matchIdRef.current,
          candidate: e.candidate,
        });
      }
    };
    pc.onconnectionstatechange = () => {
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        setPartner((prev) => (prev ? { ...prev, left: true } : prev));
      }
    };
    return pc;
  }, [socket]);

  useEffect(() => {
    if (!socket) return;

    const onMatched = async ({ matchId, isInitiator, partner: p }) => {
      matchIdRef.current = matchId;
      isInitiatorRef.current = isInitiator;
      setPartner(p);
      setMessages([]);
      setPhase("connected");
      const pc = createPeerConnection();
      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("meet-webrtc-offer", { matchId, offer });
      }
    };

    const onOffer = async ({ offer }) => {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("meet-webrtc-answer", {
        matchId: matchIdRef.current,
        answer,
      });
    };

    const onAnswer = async ({ answer }) => {
      const pc = pcRef.current;
      if (!pc) return;
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const onIceCandidate = async ({ candidate }) => {
      const pc = pcRef.current;
      if (!pc || !candidate) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (_) {}
    };

    const onPartnerLeft = () => {
      closePeerConnection();
      matchIdRef.current = null;
      setPhase("ended");
    };

    const onMessage = ({ text }) => {
      setMessages((prev) => [...prev, { id: Date.now(), from: "them", text }]);
    };

    socket.on("meet-matched", onMatched);
    socket.on("meet-webrtc-offer", onOffer);
    socket.on("meet-webrtc-answer", onAnswer);
    socket.on("meet-webrtc-ice-candidate", onIceCandidate);
    socket.on("meet-partner-left", onPartnerLeft);
    socket.on("meet-message", onMessage);

    // Re-join queue automatically if the socket reconnects while waiting
    const onReconnect = () => {
      if (phaseRef.current === "queuing" && user) {
        socket.emit("meet-join-queue", {
          name: user.username,
          sign: user.zodiacChart?.sun || null,
        });
      } else if (phaseRef.current === "connected") {
        // Partner is gone after reconnect – go back to ended screen
        closePeerConnection();
        matchIdRef.current = null;
        setPhase("ended");
      }
    };
    socket.on("connect", onReconnect);

    return () => {
      socket.off("meet-matched", onMatched);
      socket.off("meet-webrtc-offer", onOffer);
      socket.off("meet-webrtc-answer", onAnswer);
      socket.off("meet-webrtc-ice-candidate", onIceCandidate);
      socket.off("meet-partner-left", onPartnerLeft);
      socket.off("meet-message", onMessage);
      socket.off("connect", onReconnect);
    };
  }, [socket, user, createPeerConnection, closePeerConnection]);

  // Handle direct meet session (invite accepted by the other party)
  useEffect(() => {
    if (!directMeetSession || !socket) return;
    const { matchId, isInitiator, partner: p } = directMeetSession;
    // Start camera, then immediately enter connected phase
    (async () => {
      let stream = localStreamRef.current;
      if (!stream) {
        setCamError(null);
        setPhase("requesting-camera");
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });
          localStreamRef.current = stream;
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        } catch (err) {
          setCamError("Could not access camera/microphone for direct call.");
          setPhase("idle");
          clearDirectMeetSession();
          return;
        }
      }
      matchIdRef.current = matchId;
      isInitiatorRef.current = isInitiator;
      setPartner(p);
      setMessages([]);
      setPhase("connected");
      const pc = createPeerConnection();
      if (isInitiator) {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("meet-webrtc-offer", { matchId, offer });
      }
      clearDirectMeetSession();
    })();
  }, [directMeetSession, socket, createPeerConnection, clearDirectMeetSession]);

  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [phase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const toggleMic = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setMicMuted((m) => !m);
  };

  const toggleCam = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getVideoTracks().forEach((t) => {
      t.enabled = !t.enabled;
    });
    setCamOff((c) => !c);
  };

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || !socket || !matchIdRef.current) return;
    socket.emit("meet-message", { matchId: matchIdRef.current, text });
    setMessages((prev) => [...prev, { id: Date.now(), from: "me", text }]);
    setInput("");
  }, [input, socket]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {phase === "idle" && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
          <div className="text-center max-w-sm">
            <div className="text-6xl mb-5">🌐</div>
            <h1 className="text-3xl font-extrabold text-white mb-3">Meet</h1>
            <p className="text-purple-300 text-base mb-3 leading-relaxed">
              Get instantly paired with a random person for a live video chat.
              Vibe, skip, repeat ✨
            </p>
            {camError && (
              <p className="text-red-400 text-sm mb-4 bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-2">
                {camError}
              </p>
            )}
            {user ? (
              <button
                onClick={handleStart}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-400 hover:to-emerald-400 text-white font-bold text-xl py-4 px-12 rounded-full shadow-lg shadow-green-900/40 transition-all duration-200 hover:scale-105 active:scale-95"
              >
                Start
              </button>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <p className="text-purple-400 text-sm">
                  Sign in to start meeting people
                </p>
                <button
                  onClick={onLogin}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all duration-200"
                >
                  Sign In
                </button>
              </div>
            )}
            {user && (
              <p className="text-purple-400/70 text-xs mt-5">
                You will appear as{" "}
                <span className="text-purple-300 font-semibold">
                  {user.username}
                </span>
                {mySun && (
                  <span>
                    {" "}
                    · {zodiacSymbols[mySun]} {mySun}
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      )}

      {phase === "requesting-camera" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-purple-300">Requesting camera access…</p>
        </div>
      )}

      {phase === "queuing" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 relative">
          <div className="relative w-56 h-40 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl bg-black">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-2 left-2 text-xs text-white/70 bg-black/40 rounded px-1">
              You
            </div>
          </div>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            className="w-10 h-10 border-4 border-purple-400 border-t-transparent rounded-full"
          />
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-1">Searching…</h2>
            <p className="text-purple-300 text-sm">
              Looking for someone to connect with
            </p>
          </div>
          <button
            onClick={handleStop}
            className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-2.5 px-8 rounded-full transition-all duration-200"
          >
            Stop
          </button>
        </div>
      )}

      {phase === "connected" && (
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="flex-1 relative bg-black min-h-0">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {partner && (
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5 text-white text-sm">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="font-semibold">{partner.name}</span>
                  {partner.sign && (
                    <span className="text-purple-300 text-xs">
                      {zodiacSymbols[partner.sign]} {partner.sign}
                    </span>
                  )}
                </div>
                <AddFriendButton username={partner.name} />
              </div>
            )}

            {partner?.left && (
              <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4">
                <p className="text-white text-lg font-semibold">
                  Stranger disconnected
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={handleNext}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-8 rounded-full"
                  >
                    Next ⏭
                  </button>
                  <button
                    onClick={handleStop}
                    className="bg-white/20 hover:bg-white/30 text-white py-2.5 px-6 rounded-full"
                  >
                    Stop
                  </button>
                </div>
              </div>
            )}

            <div className="absolute bottom-16 right-3 w-28 h-20 rounded-xl overflow-hidden border-2 border-white/30 shadow-xl bg-black">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${camOff ? "invisible" : ""}`}
              />
              {camOff && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white text-2xl">
                  📷
                </div>
              )}
            </div>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <button
                onClick={toggleMic}
                title={micMuted ? "Unmute" : "Mute"}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-200 ${micMuted ? "bg-red-600 hover:bg-red-500" : "bg-black/50 hover:bg-black/70 border border-white/20"}`}
              >
                {micMuted ? "🔇" : "🎙️"}
              </button>
              <button
                onClick={toggleCam}
                title={camOff ? "Turn camera on" : "Turn camera off"}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all duration-200 ${camOff ? "bg-red-600 hover:bg-red-500" : "bg-black/50 hover:bg-black/70 border border-white/20"}`}
              >
                {camOff ? "📷" : "🎥"}
              </button>
              <button
                onClick={handleNext}
                className="bg-blue-600/90 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200"
              >
                Next ⏭
              </button>
              <button
                onClick={handleStop}
                className="bg-red-600/90 hover:bg-red-500 text-white text-sm font-semibold px-4 py-2 rounded-full transition-all duration-200"
              >
                Stop ✕
              </button>
            </div>
          </div>

          <ChatStrip
            messages={messages}
            input={input}
            setInput={setInput}
            onSend={handleSend}
            onKeyDown={handleKeyDown}
            messagesEndRef={messagesEndRef}
            inputRef={inputRef}
            disabled={!!partner?.left}
          />
        </div>
      )}

      {phase === "ended" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          <div className="text-center">
            <div className="text-5xl mb-4">👋</div>
            <h2 className="text-xl font-bold text-white mb-2">
              Stranger has disconnected
            </h2>
            <p className="text-purple-300 text-sm mb-6">
              Ready for the next one?
            </p>
            {partner?.name && (
              <div className="flex gap-2 justify-center mb-4 flex-wrap">
                <AddFriendButton username={partner.name} size="md" />
                <MeetButton username={partner.name} size="md" />
              </div>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleNext}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold py-3 px-8 rounded-full transition-all duration-200"
              >
                Next ⏭
              </button>
              <button
                onClick={handleStop}
                className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold py-3 px-6 rounded-full transition-all duration-200"
              >
                Stop
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChatStrip({
  messages,
  input,
  setInput,
  onSend,
  onKeyDown,
  messagesEndRef,
  inputRef,
  disabled,
}) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);

  const prevLenRef = useRef(messages.length);
  useEffect(() => {
    if (!open && messages.length > prevLenRef.current) {
      const newest = messages[messages.length - 1];
      if (newest && newest.from === "them") setUnread((u) => u + 1);
    }
    prevLenRef.current = messages.length;
  }, [messages, open]);

  const handleOpen = () => {
    setOpen(true);
    setUnread(0);
  };

  return (
    <div className="flex-shrink-0 border-t border-white/10 bg-black/40 backdrop-blur-sm">
      <button
        onClick={() => (open ? setOpen(false) : handleOpen())}
        className="w-full flex items-center justify-between px-4 py-2 text-sm text-purple-300 hover:text-white transition-colors"
      >
        <span className="flex items-center gap-2">
          💬 Chat
          {unread > 0 && !open && (
            <span className="bg-pink-600 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
              {unread}
            </span>
          )}
        </span>
        <span className="text-xs opacity-60">{open ? "▼" : "▲"}</span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 220, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden flex flex-col"
            style={{ height: 220 }}
          >
            <div
              className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0"
              style={{ maxHeight: 162 }}
            >
              {messages.length === 0 && (
                <p className="text-purple-400/50 text-xs text-center mt-4">
                  Say hello 👋
                </p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"}`}
                >
                  <span
                    className={`max-w-[80%] rounded-2xl px-3 py-1.5 text-sm leading-snug ${msg.from === "me" ? "bg-purple-600 text-white rounded-br-sm" : "bg-white/15 text-purple-100 rounded-bl-sm"}`}
                  >
                    {msg.text}
                  </span>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex-shrink-0 flex gap-2 px-3 pb-2 pt-1">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                disabled={disabled}
                placeholder={disabled ? "Chat ended" : "Type a message…"}
                maxLength={500}
                className="flex-1 bg-white/10 border border-white/20 rounded-full px-3 py-1.5 text-white placeholder-purple-400/50 text-sm focus:outline-none focus:border-purple-400 transition-all disabled:opacity-40"
              />
              <button
                onClick={onSend}
                disabled={disabled || !input.trim()}
                className="bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-semibold px-4 py-1.5 rounded-full text-sm transition-all"
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
