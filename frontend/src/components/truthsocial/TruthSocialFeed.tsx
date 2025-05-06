import React, { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface TruthSocialPost {
  id: string;
  text: string;
  createdAt: string;
  username: string;
  name: string;
  profileUrl: string;
  mediaUrls?: string[];
}

interface TruthSocialFeedProps {
  identifiers: string[]; // usernames or profile URLs
  limit?: number;
}

const fetchTruthSocialPosts = async (identifiers: string[], limit?: number) => {
  const params = new URLSearchParams();
  identifiers.forEach((id) => params.append("identifiers", id));
  const response = await axios.get(`/api/truthsocial/posts?${params.toString()}`);
  // Optionally slice to limit
  return limit ? response.data.slice(0, limit) : response.data;
};

export const TruthSocialFeed: React.FC<TruthSocialFeedProps> = ({ identifiers, limit = 10 }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [editing, setEditing] = useState(false);

  const {
    data: posts,
    isLoading,
    error,
    refetch,
  } = useQuery(["truthsocial", identifiers.join(","), limit], () => fetchTruthSocialPosts(identifiers, limit), {
    enabled: identifiers.length > 0,
  });

  return (
    <div className={`h-full overflow-auto ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="drag-handle cursor-move mr-2 text-gray-400 hover:text-gray-600">⋮⋮</div>
            <h2 className={`text-lg font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              Latest Truth Social Posts
            </h2>
          </div>
        </div>
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        {error && (
          <div className={`flex items-center justify-center h-full ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
            Error loading posts
          </div>
        )}
        <div className="space-y-4">
          {posts?.map((post: any) => (
            <div
              key={post.id}
              className={`p-4 rounded-lg border ${
                isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
              }`}
            >
              <div className="flex items-center mb-2">
                <a href={post.profileUrl} target="_blank" rel="noopener noreferrer">
                  <span className={`font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{post.name}</span>
                  <span className={`ml-2 text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                    @{post.username}
                  </span>
                </a>
                <div className={`ml-auto text-sm ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                  {new Date(post.createdAt).toLocaleString()}
                </div>
              </div>
              <div className={`mb-3 ${isDarkMode ? "text-gray-200" : "text-gray-800"}`}>{post.text}</div>
              {post.mediaUrls && post.mediaUrls.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {post.mediaUrls.map((url: string) => (
                    <img key={url} src={url} alt="media" className="w-24 h-24 object-cover rounded" />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TruthSocialFeed;
