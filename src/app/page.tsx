"use client";
import { useState, useEffect } from "react";
import Sidebar from "./Components/Sidebar";
import MainContent from "./Components/MainContent";
import AuthForm from "./Components/AuthForm";
import UserProfile from "./Components/UserProfile";
import { calculateFullChart } from "./utils/zodiacCalculations";
import { User, AuthData } from "./types/auth";

export default function Home() {
  const [active, setActive] = useState("zodiac");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("dreamweaver_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error parsing saved user data:", error);
        localStorage.removeItem("dreamweaver_user");
      }
    }
  }, []);

  const handleAuth = (authData: AuthData) => {
    if (authData.isLogin) {
      // Handle login
      const savedUser = localStorage.getItem("dreamweaver_user");
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          if (
            userData.username === authData.username &&
            userData.password === authData.password
          ) {
            setUser(userData);
            setShowAuth(false);
          } else {
            alert("Invalid username or password");
          }
        } catch (error) {
          console.error("Error parsing user data:", error);
          alert("Error loading user data");
        }
      } else {
        alert("User not found. Please register first.");
      }
    } else {
      // Handle registration
      if (
        !authData.birthDate ||
        !authData.birthTime ||
        !authData.birthLocation
      ) {
        alert("Please fill in all birth information for registration");
        return;
      }

      const zodiacChart = calculateFullChart(
        authData.birthDate,
        authData.birthTime,
        authData.birthLocation
      );

      const newUser: User = {
        username: authData.username,
        password: authData.password,
        zodiacChart: zodiacChart,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem("dreamweaver_user", JSON.stringify(newUser));
      setUser(newUser);
      setShowAuth(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActive("zodiac");
    setShowProfile(false);
  };

  const handleProfileOpen = () => {
    setShowProfile(true);
  };

  const handleProfileEdit = () => {
    setShowProfile(false);
    setShowAuth(true);
  };

  const handleProfileClose = () => {
    setShowProfile(false);
  };

  // Show authentication form if requested
  if (showAuth) {
    return (
      <AuthForm
        onAuth={handleAuth}
        onCancel={() => setShowAuth(false)}
        existingUser={user}
      />
    );
  }

  // Show user profile if requested
  if (showProfile) {
    return (
      <UserProfile
        userProfile={user}
        onEdit={handleProfileEdit}
        onClose={handleProfileClose}
      />
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-gray-50">
      <Sidebar
        active={active}
        setActive={setActive}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={user}
        onLogin={() => setShowAuth(true)}
        onLogout={handleLogout}
        onProfileOpen={handleProfileOpen}
      />
      <MainContent
        active={active}
        user={user}
        onLogin={() => setShowAuth(true)}
      />
    </div>
  );
}
