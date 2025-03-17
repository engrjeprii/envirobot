"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

const DashboardPage = () => {
  const [videoUrl, setVideoUrl] = useState("");

  const cameraOptions = [
    { label: "Camera 1", value: "camera1" },
    { label: "Camera 2", value: "camera2" },
    { label: "Camera 3", value: "camera3" },
  ];

  const [selectedCamera, setSelectedCamera] = useState(cameraOptions[0]);

  const router = useRouter();
  const handleLogout = () => {
    router.replace("/login");
  };

  const fetchArduinoData = async () => {
    try {
      const response = await fetch("/api/proxy?type=arduino");
      const data = await response.json();
      console.log("Arduino Data:", data);
    } catch (error) {
      console.error("Error fetching Arduino data:", error);
    }
  };

  const sendMoveCommand = async (movement: string) => {
    try {
      const response = await fetch(`/api/proxy?direction=${movement}`, {
        method: "POST",
      });
  
      const data = await response.json();
      console.log(`Move ${movement} response:`, data);
    } catch (error) {
      console.error("Error moving:", error);
    }
  }

  const buttonClick = (movement: string) => {
    sendMoveCommand(movement).then();
  }

  const handleKeyDown = useCallback(async (event: KeyboardEvent) => {
    const keyToDirection: { [key: string]: string } = {
      'a': 'a', 'A': 'a', 'ArrowLeft': 'a',
      'd': 'd', 'D': 'd', 'ArrowRight': 'd',
      'w': 'w', 'W': 'w', 'ArrowUp': 'w',
      's': 's', 'S': 's', 'ArrowDown': 's',
      'q': 'q', 'Q': 'q',
    };

    const direction = keyToDirection[event.key as keyof typeof keyToDirection];
    if (direction) {
      console.log(`Key pressed: ${event.key}, Direction: ${direction}`);
      sendMoveCommand(direction).then();
    }
  }, []);


  useEffect(() => {
    const cameraUrl = `/api/proxy?camera=${
      selectedCamera.value
    }&timestamp=${Date.now()}`;
    setVideoUrl(cameraUrl);
  }, [selectedCamera]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    fetchArduinoData().then();
    const interval = setInterval(() => {
      fetchArduinoData().then();
    }, 180000);
    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-b from-blue-500 to-green-500">
      <div className="absolute top-4 right-4 bg-white p-2 rounded-lg shadow-lg">
        <button onClick={handleLogout} className="font-semibold cursor-pointer">
          Logout
        </button>
      </div>

      <div className="flex flex-col items-center gap-6 flex-[0.75]">
      <div className="w-full max-w-2xl bg-white p-6 rounded-xl shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <label className="font-medium text-gray-700">Select Camera:</label>
          <select
            value={selectedCamera.label}
            onChange={(e) => {
              const cameraSelected = cameraOptions.find(
                (camera) => camera.label === e.target.value
              );
              if (cameraSelected) {
                setSelectedCamera(cameraSelected);
              }
            }}
            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
          >
            {cameraOptions.map(({ value, label }, index) => (
              <option key={`${value}_${index}`} value={label} className="p-2">
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="bg-black rounded-lg overflow-hidden border-4 border-gray-300">
          {videoUrl && (
            <img
              key={videoUrl}
              src={videoUrl}
              alt={`Stream from ${selectedCamera.label}`}
              className="w-full h-72 object-cover rounded-lg"
            />
          )}
          {/* {videoUrl ? <img key={videoUrl} src={videoUrl} alt={`Stream from ${selectedCamera.label}`} className="flex justify-center items-center mt-1 flex-[0.75]"/> :  */}
          {/* <>Select a camera to start streaming</> */}
        </div>
      </div>

      {/* Controls for Directions */}
      <div className="flex flex-col items-center gap-3">
        <button className="px-8 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700"
            onClick={() => buttonClick('w')}>
          ▲
        </button>
        <div className="flex gap-6">
          <button className="px-8 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700"
           onClick={() => buttonClick('a')}
          >
            ◀
          </button>
          <button className="px-8 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700"
           onClick={() => buttonClick('d')}
            >
            ▶
          </button>
        </div>
        <button className="px-8 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700"
         onClick={() => buttonClick('s')}
        >
          ▼
        </button>
      </div>
      </div>


    </div>
  );
};
export default DashboardPage;
