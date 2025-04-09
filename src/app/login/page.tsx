"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

import {isMobile} from 'react-device-detect'

import NextImage from "next/image";
import EyeIcon from "./EyeIcon";

const envirobot = require("./envirobot.png");

const LoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();

  const handleLogin = () => {
    console.log(credentials);

    if (credentials.username === "admin" && credentials.password === "admin") {
      router.push("/dashboard");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    isMobile ? <div>THis is a mobile view</div> : (
      
    <div className="flex items-center justify-center h-screen bg-gradient-to-b from-blue-500 to-green-500">
    <div className="bg-white p-8 rounded-2xl shadow-lg w-96 text-center">
      <NextImage
        src={envirobot}
        alt="EnviRobot Logo"
        width={128}
        height={128}
        className="mx-auto mb-4"
        priority
      />
      <input
        type="text"
        placeholder="Username"
        className="w-full p-2 mb-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-black"
        onChange={(e) =>
          setCredentials({ ...credentials, username: e.target.value })
        }
      />
      <div className="relative w-full mb-2">
        <input
          type={showPassword ? "text" : "password"}
          placeholder="Password"
          className="w-full p-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 text-black"
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          onChange={(e) =>
            setCredentials({ ...credentials, password: e.target.value })
          }
        />
        <button
          type="button"
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer "
          onClick={() => setShowPassword(!showPassword)}
        >
          <EyeIcon show={showPassword} />
        </button>
      </div>
      <button
        className="w-full bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition cursor-pointer"
        onClick={handleLogin}
      >
        Login
      </button>
    </div>
  </div>
    )
  );
};

export default LoginPage;
