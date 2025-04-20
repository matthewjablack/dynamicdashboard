import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "outline" | "ghost";
  className?: string;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = "primary",
  className = "",
  disabled = false,
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const baseStyles = "px-4 py-2 rounded-md font-medium transition-colors duration-200";

  const variantStyles = {
    primary: isDarkMode ? "bg-blue-600 hover:bg-blue-700 text-white" : "bg-blue-500 hover:bg-blue-600 text-white",
    outline: isDarkMode
      ? "border border-gray-600 hover:bg-gray-700 text-white"
      : "border border-gray-300 hover:bg-gray-100 text-gray-900",
    ghost: isDarkMode ? "hover:bg-gray-700 text-white" : "hover:bg-gray-100 text-gray-900",
  };

  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${disabledStyles} ${className}`}
    >
      {children}
    </button>
  );
};
