import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import { Alert } from "@mui/material";

interface ConnectProps {
  isConnected: boolean;
  setIsConnected: (isConnected: boolean) => void;
}

const Connect: React.FC<ConnectProps> = ({ isConnected, setIsConnected }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(false);

  const handleConnect = async () => {
    try {
      const response = await fetch("/api/proxy?type=connect");

      console.log("Connecting to device...", response);

      if (response.ok) {
        setIsConnected(true);
      } else {
        setError(true);
      }
    } catch (error) {
      console.error("Error connecting to device:", error);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            handleConnect();
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isLoading]);

  const handleClick = () => {
    setIsLoading(true);
    setError(false);
    setProgress(0);
  };

  if (isConnected) return null;

  return (
    <>
      <div className="flex flex-col h-screen justify-center items-center gap-6">
        <p>
          Web app is still not connected to the device. Please connect the
          device to start.
        </p>

        <button
          disabled={isLoading}
          onClick={handleClick}
          className="cursor-pointer bg-blue-500 text-white font-semibold px-4 py-2 rounded-lg shadow-lg"
        >
          <div className="relative">
            <motion.div
              className="absolute top-0 left-0 h-1 bg-blue-500 rounded"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear" }}
            />
          </div>
          <div className="flex items-center gap-2">
            {isLoading && <Loader2 className="animate-spin w-4 h-4" />}
            {isLoading ? `Loading ${progress}%` : "Connect to Device"}
          </div>
        </button>
      </div>

      {error && (
        <Alert variant="filled" severity="error" className="absolute top-4 left-4 right-4 z-10 w-1/4">
          Error connecting to the device. Try again.
        </Alert>
      )}
    </>
  );
};

export default Connect;
