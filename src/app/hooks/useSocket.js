import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

export const useSocket = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isQueuing, setIsQueuing] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [matchData, setMatchData] = useState(null);
  const [messages, setMessages] = useState([]);

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
      setIsMatched(false);
      setMatchData(null);
    });

    socketInstance.on("match-found", (data) => {
      console.log("Match found:", data);
      setIsQueuing(false);
      setIsMatched(true);
      setMatchData(data);
      setMessages([
        {
          id: "system-1",
          type: "system",
          text: `You've been matched with ${data.partner.name}! Say hello and start chatting!`,
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    });

    socketInstance.on("receive-message", (messageData) => {
      console.log("Received message:", messageData);
      setMessages((prev) => [
        ...prev,
        {
          ...messageData,
          type: "other",
          timestamp: new Date(messageData.timestamp).toLocaleTimeString(),
        },
      ]);
    });

    socketInstance.on("message-sent", (messageData) => {
      console.log("Message sent confirmation:", messageData);
      setMessages((prev) => [
        ...prev,
        {
          ...messageData,
          type: "user",
          timestamp: new Date(messageData.timestamp).toLocaleTimeString(),
        },
      ]);
    });

    socketInstance.on("partner-disconnected", () => {
      setMessages((prev) => [
        ...prev,
        {
          id: "system-disconnect",
          type: "system",
          text: "Your chat partner has disconnected. You can start a new search!",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
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
      socket.emit("send-message", {
        matchId: matchData.matchId,
        message,
      });
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.disconnect();
      setIsQueuing(false);
      setIsMatched(false);
      setMatchData(null);
      setMessages([]);
    }
  };

  return {
    socket,
    isConnected,
    isQueuing,
    isMatched,
    matchData,
    messages,
    joinQueue,
    cancelQueue,
    sendMessage,
    disconnect,
  };
};
