import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};

export const SocketProvider = ({ children, onMatchFound }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isQueuing, setIsQueuing] = useState(false);
  const [chatClosed, setChatClosed] = useState(() => {
    // Restore chat closed state from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dreamweaver-match-state");
      return saved ? JSON.parse(saved).chatClosed || false : false;
    }
    return false;
  });
  const [partnerDisconnected, setPartnerDisconnected] = useState(() => {
    // Restore partner disconnected state from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dreamweaver-match-state");
      return saved ? JSON.parse(saved).partnerDisconnected || false : false;
    }
    return false;
  });
  const [isMatched, setIsMatched] = useState(() => {
    // Restore match state from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dreamweaver-match-state");
      return saved ? JSON.parse(saved).isMatched : false;
    }
    return false;
  });
  const [matchData, setMatchData] = useState(() => {
    // Restore match data from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dreamweaver-match-state");
      return saved ? JSON.parse(saved).matchData : null;
    }
    return null;
  });
  const [messages, setMessages] = useState(() => {
    // Restore messages from localStorage
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dreamweaver-messages");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Save match state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(
        "dreamweaver-match-state",
        JSON.stringify({
          isMatched,
          matchData,
          partnerDisconnected,
          chatClosed,
        })
      );
    }
  }, [isMatched, matchData, partnerDisconnected, chatClosed]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("dreamweaver-messages", JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-navigate to chat when match is found (backup navigation)
  useEffect(() => {
    if (isMatched && matchData && !chatClosed) {
      console.log("Match detected, ensuring navigation to chat");
      if (onMatchFound) {
        setTimeout(() => {
          onMatchFound();
        }, 200);
      }
    }
  }, [isMatched, matchData, chatClosed, onMatchFound]);

  useEffect(() => {
    // Initialize socket connection
    const socketInstance = io("http://localhost:3001", {
      autoConnect: false,
    });

    socketInstance.on("connect", () => {
      console.log("Connected to server");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from server");
      setIsConnected(false);
      setIsQueuing(false);
      // Don't clear match state on disconnect - preserve chat history
    });

    socketInstance.on("match-found", (data) => {
      console.log("Match found:", data);
      setIsQueuing(false);
      setIsMatched(true);
      setMatchData(data);
      setPartnerDisconnected(false); // Reset partner disconnected state
      setChatClosed(false); // Reset chat closed state
      setMessages([
        {
          id: "system-1",
          type: "system",
          text: `You've been matched with ${data.partner.name}! Say hello and start chatting!`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);

      // Navigate to chat section when match is found
      console.log("Attempting to navigate to chat...");
      if (onMatchFound) {
        // Use setTimeout to ensure state updates complete first
        setTimeout(() => {
          console.log("Calling onMatchFound callback");
          onMatchFound();
        }, 100);
      } else {
        console.log("No onMatchFound callback provided");
      }
    });

    socketInstance.on("receive-message", (messageData) => {
      console.log("Received message:", messageData);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          type: "received",
          text: messageData.message,
          sender: messageData.sender,
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
          text: "Your partner has disconnected. You can queue up again to find a new match!",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
      // Keep the match data and messages but mark as disconnected
    });

    socketInstance.on("queue-cancelled", () => {
      console.log("Queue cancelled by server");
      setIsQueuing(false);
      setIsMatched(false);
      setMatchData(null);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

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
      console.log("No socket available");
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
        roomId: matchData.roomId,
        timestamp: new Date().toISOString(),
      };

      socket.emit("send-message", messageData);

      // Add to local messages immediately
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          type: "sent",
          text: message,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
    }
  };

  const startNewMatch = () => {
    setIsMatched(false);
    setMatchData(null);
    setMessages([]);
    setPartnerDisconnected(false);
    setChatClosed(false);
    if (typeof window !== "undefined") {
      localStorage.removeItem("dreamweaver-match-state");
      localStorage.removeItem("dreamweaver-messages");
    }
  };

  const closeChat = () => {
    setChatClosed(true);
  };

  const reopenChat = () => {
    setChatClosed(false);
  };

  const value = {
    socket,
    isConnected,
    isQueuing,
    isMatched,
    matchData,
    messages,
    partnerDisconnected,
    chatClosed,
    joinQueue,
    cancelQueue,
    sendMessage,
    disconnect,
    startNewMatch,
    closeChat,
    reopenChat,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
