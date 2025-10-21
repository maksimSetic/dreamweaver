import { useState, useEffect } from "react";
import { io } from "socket.io-client";

export const useAuth = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize socket connection for authentication
    const socketInstance = io("http://localhost:3001");

    socketInstance.on("connect", () => {
      console.log("Connected to auth server");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from auth server");
      setIsConnected(false);
    });

    // Registration handlers
    socketInstance.on("register-success", (userData) => {
      console.log("Registration successful:", userData);
      setUser(userData);
      setIsLoading(false);
      // Store user in localStorage for session persistence
      localStorage.setItem("dreamweaver_user", JSON.stringify(userData));
    });

    socketInstance.on("register-error", (error) => {
      console.error("Registration failed:", error.message);
      setIsLoading(false);
      alert(error.message);
    });

    // Login handlers
    socketInstance.on("login-success", (userData) => {
      console.log("Login successful:", userData);
      setUser(userData);
      setIsLoading(false);
      // Store user in localStorage for session persistence
      localStorage.setItem("dreamweaver_user", JSON.stringify(userData));
    });

    socketInstance.on("login-error", (error) => {
      console.error("Login failed:", error.message);
      setIsLoading(false);
      alert(error.message);
    });

    // Debug handler
    socketInstance.on("debug-users", (users) => {
      console.log("All users in database:", users);
    });

    setSocket(socketInstance);

    // Load user from localStorage on mount (for session persistence)
    const savedUser = localStorage.getItem("dreamweaver_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("dreamweaver_user");
      }
    }

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  const register = (userData) => {
    if (!socket || !isConnected) {
      alert("Not connected to server. Please try again.");
      return;
    }

    setIsLoading(true);
    socket.emit("register", userData);
  };

  const login = (username, password) => {
    if (!socket || !isConnected) {
      alert("Not connected to server. Please try again.");
      return;
    }

    setIsLoading(true);
    socket.emit("login", { username, password });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("dreamweaver_user");
  };

  const debugGetUsers = () => {
    if (socket && isConnected) {
      socket.emit("debug-get-users");
    }
  };

  return {
    user,
    isConnected,
    isLoading,
    register,
    login,
    logout,
    debugGetUsers,
  };
};
