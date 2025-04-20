import React from "react";
import { useTheme } from "@/contexts/ThemeContext";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
}

export const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <select
      value={value}
      onChange={onChange}
      className={`w-full px-3 py-2 rounded-md border ${
        isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
      } focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};
