"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "react-query";
import { getUserTweets } from "@/lib/twitter";

interface Tweet {
  id: string;
  text: string;
  created_at: string;
  author: {
    username: string;
    name: string;
    profile_image_url: string;
  };
  public_metrics: {
    retweet_count: number;
    reply_count: number;
    like_count: number;
    quote_count: number;
  };
}

interface TwitterFeedProps {
  usernames: string | string[];
  limit?: number;
  hoursAgo?: number;
}

export const TwitterFeed: React.FC<TwitterFeedProps> = ({ usernames, limit = 10, hoursAgo = 6 }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  // Convert usernames to array if it's a string
  const usernameArray = typeof usernames === "string" ? usernames.split(",").map((u) => u.trim()) : usernames;

  const {
    data: tweets,
    isLoading,
    error,
  } = useQuery<Tweet[]>(
    ["tweets", usernameArray.join(","), hoursAgo],
    () => getUserTweets(usernameArray, limit, hoursAgo),
    {
      refetchInterval: 60000, // Refetch every minute
    }
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const formatMetric = (value: number): string => {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    } else if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }
    return value.toString();
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${isDarkMode ? "text-white" : "text-gray-900"}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-full ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
        Error loading tweets
      </div>
    );
  }

  return (
    <div className={`h-full overflow-auto ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
      <div className="p-4">
        <h2 className={`text-lg font-bold mb-4 ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          Latest Tweets{" "}
          {usernameArray.length === 1 ? `from @${usernameArray[0]}` : `from ${usernameArray.length} accounts`}
        </h2>
        <div className="space-y-4">
          {tweets?.map((tweet) => (
            <div
              key={tweet.id}
              className={`p-4 rounded-lg border ${
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-center mb-2">
                <img
                  src={tweet.author.profile_image_url}
                  alt={tweet.author.name}
                  className="w-10 h-10 rounded-full mr-3"
                />
                <div>
                  <div className={`font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{tweet.author.name}</div>
                  <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    @{tweet.author.username}
                  </div>
                </div>
                <div className={`ml-auto text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {formatDate(tweet.created_at)}
                </div>
              </div>
              <div className={`mb-3 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>{tweet.text}</div>
              <div className={`flex justify-between text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                <span>💬 {formatMetric(tweet.public_metrics.reply_count)}</span>
                <span>🔄 {formatMetric(tweet.public_metrics.retweet_count)}</span>
                <span>❤️ {formatMetric(tweet.public_metrics.like_count)}</span>
                <span>🔄💬 {formatMetric(tweet.public_metrics.quote_count)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TwitterFeed;
