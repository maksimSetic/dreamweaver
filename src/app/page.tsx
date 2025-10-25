"use client";
import { useState, useEffect } from "react";
import Sidebar from "./Components/Sidebar";
import MainContent from "./Components/MainContent";
import AuthForm from "./Components/AuthForm";
import UserProfile from "./Components/UserProfile";
import { calculateFullChart } from "./utils/zodiacCalculations";
import { User, AuthData } from "./types/auth";
import { useAuth } from "./hooks/useAuth";
import { SocketProvider } from "./contexts/SocketContext";

// Zodiac signs array for random selection
const zodiacSigns = [
  "Aries",
  "Taurus",
  "Gemini",
  "Cancer",
  "Leo",
  "Virgo",
  "Libra",
  "Scorpio",
  "Sagittarius",
  "Capricorn",
  "Aquarius",
  "Pisces",
];

// Function to generate random zodiac chart for guests
const generateRandomZodiacChart = () => {
  const getRandomSign = () =>
    zodiacSigns[Math.floor(Math.random() * zodiacSigns.length)];

  return {
    sun: getRandomSign(),
    moon: getRandomSign(),
    rising: getRandomSign(),
    birthInfo: {
      date: "1990-01-01", // Default date for guests
      time: "12:00", // Default time for guests
      location: "New York, NY", // Default location for guests
    },
  };
};

// Function to generate random guest username
const generateGuestUsername = () => {
  const cosmicNames = [
    "StarSeeker",
    "MoonDancer",
    "SunRider",
    "CosmicWanderer",
    "NightSky",
    "StarGazer",
    "CelestialSoul",
    "MysticTraveler",
    "AstralSeeker",
    "LunarDreamer",
    "SolarSpirit",
    "GalacticExplorer",
    "CosmicSage",
    "StellarGuide",
    "NebulaWalker",
  ];

  const randomName =
    cosmicNames[Math.floor(Math.random() * cosmicNames.length)];
  const randomNum = Math.floor(Math.random() * 1000);
  return `${randomName}_${randomNum}`;
};

export default function Home() {
  const [active, setActive] = useState("zodiac");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuth, setShowAuth] = useState(true); // Always show auth on load
  const [showProfile, setShowProfile] = useState(false);

  // Use the new authentication hook
  const { user, setUser, rememberMe, register, login, logout, debugGetUsers } =
    useAuth();

  // Hide auth form if user is logged in with remember me
  useEffect(() => {
    if (user && rememberMe) {
      setShowAuth(false);
    }
  }, [user, rememberMe]);

  const handleAuth = (authData: AuthData) => {
    if (authData.isGuest) {
      // Handle guest login - create a temporary user with random zodiac signs
      const guestZodiacChart = generateRandomZodiacChart();

      const guestUser: User = {
        username: generateGuestUsername(),
        password: "",
        zodiacChart: guestZodiacChart,
        createdAt: new Date().toISOString(),
        isGuest: true,
      };

      // Set guest user directly without server registration
      (setUser as (user: User | null) => void)(guestUser);
      setShowAuth(false);
      return;
    }

    if (authData.isLogin) {
      // Handle login with server
      login(authData.username, authData.password, authData.rememberMe);
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
    (
      window as typeof window & { debugUsers: typeof debugGetUsers }
    ).debugUsers = debugGetUsers;
  }

  // Show authentication form if requested or if no user is logged in
  if (showAuth && !user) {
    return (
      <AuthForm
        onAuth={handleAuth}
        onCancel={() => {
          // Only allow cancel if user is already logged in
          if (user) {
            setShowAuth(false);
          }
        }}
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
    <SocketProvider
      onMatchFound={() => {
        console.log("onMatchFound callback triggered, navigating to chat");
        setActive("chat");
      }}
    >
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
          setActive={setActive}
          user={user}
          onLogin={() => setShowAuth(true)}
        />
      </div>
    </SocketProvider>
  );
}
