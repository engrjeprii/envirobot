"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Connect from "./Connect";
import Controls from "./Controls";

const DashboardPage = () => {
  const [isConnected, setIsConnected] = useState(false);
  const router = useRouter();

  const handleLogout = () => {
    setIsConnected(false);
    router.replace("/login");
  };

  return (
    <div className="relative flex flex-col h-screen bg-gradient-to-b from-blue-500 to-green-500 pt-16">
      {/* Logout Button (Fixed at Top-Right) */}
      <div className="absolute top-4 right-6 z-10">
        <button
          onClick={handleLogout}
          className="bg-white p-2 rounded-lg shadow-lg font-semibold cursor-pointer text-black w-24 hover:bg-gray-200 transition"
        >
          Logout
        </button>
      </div>

      {/* Add padding to avoid overlap */}
      {!isConnected ? (
        <Connect isConnected={isConnected} setIsConnected={setIsConnected} />
      ) : (
        <Controls isConnected={isConnected} />
      )}
    </div>
  );
};

export default DashboardPage;
