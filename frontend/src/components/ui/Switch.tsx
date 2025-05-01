import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface SwitchProps {
  checked: boolean;
  onChange: () => void;
  label?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({ checked, onChange, label, className = "" }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <label className={`flex items-center cursor-pointer ${className}`}>
      <div className="relative">
        <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
        <div
          className={`block w-14 h-8 rounded-full transition-colors duration-300 ${
            checked ? "bg-blue-500" : isDarkMode ? "bg-gray-600" : "bg-gray-300"
          }`}
        />
        <div
          className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform duration-300 ${
            checked ? "transform translate-x-6" : ""
          }`}
        />
      </div>
      {label && <span className={`ml-3 ${isDarkMode ? "text-white" : "text-gray-900"}`}>{label}</span>}
    </label>
  );
};
