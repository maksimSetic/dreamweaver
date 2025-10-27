import { useState, useEffect, useRef } from "react";
import { io } from "socket.io-client";

export const useAuth = () => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const rememberMeRef = useRef(rememberMe);

  // Update ref when rememberMe changes
  useEffect(() => {
    rememberMeRef.current = rememberMe;
  }, [rememberMe]);

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

      // Always store user in localStorage for session persistence
      localStorage.setItem("dreamweaver_user", JSON.stringify(userData));
      // Only set remember flag if explicitly checked
      if (rememberMeRef.current) {
        localStorage.setItem("dreamweaver_remember", "true");
      }
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

      // Always store user in localStorage for session persistence
      localStorage.setItem("dreamweaver_user", JSON.stringify(userData));
      // Only set remember flag if explicitly checked
      if (rememberMeRef.current) {
        localStorage.setItem("dreamweaver_remember", "true");
      }
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

    // Load user from localStorage on mount for session persistence
    const savedUser = localStorage.getItem("dreamweaver_user");
    const rememberFlag = localStorage.getItem("dreamweaver_remember");

    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        // Set remember me flag if it was explicitly set
        if (rememberFlag === "true") {
          setRememberMe(true);
        }
      } catch (error) {
        console.error("Error parsing saved user:", error);
        localStorage.removeItem("dreamweaver_user");
        localStorage.removeItem("dreamweaver_remember");
      }
    }

    return () => {
      socketInstance.disconnect();
    };
  }, []); // Remove rememberMe dependency to avoid infinite loop

  const register = (userData) => {
    if (!socket || !isConnected) {
      alert("Not connected to server. Please try again.");
      return;
    }

    setIsLoading(true);
    socket.emit("register", userData);
  };

  const login = (username, password, remember = false) => {
    if (!socket || !isConnected) {
      alert("Not connected to server. Please try again.");
      return;
    }

    setRememberMe(remember);
    setIsLoading(true);
    socket.emit("login", { username, password });
  };

  const logout = () => {
    setUser(null);
    setRememberMe(false);
    localStorage.removeItem("dreamweaver_user");
    localStorage.removeItem("dreamweaver_remember");
  };

  const debugGetUsers = () => {
    if (socket && isConnected) {
      socket.emit("debug-get-users");
    }
  };

  return {
    user,
    setUser,
    isConnected,
    isLoading,
    rememberMe,
    setRememberMe,
    register,
    login,
    logout,
    debugGetUsers,
  };
};
