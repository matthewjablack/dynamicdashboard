import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Cog6ToothIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const router = useRouter();

  return (
    <nav className={`border-b ${isDarkMode ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-white"}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              <span className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                Dynamic Dashboard
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {user && (
              <>
                <Link
                  href="/settings"
                  className={`p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${
                    isDarkMode ? "text-gray-300" : "text-gray-600"
                  }`}
                >
                  <Cog6ToothIcon className="h-5 w-5" />
                </Link>
                <button
                  onClick={() => logout()}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                    isDarkMode ? "hover:bg-gray-800 text-gray-300" : "hover:bg-gray-100 text-gray-600"
                  }`}
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span>Logout</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
