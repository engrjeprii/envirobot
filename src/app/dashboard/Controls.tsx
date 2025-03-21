import React, { useState, useEffect } from "react";

interface ControlsProps {
  isConnected: boolean;
}

const Controls: React.FC<ControlsProps> = ({ isConnected }) => {
  const [videoUrl, setVideoUrl] = useState("");
  const cameraOptions = [
    { label: "Camera 1", value: "camera1" },
    { label: "Camera 2", value: "camera2" },
    { label: "Camera 3", value: "camera3" },
  ];
  const [selectedCamera, setSelectedCamera] = useState(cameraOptions[0]);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);

  useEffect(() => {
    if (!isConnected) return;

    // Abort previous request if exists
    abortController?.abort();

    const newController = new AbortController();
    setAbortController(newController);

    const fetchVideoUrl = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 300)); // Small delay to prevent overload
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
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Error fetching video stream:", error);
        }
      }
    };

    fetchVideoUrl();

    return () => newController.abort();
  }, [selectedCamera, isConnected]);

  // ❗ Stop requests when the user logs out
  useEffect(() => {
    return () => {
      console.log("Component unmounting, stopping all streams...");
      abortController?.abort();
    };
  }, []);
  if (!isConnected) return null;

  return (
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
      </div>
    </div>
  );
};

export default Controls;
