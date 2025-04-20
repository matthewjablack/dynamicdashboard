"use client";

import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";
import { useTheme } from "@/contexts/ThemeContext";

interface Message {
  role: "user" | "assistant";
  content: string;
  components?: any[];
}

interface ChatResponse {
  message: string;
  components: Array<{
    type: string;
    props: Record<string, any>;
  }>;
}

interface ChatInterfaceProps {
  onAddComponent: (component: any) => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onAddComponent }) => {
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const { mutate: sendMessage, isPending } = useMutation({
    mutationFn: async (message: string): Promise<ChatResponse> => {
      // Simulate API call with a delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock response based on message content
      if (message.toLowerCase().includes("futures") || message.toLowerCase().includes("premium")) {
        return {
          message: "I'll add the Deribit futures table showing premiums and APR.",
          components: [
            {
              type: "DeribitFutures",
              props: {
                symbol: "BTC",
              },
            },
          ],
        };
      }

      return {
        message: "I'll add a ETH price chart to your dashboard.",
        components: [
          {
            type: "HyperliquidChart",
            props: {
              symbol: "ETH",
              interval: "1m",
              limit: 5000,
              currency: "USD",
            },
          },
        ],
      };
    },
    onSuccess: (data: ChatResponse) => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.message,
          components: data.components,
        },
      ]);

      // Add components to dashboard if any
      if (data.components && data.components.length > 0) {
        data.components.forEach((component) => {
          onAddComponent(component);
        });
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    sendMessage(userMessage);
  };

  return (
    <div className={`flex flex-col h-full ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-lg p-4 ${
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : theme === "dark"
                  ? "bg-gray-800 text-gray-200 shadow"
                  : "bg-white text-gray-800 shadow"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              {message.components && <div className="mt-2">{/* Component previews would go here */}</div>}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className={`p-4 border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`}
      >
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className={`flex-1 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              theme === "dark" ? "bg-gray-800 text-white border-gray-700" : "border border-gray-300"
            }`}
            disabled={isPending}
          />
          <button
            type="submit"
            disabled={isPending}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition-colors duration-200"
          >
            <ChatBubbleLeftIcon className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
