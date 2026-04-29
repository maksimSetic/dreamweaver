import { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children, onMatchFound, user }) => {
  // Store user credentials for authentication
  const [userCredentials, setUserCredentials] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isQueuing, setIsQueuing] = useState(false);

  // Use ref to store onMatchFound to prevent useEffect dependency issues
  const onMatchFoundRef = useRef(onMatchFound);

  // Update the ref when onMatchFound changes
  useEffect(() => {
    onMatchFoundRef.current = onMatchFound;
  }, [onMatchFound]);
  // All localStorage state initializes to safe server-side defaults.
  // Hydration from localStorage happens in a useEffect below (client-only).
  const [chatClosed, setChatClosed] = useState(false);
  const [partnerDisconnected, setPartnerDisconnected] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [matchData, setMatchData] = useState(null);
  // Store original temporary match data separately to preserve it when switching chats
  const [originalTempMatch, setOriginalTempMatch] = useState(null);
  // Store original temporary match messages separately
  const [originalTempMessages, setOriginalTempMessages] = useState([]);
  const [messages, setMessages] = useState([]);
  // Tracks whether client-side hydration from localStorage has completed.
  // Save effects must not run before hydration to avoid overwriting persisted data.
  const [isHydrated, setIsHydrated] = useState(false);
  const [persistentChats, setPersistentChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);

  // Friends state
  const [friends, setFriends] = useState([]);
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [sentInvitations, setSentInvitations] = useState([]);

  // Chat requests state
  const [chatRequests, setChatRequests] = useState([]);
  const [sentChatRequests, setSentChatRequests] = useState([]);

  // Chat request acceptance modal state
  const [showChatAcceptedModal, setShowChatAcceptedModal] = useState(false);
  const [chatAcceptedData, setChatAcceptedData] = useState(null);

  // Hydrate all localStorage-backed state on mount (client-only).
  // Must be declared BEFORE the save effects so it runs first in the initial
  // effects cycle, setting isHydrated=true before save effects are allowed to write.
  useEffect(() => {
    try {
      const savedState = localStorage.getItem("dreamweaver-match-state");
      if (savedState) {
        const parsed = JSON.parse(savedState);
        setChatClosed(parsed.chatClosed || false);
        setPartnerDisconnected(parsed.partnerDisconnected || false);
        setIsMatched(parsed.isMatched || false);
        setMatchData(parsed.matchData || null);
        setOriginalTempMatch(parsed.originalTempMatch || null);
      }
      const savedTempMessages = localStorage.getItem(
        "dreamweaver-temp-messages",
      );
      if (savedTempMessages)
        setOriginalTempMessages(JSON.parse(savedTempMessages));
      const savedMessages = localStorage.getItem("dreamweaver-messages");
      if (savedMessages) setMessages(JSON.parse(savedMessages));
    } catch {
      // Ignore parse errors – start with empty state
    }
    setIsHydrated(true);
  }, []);

  // Save match state to localStorage whenever it changes.
  // Gated on isHydrated to prevent overwriting persisted data on the first render.
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(
      "dreamweaver-match-state",
      JSON.stringify({
        isMatched,
        matchData,
        partnerDisconnected,
        chatClosed,
        originalTempMatch,
      }),
    );
  }, [
    isHydrated,
    isMatched,
    matchData,
    partnerDisconnected,
    chatClosed,
    originalTempMatch,
  ]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem("dreamweaver-messages", JSON.stringify(messages));
  }, [isHydrated, messages]);

  // Save temporary match messages separately
  useEffect(() => {
    if (!isHydrated) return;
    localStorage.setItem(
      "dreamweaver-temp-messages",
      JSON.stringify(originalTempMessages),
    );
  }, [isHydrated, originalTempMessages]);

  // Note: Navigation to chat is handled directly in the "match-found" event listener below
  // No need for additional useEffect that forces navigation on state changes

  useEffect(() => {
    // Tracks a friend chat that needs to be opened once persistent-chats refreshes.
    // Local to this closure so both handlers share the same reference without a React ref.
    let pendingFriendChatToOpen = null;

    // Initialize socket connection with auto-reconnection
    const SOCKET_URL =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3001";
    const socketInstance = io(SOCKET_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      maxReconnectionAttempts: 5,
      timeout: 20000,
    });

    socketInstance.on("connect", () => {
      console.log("SocketContext socket connected to server");
      setIsConnected(true);

      // If we have a user, authenticate this socket with the server
      if (user && user.username) {
        console.log("Auto-authenticating socket for user:", user.username);
        console.log("User object:", user);

        if (user.password) {
          console.log("Using user password for authentication");
          socketInstance.emit("login", {
            username: user.username,
            password: user.password,
          });
        } else if (userCredentials) {
          console.log("Using stored credentials for authentication");
          socketInstance.emit("login", userCredentials);
        } else {
          console.log("No password or stored credentials available");
          console.log(
            "Note: SocketContext socket cannot authenticate automatically",
          );
          console.log(
            "Chat requests and friends features may not work until manual authentication",
          );
        }
      }

      // If we have an existing match, try to rejoin it
      if (isMatched && matchData && !partnerDisconnected) {
        console.log(
          "Reconnected - attempting to rejoin match:",
          matchData.matchId,
        );
        socketInstance.emit("rejoin-match", {
          matchId: matchData.matchId,
          userInfo: {
            name: matchData.partner ? matchData.partner.name : "Unknown",
          },
        });
      }
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("Disconnected from server:", reason);
      setIsConnected(false);
      setIsAuthenticated(false);
      setIsQueuing(false);
      // Don't clear match state on disconnect - preserve chat history

      // If disconnect was not intentional, try to reconnect
      if (reason === "io server disconnect") {
        // Server disconnected us, reconnect manually
        socketInstance.connect();
      }
    });

    // Authentication handlers
    socketInstance.on("register-success", (userData) => {
      console.log("Registration successful in SocketContext:", userData);
      // Load friends data after successful registration
      setTimeout(() => {
        socketInstance.emit("get-friends-data");
      }, 100);
    });

    socketInstance.on("login-success", (userData) => {
      console.log("Login successful in SocketContext:", userData);
      setIsAuthenticated(true);
      // Load friends data after successful login
      setTimeout(() => {
        socketInstance.emit("get-friends-data");
      }, 100);
    });

    socketInstance.on("login-error", (error) => {
      console.error("SocketContext login error:", error);
      setIsAuthenticated(false);
    });

    socketInstance.on("match-found", (data) => {
      console.log("Match found:", data);
      setIsQueuing(false);
      setIsMatched(true);
      setMatchData(data); // This should include matchId
      setPartnerDisconnected(false); // Reset partner disconnected state
      setChatClosed(false); // Reset chat closed state

      // Store original temporary match data if it's not persistent
      if (!data.isPersistent) {
        // This is a new temporary match, replace any existing temporary match
        setOriginalTempMatch(data);
      } else {
        // This is a new persistent match, only clear temp match if user wants to replace it
        // For now, let the user decide by keeping the temp match available
        // They can manually start a new match if they want to clear it
        console.log(
          "New persistent match found, but keeping existing temporary match available",
        );
      }

      // Set currentChatId based on match type
      if (data.isPersistent) {
        // For persistent matches, use just the matchId (it will appear in persistent chats)
        setCurrentChatId(data.matchId);
        // Reload persistent chats to show the new chat in sidebar
        setTimeout(() => {
          console.log("Match found - reloading persistent chats");
          loadPersistentChats();
        }, 1000); // Small delay to ensure the chat is created in the database
      } else {
        // For temporary matches, use the match- prefix (it will appear in temporary match section)
        setCurrentChatId(`match-${data.matchId}`);
      }

      console.log("Match data stored:", data);
      console.log("Match ID:", data.matchId);

      setMessages([
        {
          id: "system-1",
          type: "system",
          text: `You've been matched with ${data.partner.name}! Say hello and start chatting!`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      // Store initial messages for temporary match
      if (!data.isPersistent) {
        setOriginalTempMessages([
          {
            id: "system-1",
            type: "system",
            text: `You've been matched with ${data.partner.name}! Say hello and start chatting!`,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }

      // Navigate to chat section when match is found
      console.log("Attempting to navigate to chat...");
      if (onMatchFoundRef.current) {
        // Use setTimeout to ensure state updates complete first
        setTimeout(() => {
          console.log("Calling onMatchFound callback");
          onMatchFoundRef.current();
        }, 100);
      } else {
        console.log("No onMatchFound callback provided");
      }
    });

    socketInstance.on("receive-message", (messageData) => {
      console.log("Received message:", messageData);
      const newMessage = {
        id: `msg-${Date.now()}`,
        type: "received",
        text: messageData.message || messageData.text, // Support both message and text fields
        sender: messageData.sender || messageData.senderId,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, newMessage]);

      // Also update temporary match messages if this is a temporary match
      if (originalTempMatch && !originalTempMatch.isPersistent) {
        setOriginalTempMessages((prev) => [...prev, newMessage]);
      }
    });

    socketInstance.on("message-sent", (messageData) => {
      console.log("Message sent confirmation:", messageData);
    });

    socketInstance.on("message-error", (error) => {
      console.error("Message sending error:", error.message);
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          type: "system",
          text: `Message error: ${error.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    });

    socketInstance.on("partner-disconnected", () => {
      console.log("Partner disconnected");
      setPartnerDisconnected(true);
      // Don't clear the match completely - just add a system message
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          type: "system",
          text: "Your partner has disconnected. You can try to reopen the chat or queue up again to find a new match!",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      // Keep the match data and messages but mark as disconnected
    });

    socketInstance.on("partner-reconnected", (data) => {
      console.log("Partner reconnected:", data);
      setPartnerDisconnected(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          type: "system",
          text: "Your partner has reconnected! You can continue chatting.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    });

    socketInstance.on("match-rejoined", (data) => {
      console.log("Successfully rejoined match:", data);
      setPartnerDisconnected(false);
      // Optionally sync messages from server if implemented
    });

    socketInstance.on("match-rejoin-failed", (error) => {
      console.log("Failed to rejoin match:", error);
      setPartnerDisconnected(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          type: "system",
          text: "Could not reconnect to your previous chat. Your partner may have left. You can start a new match.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    });

    socketInstance.on("match-expired", (data) => {
      console.log("Match expired:", data);
      setPartnerDisconnected(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          type: "system",
          text:
            data.message ||
            "Your chat session has expired. You can start a new match.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    });

    socketInstance.on("reconnect", (attemptNumber) => {
      console.log("Reconnected to server after", attemptNumber, "attempts");
      setIsConnected(true);
    });

    socketInstance.on("reconnect_error", (error) => {
      console.log("Reconnection failed:", error);
    });

    // Handle persistent chats events
    socketInstance.on("persistent-chats", (chats) => {
      console.log("Received persistent chats:", chats);
      setPersistentChats(chats);

      // If a friend chat was just created, open it now that we have the full list
      if (pendingFriendChatToOpen) {
        const pending = pendingFriendChatToOpen;
        pendingFriendChatToOpen = null;
        const chatToOpen = chats.find((c) => c.chat_id === pending.chat_id);
        if (chatToOpen) {
          setCurrentChatId(chatToOpen.chat_id);
          setIsMatched(true);
          setChatClosed(false);
          setPartnerDisconnected(false);
          setMatchData({
            matchId: chatToOpen.chat_id,
            isPersistent: true,
            partner: {
              name: pending.friendUsername,
              sign: pending.friendSign || "Unknown",
            },
          });
          setMessages([]);
          // Load existing messages for this chat
          socketInstance.emit("load-chat-messages", {
            chatId: chatToOpen.chat_id,
          });
        }
      }
    });

    socketInstance.on("persistent-chats-error", (error) => {
      console.error("Error loading persistent chats:", error.message);
    });

    socketInstance.on("chat-messages-loaded", (data) => {
      console.log("Chat messages loaded:", data);
      if (data.chatId === currentChatId) {
        // Convert database messages to app format
        const formattedMessages = data.messages.map((msg) => ({
          id: msg.message_id,
          type:
            msg.message_type === "system"
              ? "system"
              : msg.sender_username === matchData?.partner?.name
                ? "received"
                : "sent",
          text: msg.message_text,
          sender: msg.sender_username,
          timestamp: new Date(msg.created_at).toLocaleTimeString(),
        }));
        setMessages(formattedMessages);
      }
    });

    socketInstance.on("chat-messages-error", (error) => {
      console.error("Error loading chat messages:", error.message);
    });

    socketInstance.on("chat-deleted", (result) => {
      console.log("Chat deleted:", result);
      // Remove from persistent chats list
      setPersistentChats((prev) =>
        prev.filter((chat) => chat.chat_id !== result.chatId),
      );
      // If this was the current chat, close it
      if (currentChatId === result.chatId) {
        setCurrentChatId(null);
        setIsMatched(false);
        setMatchData(null);
        setMessages([]);
      }
    });

    socketInstance.on("delete-chat-error", (error) => {
      console.error("Error deleting chat:", error.message);
    });

    socketInstance.on("queue-cancelled", () => {
      console.log("Queue cancelled by server");
      setIsQueuing(false);
      setIsMatched(false);
      setMatchData(null);
    });

    // Friends event listeners
    socketInstance.on("friends-data-loaded", (data) => {
      console.log("Friends data loaded:", data);
      setFriends(data.friends || []);
      setPendingInvitations(data.pendingInvitations || []);
      setSentInvitations(data.sentInvitations || []);
    });

    socketInstance.on("friend-invitation-sent", (data) => {
      console.log("Friend invitation sent:", data);
      setSentInvitations((prev) => [...prev, data]);
    });

    socketInstance.on("friend-invitation-received", (data) => {
      console.log("Friend invitation received:", data);
      setPendingInvitations((prev) => [...prev, data]);
    });

    socketInstance.on("friend-invitation-accepted", (data) => {
      console.log("Friend invitation accepted:", data);
      setFriends((prev) => [...prev, data.friend]);
      setPendingInvitations((prev) =>
        prev.filter((inv) => inv.fromUsername !== data.friend.username),
      );
      setSentInvitations((prev) =>
        prev.filter((inv) => inv.toUsername !== data.friend.username),
      );
    });

    socketInstance.on("friend-invitation-declined", (data) => {
      console.log("Friend invitation declined:", data);
      setPendingInvitations((prev) =>
        prev.filter((inv) => inv.fromUsername !== data.fromUsername),
      );
      setSentInvitations((prev) =>
        prev.filter((inv) => inv.toUsername !== data.fromUsername),
      );
    });

    socketInstance.on("friend-chat-started", (data) => {
      console.log("Friend chat started:", data);
      // Store info needed to open the chat once the list refreshes
      pendingFriendChatToOpen = {
        chat_id: data.chatId,
        friendUsername: data.friendUsername,
        friendSign: data.friendSign,
      };
      // Bypass the throttle and request a fresh chat list immediately
      socketInstance.emit("get-persistent-chats");
    });

    socketInstance.on("friend-chat-invitation", (data) => {
      console.log("Received friend chat invitation:", data);
      // Reload persistent chats to show the new friend chat
      setTimeout(() => {
        console.log("Friend chat invitation - reloading persistent chats");
        loadPersistentChats();
      }, 500);
      // Optionally set as current chat if user wants to auto-join
      // setCurrentChatId(data.chatId);
    });

    socketInstance.on("start-friend-chat-error", (error) => {
      console.error("Error starting friend chat:", error.message);
      alert(`Error starting friend chat: ${error.message}`);
    });

    // Chat request event listeners
    socketInstance.on("chat-request-sent", (data) => {
      console.log("Chat request sent:", data);
      setSentChatRequests((prev) => [...prev, data]);
    });

    socketInstance.on("chat-request-received", (data) => {
      console.log("Chat request received:", data);
      setChatRequests((prev) => [...prev, data]);
    });

    socketInstance.on("chat-request-accepted", (data) => {
      console.log("Chat request accepted:", data);

      // Check if this was our sent request that got accepted
      const wasMySentRequest = sentChatRequests.some(
        (req) => req.toUsername === data.fromUsername,
      );

      if (wasMySentRequest) {
        // Show modal for the person who sent the request
        setChatAcceptedData({
          acceptedBy: data.fromUsername,
          chatId: data.chatId,
        });
        setShowChatAcceptedModal(true);
        console.log("Showing chat accepted modal for:", data.fromUsername);
      }

      // Remove from pending requests
      setChatRequests((prev) =>
        prev.filter((req) => req.fromUsername !== data.fromUsername),
      );
      // Remove from sent requests if this was our request
      setSentChatRequests((prev) =>
        prev.filter((req) => req.toUsername !== data.fromUsername),
      );

      // Reload persistent chats to show the new chat
      setTimeout(() => {
        console.log("Chat request accepted - reloading persistent chats");
        loadPersistentChats();
      }, 500);
    });

    socketInstance.on("chat-request-declined", (data) => {
      console.log("Chat request declined:", data);
      setChatRequests((prev) =>
        prev.filter((req) => req.fromUsername !== data.fromUsername),
      );
      // If we received data.toUsername, it means our sent request was declined
      if (data.toUsername) {
        setSentChatRequests((prev) =>
          prev.filter((req) => req.toUsername !== data.toUsername),
        );
      }
    });

    socketInstance.on("chat-request-error", (error) => {
      console.error("Chat request error:", error.message);
      alert(`Chat request error: ${error.message}`);
    });

    socketInstance.on("friends-data-error", (error) => {
      console.error("Friends data error:", error.message);
    });

    setSocket(socketInstance);

    return () => {
      console.log("SocketContext cleanup - disconnecting socket");
      socketInstance.disconnect();
    };
  }, []); // Remove onMatchFound dependency to prevent socket recreation

  const joinQueue = (userData) => {
    if (socket) {
      console.log("Attempting to join queue with data:", userData);
      setIsQueuing(true);

      if (!isConnected) {
        console.log("Socket not connected, connecting now...");
        socket.connect();
        // Wait for connection then emit
        socket.once("connect", () => {
          console.log("Connected! Now emitting join-queue...");
          socket.emit("join-queue", userData);
        });
      } else {
        console.log("Socket already connected, emitting join-queue...");
        socket.emit("join-queue", userData);
      }
    } else {
      console.log("No socket available - reinitializing connection");
      // If socket is null, try to reinitialize
      setIsQueuing(false);
      setTimeout(() => {
        if (socket) {
          joinQueue(userData);
        }
      }, 1000);
    }
  };

  const cancelQueue = () => {
    if (socket && isQueuing) {
      console.log("Cancelling queue...");
      socket.emit("cancel-queue");
      setIsQueuing(false);
    }
  };

  const sendMessage = (message) => {
    if (socket && isMatched && matchData) {
      const messageData = {
        message,
        matchId: matchData.matchId, // Use matchId instead of roomId
        timestamp: new Date().toISOString(),
      };

      console.log("Sending message:", messageData);
      socket.emit("send-message", messageData);

      // Add to local messages immediately
      const newMessage = {
        id: `msg-${Date.now()}`,
        type: "sent",
        text: message,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, newMessage]);

      // Also update temporary match messages if this is a temporary match
      if (originalTempMatch && !originalTempMatch.isPersistent) {
        setOriginalTempMessages((prev) => [...prev, newMessage]);
      }
    } else {
      console.log("Cannot send message - missing requirements:", {
        socket: !!socket,
        isMatched,
        matchData: !!matchData,
        matchId: matchData?.matchId,
      });
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
    }
  };

  const cleanupOnLogout = () => {
    // Disconnect socket and clear all state when user logs out
    if (socket) {
      if (isQueuing) {
        socket.emit("cancel-queue");
      }
      socket.disconnect();
    }

    // Reset all state
    setIsConnected(false);
    setIsQueuing(false);
    setIsMatched(false);
    setMatchData(null);
    setMessages([]);
    setPartnerDisconnected(false);
    setChatClosed(false);

    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("dreamweaver-match-state");
      localStorage.removeItem("dreamweaver-messages");
    }

    console.log("SocketContext cleaned up for logout");
  };

  const startNewMatch = () => {
    setIsMatched(false);
    setMatchData(null);
    setOriginalTempMatch(null);
    setOriginalTempMessages([]);
    setMessages([]);
    setPartnerDisconnected(false);
    setChatClosed(false);
    setCurrentChatId(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("dreamweaver-match-state");
      localStorage.removeItem("dreamweaver-messages");
      localStorage.removeItem("dreamweaver-temp-messages");
    }
  };

  const closeChat = () => {
    setChatClosed(true);
  };

  const reopenChat = () => {
    setChatClosed(false);

    // If partner is disconnected, try to reconnect to the match
    if (partnerDisconnected && socket && matchData) {
      console.log("Attempting to rejoin match:", matchData.matchId);
      socket.emit("rejoin-match", {
        matchId: matchData.matchId,
        userInfo: {
          name: matchData.partner ? matchData.partner.name : "Unknown",
        },
      });

      // Add a system message about reconnection attempt
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          type: "system",
          text: "Attempting to reconnect to your chat...",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  // Load persistent chats for registered users (with throttling)
  let lastLoadTime = 0;
  const loadPersistentChats = () => {
    const now = Date.now();
    // Throttle requests to once every 2 seconds
    if (now - lastLoadTime < 2000) {
      console.log("Throttling loadPersistentChats request");
      return;
    }

    if (socket) {
      lastLoadTime = now;
      console.log("Loading persistent chats...");
      socket.emit("get-persistent-chats");
    }
  };

  // Open a persistent chat
  const openPersistentChat = (chat, currentUser) => {
    console.log("Opening persistent chat:", chat, "Current user:", currentUser);

    // If we're currently in a temporary match and switching to a different chat,
    // we need to preserve the temporary match state but not interfere with the new chat
    const isCurrentlyInTempMatch =
      currentChatId && currentChatId.startsWith("match-") && originalTempMatch;
    const isSwitchingToTempMatch = chat.isTemporaryMatch;

    console.log("Chat transition:", {
      isCurrentlyInTempMatch,
      isSwitchingToTempMatch,
      currentChatId,
      newChatId: chat.chat_id,
    });

    // IMPORTANT: Save current messages to originalTempMessages if leaving a temporary match
    if (isCurrentlyInTempMatch && originalTempMatch) {
      // Save messages whenever leaving a temporary match, regardless of destination
      console.log("Saving current temporary match messages before switching:", {
        currentMessagesCount: messages.length,
        switching: `from temp match to ${chat.chat_id}`,
        isSwitchingToTempMatch,
      });
      setOriginalTempMessages(messages);
    }

    setCurrentChatId(chat.chat_id);
    setIsMatched(true);
    setChatClosed(false);
    setPartnerDisconnected(false);

    // Only set match data for non-temporary matches
    // Temporary matches will restore their original data later in the function
    if (!chat.isTemporaryMatch) {
      // Determine partner info based on current user
      const isUser1 = chat.user1_username === currentUser?.username;
      const partnerName = isUser1 ? chat.user2_username : chat.user1_username;
      const partnerSign = isUser1 ? chat.user2_sign : chat.user1_sign;

      console.log("Partner info:", { partnerName, partnerSign, isUser1 });

      setMatchData({
        matchId: chat.chat_id,
        isPersistent: true,
        partner: {
          name: partnerName,
          sign: partnerSign,
        },
      });
    }

    // Check if this is a dummy chat for testing
    if (chat.chat_id === "dummy-chat-1") {
      // Load dummy messages for testing
      const dummyMessages = [
        {
          id: "dummy-1",
          type: "system",
          text: "This is a test chat for demonstration purposes!",
          timestamp: new Date(Date.now() - 1800000).toLocaleTimeString(), // 30 minutes ago
        },
        {
          id: "dummy-2",
          type: "received",
          text: "Hey there! ✨ How's your cosmic journey going?",
          sender: "Luna StarGazer",
          timestamp: new Date(Date.now() - 1200000).toLocaleTimeString(), // 20 minutes ago
        },
        {
          id: "dummy-3",
          type: "sent",
          text: "Hi Luna! It's going great, thanks for asking! 🌟",
          timestamp: new Date(Date.now() - 900000).toLocaleTimeString(), // 15 minutes ago
        },
        {
          id: "dummy-4",
          type: "received",
          text: "That's wonderful to hear! I've been reading about Mercury's influence lately. Have you felt any shifts in your communication style? 🌙",
          sender: "Luna StarGazer",
          timestamp: new Date(Date.now() - 600000).toLocaleTimeString(), // 10 minutes ago
        },
        {
          id: "dummy-5",
          type: "sent",
          text: "Actually yes! I've been more direct in my conversations. Is that a Scorpio thing? 😄",
          timestamp: new Date(Date.now() - 300000).toLocaleTimeString(), // 5 minutes ago
        },
        {
          id: "dummy-6",
          type: "received",
          text: "Haha, could be! We Scorpios do appreciate honesty and depth. Click around and test the chat switching! 🦂",
          sender: "Luna StarGazer",
          timestamp: new Date(Date.now() - 60000).toLocaleTimeString(), // 1 minute ago
        },
      ];
      setMessages(dummyMessages);
    } else if (chat.chat_id === "dummy-chat-2") {
      // Load dummy messages for second test chat
      const dummyMessages2 = [
        {
          id: "dummy2-1",
          type: "system",
          text: "Another test chat - perfect for testing chat switching!",
          timestamp: new Date(Date.now() - 7200000).toLocaleTimeString(), // 2 hours ago
        },
        {
          id: "dummy2-2",
          type: "received",
          text: "Welcome to my chat! I'm a Gemini so I love variety and switching between topics! 🌟",
          sender: "Cosmic Ray",
          timestamp: new Date(Date.now() - 5400000).toLocaleTimeString(), // 1.5 hours ago
        },
        {
          id: "dummy2-3",
          type: "sent",
          text: "That's perfect! I'm testing the chat switching functionality.",
          timestamp: new Date(Date.now() - 4800000).toLocaleTimeString(), // 1.3 hours ago
        },
        {
          id: "dummy2-4",
          type: "received",
          text: "Nice! As a Gemini, I appreciate duality. Try switching back and forth between our chats! ♊",
          sender: "Cosmic Ray",
          timestamp: new Date(Date.now() - 4200000).toLocaleTimeString(), // 1.2 hours ago
        },
        {
          id: "dummy2-5",
          type: "sent",
          text: "Will do! This is great for testing the interface.",
          timestamp: new Date(Date.now() - 3600000).toLocaleTimeString(), // 1 hour ago
        },
      ];
      setMessages(dummyMessages2);
    } else if (chat.isTemporaryMatch) {
      // For temporary match, restore the original temporary match data and messages
      console.log(
        "Opening temporary match chat, restoring original match data and messages",
      );
      console.log("Current states before restoration:", {
        originalTempMatch,
        originalTempMessages: originalTempMessages?.length || 0,
        currentChatId: chat.chat_id,
      });

      if (originalTempMatch) {
        // Restore the original temporary match data instead of the persistent chat data
        setMatchData(originalTempMatch);
        setIsMatched(true);
        setChatClosed(false);
        setPartnerDisconnected(false);
        // Restore the original temporary match messages
        console.log("Restoring temporary match messages:", {
          originalTempMessagesCount: originalTempMessages?.length || 0,
          currentMessagesCount: messages.length,
          isRestoring: true,
        });
        setMessages(originalTempMessages);
        console.log("Successfully restored temporary match:", {
          matchData: originalTempMatch,
          messagesCount: originalTempMessages?.length || 0,
        });
      } else {
        console.warn(
          "Attempted to open temporary match but originalTempMatch is null",
        );
      }
    } else {
      // Load messages for real chats
      if (socket) {
        socket.emit("load-chat-messages", { chatId: chat.chat_id });
      }
    }
  };

  // Delete a persistent chat
  const deletePersistentChat = (chatId) => {
    if (socket) {
      socket.emit("delete-persistent-chat", { chatId });
    }
  };

  // Show delete confirmation modal
  const showDeleteConfirmation = (chat) => {
    setChatToDelete(chat);
    setShowDeleteModal(true);
  };

  // Hide delete confirmation modal
  const hideDeleteConfirmation = () => {
    setChatToDelete(null);
    setShowDeleteModal(false);
  };

  // Confirm chat deletion
  const confirmDeleteChat = () => {
    if (chatToDelete) {
      deletePersistentChat(chatToDelete.chat_id);
      hideDeleteConfirmation();
    }
  };

  // Friends functions
  const loadFriends = () => {
    console.log(
      "loadFriends called, socket:",
      !!socket,
      "isConnected:",
      isConnected,
    );
    if (socket) {
      console.log("Emitting get-friends-data");
      socket.emit("get-friends-data");
    } else {
      console.log("No socket available for loadFriends");
    }
  };

  const sendFriendInvitation = (username) => {
    if (socket && username.trim()) {
      socket.emit("send-friend-invitation", { toUsername: username.trim() });
    }
  };

  const acceptFriendInvitation = (fromUsername) => {
    if (socket) {
      socket.emit("accept-friend-invitation", { fromUsername });
    }
  };

  const declineFriendInvitation = (fromUsername) => {
    if (socket) {
      socket.emit("decline-friend-invitation", { fromUsername });
    }
  };

  const sendChatRequest = (friendUsername) => {
    if (!socket) {
      console.error("SocketContext: No socket available for chat request");
      return;
    }

    if (!isAuthenticated) {
      console.error(
        "SocketContext: Not authenticated - cannot send chat request",
      );
      // Try to re-authenticate
      const tempUsername = sessionStorage.getItem("temp_username");
      const tempPassword = sessionStorage.getItem("temp_password");
      if (tempUsername && tempPassword) {
        console.log("Re-authenticating before sending chat request...");
        authenticateSocket({ username: tempUsername, password: tempPassword });
        // Retry after a delay
        setTimeout(() => {
          sendChatRequest(friendUsername);
        }, 1000);
      }
      return;
    }

    console.log("Sending chat request to:", friendUsername);
    socket.emit("send-chat-request", { toUsername: friendUsername });
  };

  const acceptChatRequest = (fromUsername) => {
    if (!socket) {
      console.error(
        "SocketContext: No socket available for accepting chat request",
      );
      return;
    }

    if (!isAuthenticated) {
      console.error(
        "SocketContext: Not authenticated - cannot accept chat request",
      );
      return;
    }

    console.log("Accepting chat request from:", fromUsername);
    socket.emit("accept-chat-request", { fromUsername });
  };

  const declineChatRequest = (fromUsername) => {
    if (!socket) {
      console.error(
        "SocketContext: No socket available for declining chat request",
      );
      return;
    }

    if (!isAuthenticated) {
      console.error(
        "SocketContext: Not authenticated - cannot decline chat request",
      );
      return;
    }

    console.log("Declining chat request from:", fromUsername);
    socket.emit("decline-chat-request", { fromUsername });
  };

  // Keep original startFriendChat for backward compatibility (now used internally)
  const startFriendChat = (friendUsername) => {
    if (socket) {
      socket.emit("start-friend-chat", { friendUsername });
    }
  };

  // Authentication functions
  const register = (userData) => {
    if (socket) {
      socket.emit("register", userData);
    }
  };

  const login = (credentials) => {
    if (socket) {
      setUserCredentials(credentials); // Store credentials for later use
      socket.emit("login", credentials);
    }
  };

  // Manual authentication function for SocketContext
  const authenticateSocket = (credentials) => {
    if (!socket) {
      console.log("SocketContext: No socket available for authentication");
      return;
    }

    if (!credentials) {
      console.log("SocketContext: No credentials provided for authentication");
      return;
    }

    if (!socket.connected) {
      console.log(
        "SocketContext: Socket not connected, retrying in 1 second...",
      );
      setTimeout(() => {
        authenticateSocket(credentials);
      }, 1000);
      return;
    }

    console.log(
      "SocketContext: Manually authenticating socket with username:",
      credentials.username,
    );
    socket.emit("login", credentials);
  };

  const value = {
    socket,
    isConnected,
    isAuthenticated,
    isQueuing,
    isMatched,
    matchData,
    messages,
    partnerDisconnected,
    chatClosed,
    originalTempMatch,
    joinQueue,
    cancelQueue,
    sendMessage,
    disconnect,
    startNewMatch,
    closeChat,
    reopenChat,
    cleanupOnLogout,
    // Persistent chat functions
    persistentChats,
    currentChatId,
    loadPersistentChats,
    openPersistentChat,
    deletePersistentChat,
    showDeleteConfirmation,
    hideDeleteConfirmation,
    confirmDeleteChat,
    showDeleteModal,
    chatToDelete,
    // Friends functions
    friends,
    pendingInvitations,
    sentInvitations,
    loadFriends,
    sendFriendInvitation,
    acceptFriendInvitation,
    declineFriendInvitation,
    startFriendChat,
    // Chat request functions
    chatRequests,
    sentChatRequests,
    sendChatRequest,
    acceptChatRequest,
    declineChatRequest,
    // Chat request acceptance modal
    showChatAcceptedModal,
    chatAcceptedData,
    closeChatAcceptedModal: () => setShowChatAcceptedModal(false),
    startChatFromModal: () => {
      setShowChatAcceptedModal(false);
      // The match-found event will handle opening the chat automatically
    },
    // Authentication functions
    register,
    login,
    authenticateSocket,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
