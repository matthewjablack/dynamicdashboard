import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({ value, onChange, min, max, step = 1, className = "" }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
          isDarkMode ? "bg-gray-600 accent-blue-500" : "bg-gray-200 accent-blue-500"
        }`}
      />
      <span className={`text-sm font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>{value}</span>
    </div>
  );
};
