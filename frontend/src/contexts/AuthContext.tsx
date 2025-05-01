"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

interface User {
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if there's a token in localStorage
    const token = localStorage.getItem("token");
    if (token) {
      // Set the token in axios defaults
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      // Get user info from token
      const userEmail = localStorage.getItem("userEmail");
      if (userEmail) {
        setUser({ email: userEmail });
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const formData = new URLSearchParams();
      formData.append("username", email); // FastAPI OAuth2 expects username
      formData.append("password", password);

      const response = await api.post("/api/auth/token", formData, {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      });
      const { access_token } = response.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("userEmail", email);
      api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      setUser({ email });
    } catch (error: any) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    try {
      const response = await api.post("/api/auth/register", {
        email,
        password,
      });
      const { access_token } = response.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("userEmail", email);
      api.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;
      setUser({ email });
    } catch (error: any) {
      console.error("Registration error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
    router.push("/login");
  };

  return <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
