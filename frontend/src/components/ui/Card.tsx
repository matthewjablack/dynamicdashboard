import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = "" }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  return <div className={`rounded-lg shadow ${isDarkMode ? "bg-gray-800" : "bg-white"} ${className}`}>{children}</div>;
};
