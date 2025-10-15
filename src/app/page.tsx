"use client";
import { useState } from "react";
import Sidebar from "./Components/Sidebar";
import MainContent from "./Components/MainContent";

export default function Home() {
  const [active, setActive] = useState("zodiac");

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar active={active} setActive={setActive} />
      <MainContent active={active} />
    </div>
  );
}
