"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { RotateCcw } from "lucide-react";
import { isMobile,  } from "react-device-detect";
import "./scrollbar.css";

interface ControlsProps {
  isConnected: boolean;
}

const Controls: React.FC<ControlsProps> = ({ isConnected }) => {
  const [isLandscape, setIsLandscape] = useState(
    false
  );

  const logsContainerRef = useRef<HTMLDivElement>(null);

  const [videoUrl, setVideoUrl] = useState("");
  const cameraOptions = [
    { label: "Camera 1", value: "camera1" },
    { label: "Camera 2", value: "camera2" },
    { label: "Camera 3", value: "camera3" },
  ];
  const [selectedCamera, setSelectedCamera] = useState(cameraOptions[0]);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  const [sensorError, setSensorError] = useState(false);
  const [sensorLevel, setSensorLevel] = useState(0);
  const [keyboardLogs, setKeyboardLogs] = useState<string[]>([]);

  const MAX_LOGS = 50; // Limit the number of logs

  // Helper function to calculate sensor level
  const calculateSensorLevel = (distance: number) => {
    if (distance >= 31) return 0;
    if (distance >= 27) return 1;
    if (distance >= 24) return 2;
    if (distance >= 22) return 3;
    if (distance >= 0) return 4;
    return 0;
  };

  const fetchArduinoData = async () => {
    setSensorError(false);
    try {
      const response = await fetch("/api/proxy?type=arduino");
      const data = await response.json();

      if (response.ok) {
        const { message } = data;
        if (message.includes("Ultrasonic Distance")) {
          const match = message.match(/(\d+(\.\d+)?)/);
          if (match) {
            const distance = parseInt(match[0], 10);
            setSensorLevel(calculateSensorLevel(distance));
          }
        }
      } else {
        setSensorError(true);
      }
    } catch (error) {
      console.error("Error fetching Arduino data:", error);
      setSensorError(true);
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
  };

  const formatDirectionToLogs = (keyPress: string) => {
    const keyToDirection: { [key: string]: string } = {
      a: "Left",
      d: "Right",
      w: "Forward",
      s: "Stopping Device",
      q: "Manual Switching of Conveyor Motor",
    };
    return `[Pressed ${keyPress}]: ${
      keyToDirection[keyPress] ?? "Invalid Keypress"
    }`;
  };

  const handleKeyDown = useCallback(
    async (event: KeyboardEvent) => {
      const keyToDirection: { [key: string]: string } = {
        a: "a",
        A: "a",
        ArrowLeft: "a",
        d: "d",
        D: "d",
        ArrowRight: "d",
        w: "w",
        W: "w",
        ArrowUp: "w",
        s: "s",
        S: "s",
        ArrowDown: "s",
        q: "q",
        Q: "q",
      };

      const direction =
        keyToDirection[event.key as keyof typeof keyToDirection];
      setKeyboardLogs((prevLogs) => {
        const newLogs = [...prevLogs, formatDirectionToLogs(event.key)];
        return newLogs.slice(-MAX_LOGS); // Keep only the last MAX_LOGS entries
      });

      if (direction) {
        sendMoveCommand(direction);
      }
    },
    [sendMoveCommand]
  );

  useEffect(() => {
    if (!isConnected) return;

    abortController?.abort();
    const newController = new AbortController();
    setAbortController(newController);

    const fetchVideoUrl = async () => {
      try {
        const cameraUrl = `/api/proxy?camera=${
          selectedCamera.value
        }&timestamp=${Date.now()}`;
        const response = await fetch(cameraUrl, {
          signal: newController.signal,
        });
        if (response.ok) {
          setVideoUrl(cameraUrl);
        } else {
          console.error("Failed to fetch video stream");
        }
      } catch (error) {
        if ((error as any).name !== "AbortError") {
          console.error("Error fetching video stream:", error);
        }
      }
    };

    fetchVideoUrl();

    return () => newController.abort();
  }, [selectedCamera, isConnected]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isConnected) {
      interval = setInterval(fetchArduinoData, 5000);
    }

    return () => {
      if (interval) clearInterval(interval);
      abortController?.abort();
      setKeyboardLogs([]);
      setSelectedCamera(cameraOptions[0]);
      setVideoUrl("");
      setSensorError(false);
      setSensorLevel(0);
    };
  }, [isConnected]);

  useEffect(() => {

    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia("(orientation: landscape)");
    const handleChange = (e: any) => setIsLandscape(e.matches);

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Auto-scroll to the bottom when keyboardLogs changes
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTo({
        top: logsContainerRef.current.scrollHeight,
        behavior: "smooth", // Smooth scrolling for better UX
      });
    }
  }, [keyboardLogs]); // Trigger whenever keyboardLogs updates

  if (!isConnected) return null;

  if (isMobile) { 
    return (
      <div
        className={`h-screen grid grid-cols-[1fr_3fr_40px] gap-1 p-2 overflow-hidden`}
      >
        {/* First Column: Keyboard Logs and Controls */}
        <div className="flex flex-col h-full max-h-full min-h-0">
          {/* Keyboard Logs */}
          <div className="bg-white rounded-lg border-2 border-gray-700 p-2 h-1/2 max-h-1/2 overflow-hidden">
            <h3 className="text-sm font-bold text-gray-800 mb-1">
              Keyboard Logs
            </h3>
            <div
              ref={logsContainerRef}
              className="h-[calc(100%-2rem)] overflow-y-auto custom-scrollbar"
            >
              {keyboardLogs.length > 0 ? (
                keyboardLogs.map((log, index) => (
                  <p
                    key={index}
                    className={`text-gray-700 ${
                      isLandscape ? "text-[10px]" : "text-xs"
                    }`}
                  >
                    {log}
                  </p>
                ))
              ) : (
                <p
                  className={`text-gray-500 italic ${
                    isLandscape ? "text-[10px]" : "text-xs"
                  }`}
                >
                  No logs yet...
                </p>
              )}
            </div>
          </div>
  
          {/* Controls */}
          <div className="grid grid-cols-3 grid-rows-3 place-items-center w-full h-1/2 max-h-1/2">
            <div></div>
            {/* Forward */}
            <button
              onClick={() => {
                sendMoveCommand("w");
                setKeyboardLogs((prev) => [...prev, "[Move]: Forward"]);
              }}
              className="w-12 h-12  flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition"
            >
              <span className="text-red-500 text-lg">↑</span>
            </button>
            <div></div>
            {/* Left */}
            <button
              onClick={() => {
                sendMoveCommand("a");
                setKeyboardLogs((prev) => [...prev, "[Move]: Left"]);
              }}
              className="w-12 h-12  flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition"
            >
              <span className="text-red-500 text-lg">←</span>
            </button>
            <div
              onClick={() => {
                sendMoveCommand("q");
                setKeyboardLogs((prev) => [
                  ...prev,
                  "[Override]: Conveyor Motor",
                ]);
              }}
              className="bg-gray-400 w-12 h-12 rounded-full p-4 items-center justify-center flex "
            > 
              <div className="bg-red-500 w-8 h-8 rounded-full p-4"/>
             </div>
            {/* Right */}
            <button
              onClick={() => {
                sendMoveCommand("d");
                setKeyboardLogs((prev) => [...prev, "[Move]: Right"]);
              }}
              className="w-12 h-12  flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition"
            >
              <span className="text-red-500 text-lg">→</span>
            </button>
            <div></div>
            {/* Stop */}
            <button
              onClick={() => {
                sendMoveCommand("s");
                setKeyboardLogs((prev) => [...prev, "[Move]: Stop"]);
              }}
              className="w-12 h-12  flex items-center justify-center bg-gray-200 hover:bg-gray-300 rounded-full transition"
            >
              <span className="text-red-500 text-lg">↓</span>
            </button>
            <div></div>
          </div>
        </div>
  
        {/* Second Column: Camera */}
        <div className="bg-white p-2 rounded-xl shadow-lg flex flex-col h-full max-h-full gap-1 overflow-hidden min-h-0">
          <div className="flex justify-between items-center mb-1 flex-shrink-0">
            <label className="font-medium text-sm text-gray-700">
              Select Camera:
            </label>
            <select
              value={selectedCamera.label}
              onChange={(e) => {
                const cameraSelected = cameraOptions.find(
                  (camera) => camera.label === e.target.value
                );
                if (cameraSelected) {
                  setSelectedCamera(cameraSelected);
                  setKeyboardLogs((prevLogs) => [
                    ...prevLogs,
                    `[Camera Change]: Switched to ${cameraSelected.label}`,
                  ]);
                }
              }}
              className="p-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 text-sm text-black"
            >
              {cameraOptions.map(({ value, label }, index) => (
                <option key={`${value}_${index}`} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 bg-black rounded-lg overflow-hidden border-4 border-gray-300">
            {videoUrl && (
              <img
                key={videoUrl}
                src={videoUrl}
                alt={`Stream from ${selectedCamera.label}`}
                className="w-full h-full object-cover rounded-lg"
              />
            )}
          </div>
        </div>
  
        {/* Third Column: Ultrasonic Sensor */}
        <div className="h-full max-h-full min-h-0">
          <div className="bg-white rounded-lg flex flex-col items-center p-1 w-full h-full max-h-full">
            <div className="flex-1 w-full flex items-center justify-center">
              <div className="w-full h-full grid grid-rows-4 gap-1 border-2 border-gray-700 rounded-md p-1">
                {[...Array(4)].map((_, index) => {
                  const level = 4 - index;
                  return (
                    <div
                      key={level}
                      className={`w-full h-full rounded-sm ${
                        sensorLevel >= level
                          ? level >= 3
                            ? "bg-green-500"
                            : level === 2
                            ? "bg-yellow-500"
                            : "bg-red-500"
                          : "bg-gray-300"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
            {sensorError && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <p className="text-xs font-medium text-red-500">
                  Error fetching sensor data
                </p>
                <button
                  className="text-red-500 hover:text-red-700 cursor-pointer"
                  onClick={fetchArduinoData}
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  
  }
 
  return (
    <div className="h-screen grid grid-cols-[3fr_1fr] gap-6 p-6">
      {/* Camera Section */}
      <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col h-full gap-2">
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
                setKeyboardLogs((prevLogs) => [
                  ...prevLogs,
                  `[Camera Change]: Switched to ${cameraSelected.label}`,
                ]);
              }
            }}
            className="p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 text-black"
          >
            {cameraOptions.map(({ value, label }, index) => (
              <option key={`${value}_${index}`} value={label}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div className="h-[80%] bg-black rounded-lg overflow-hidden border-4 border-gray-300">
          {videoUrl && (
            <img
              key={videoUrl}
              src={videoUrl}
              alt={`Stream from ${selectedCamera.label}`}
              className="w-full h-full object-cover rounded-lg"
            />
          )}
        </div>
      </div>

      {/* Sensor & Logs Section */}
      <div className="grid grid-rows-[40%_60%] gap-4">
        <div className="bg-white rounded-lg flex flex-col items-center p-2 w-full h-full">
          <h2 className="text-[#445749] font-bold text-center">ULTRASONIC SENSOR</h2>
          <div className="flex-1 w-full flex items-center justify-center">
            <div className="w-full h-full grid grid-rows-4 gap-1 border-2 border-gray-700 rounded-md p-1">
              {[...Array(4)].map((_, index) => {
                const level = 4 - index;
                return (
                  <div
                    key={level}
                    className={`w-full h-full rounded-sm ${
                      sensorLevel >= level
                        ? level >= 3
                          ? "bg-green-500"
                          : level === 2
                          ? "bg-yellow-500"
                          : "bg-red-500"
                        : "bg-gray-300"
                    }`}
                  />
                );
              })}
            </div>
          </div>
          {sensorError && (
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-red-500">
                Error fetching sensor data
              </p>
              <button
                className="text-red-500 hover:text-red-700 cursor-pointer"
                onClick={fetchArduinoData}
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg border-2 border-gray-700 p-2 h-full overflow-auto">
          <h3 className="text-sm font-bold text-gray-800 mb-2">
            Keyboard Logs
          </h3>
          <div className="flex flex-col items-start">
            {keyboardLogs.length > 0 ? (
              keyboardLogs.map((log, index) => (
                <p key={index} className="text-sm text-gray-700">
                  {log}
                </p>
              ))
            ) : (
              <p className="text-sm text-gray-500 italic">No logs yet...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Controls;
