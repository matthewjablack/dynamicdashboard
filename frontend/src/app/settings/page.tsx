"use client";

import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";
import Navbar from "@/components/navigation/Navbar";

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const isDarkMode = theme === "dark";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <h1 className={`text-2xl font-bold mb-6 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Settings</h1>

        <div className="space-y-6">
          {/* Theme Settings */}
          <Card className="p-6">
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>Appearance</h2>
            <div className="space-y-4">
              <Switch label="Dark Mode" checked={isDarkMode} onChange={toggleTheme} className="mb-2" />
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Choose between light and dark theme for your dashboard experience.
              </p>
            </div>
          </Card>

          {/* User Settings */}
          <Card className="p-6">
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Account Settings
            </h2>
            <div className="space-y-4">
              <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                <p className="font-medium">Email</p>
                <p>{user?.email}</p>
              </div>
            </div>
          </Card>

          {/* Dashboard Preferences */}
          <Card className="p-6">
            <h2 className={`text-xl font-semibold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Dashboard Preferences
            </h2>
            <div className="space-y-4">
              <Switch label="Auto-save Layout Changes" checked={true} onChange={() => {}} className="mb-2" />
              <p className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
                Automatically save dashboard layout changes as you make them.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
