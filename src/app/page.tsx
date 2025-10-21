"use client";
import { useState } from "react";
import Sidebar from "./Components/Sidebar";
import MainContent from "./Components/MainContent";
import AuthForm from "./Components/AuthForm";
import UserProfile from "./Components/UserProfile";
import { calculateFullChart } from "./utils/zodiacCalculations";
import { User, AuthData } from "./types/auth";
import { useAuth } from "./hooks/useAuth";

export default function Home() {
  const [active, setActive] = useState("zodiac");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Use the new authentication hook
  const {
    user,
    isConnected,
    isLoading,
    register,
    login,
    logout,
    debugGetUsers,
  } = useAuth();

  const handleAuth = (authData: AuthData) => {
    if (authData.isLogin) {
      // Handle login with server
      login(authData.username, authData.password);
    } else {
      // Handle registration with server
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

      const userData = {
        username: authData.username,
        password: authData.password,
        zodiacChart: zodiacChart,
      };

      register(userData);
    }

    // Close auth form after attempting authentication
    setShowAuth(false);
  };

  const handleLogout = () => {
    logout();
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

  // Debug function - you can call this from browser console
  if (typeof window !== "undefined") {
    (window as any).debugUsers = debugGetUsers;
  }

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
