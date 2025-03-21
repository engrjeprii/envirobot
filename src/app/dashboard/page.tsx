"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import Connect from "./Connect";
import Controls from "./Controls";

const DashboardPage = () => {
  const [isConnected, setIsConnected] = useState(false);

  const router = useRouter();
  const handleLogout = () => {
    setIsConnected(false); // Ensure isConnected is set to false
    router.replace("/login");
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-b from-blue-500 to-green-500">
      <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-lg">
        <button
          onClick={handleLogout}
          className="font-semibold cursor-pointer text-black"
        >
          Logout
        </button>
      </div>

      {!isConnected ? (
        <Connect isConnected={isConnected} setIsConnected={setIsConnected} />
      ) : (
        <Controls isConnected={isConnected} />
      )}
    </div>
  );
};

export default DashboardPage;
