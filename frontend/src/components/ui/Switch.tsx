import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface SwitchProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({ label, checked, onChange, className = "" }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <label className={`flex items-center space-x-3 ${className}`}>
      <div className="relative">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="sr-only" />
        <div
          className={`block w-14 h-8 rounded-full transition-colors duration-200 ${
            checked ? (isDarkMode ? "bg-blue-600" : "bg-blue-500") : isDarkMode ? "bg-gray-600" : "bg-gray-300"
          }`}
        />
        <div
          className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-200 ${
            checked ? "translate-x-6" : ""
          }`}
        />
      </div>
      <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{label}</span>
    </label>
  );
};
