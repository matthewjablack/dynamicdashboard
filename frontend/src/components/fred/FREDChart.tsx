"use client";

import React, { useState } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { getFREDSeries, searchFREDSeries } from "@/lib/fred";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface FREDChartProps {
  seriesId: string;
  limit?: number;
}

export const FREDChart: React.FC<FREDChartProps> = ({ seriesId, limit = 10 }) => {
  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<FREDSeries | null>(null);

  const {
    data: seriesData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["fred-series", seriesId, limit],
    queryFn: () => getFREDSeries(seriesId, limit),
    retry: 2,
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  const {
    data: searchResults,
    isLoading: isSearching,
    error: searchError,
  } = useQuery({
    queryKey: ["fred-search", searchTerm],
    queryFn: () => searchFREDSeries(searchTerm),
    enabled: showSearch && searchTerm.length > 2,
    retry: 2,
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  const formatValue = (value: number) => {
    if (Math.abs(value) >= 1e12) {
      return `${(value / 1e12).toFixed(2)}T`;
    } else if (Math.abs(value) >= 1e9) {
      return `${(value / 1e9).toFixed(2)}B`;
    } else if (Math.abs(value) >= 1e6) {
      return `${(value / 1e6).toFixed(2)}M`;
    } else if (Math.abs(value) >= 1e3) {
      return `${(value / 1e3).toFixed(2)}K`;
    }
    return value.toFixed(2);
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-full ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-full p-4 ${
          theme === "dark" ? "text-red-400" : "text-red-600"
        }`}
      >
        <p>Error loading FRED data</p>
        <button onClick={() => refetch()} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Retry
        </button>
      </div>
    );
  }

  if (!seriesData || seriesData.length === 0) {
    return (
      <div className={`flex items-center justify-center h-full ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
        No data available
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${theme === "dark" ? "bg-gray-900" : "bg-white"}`}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <div className="drag-handle cursor-move mr-2 text-gray-400 hover:text-gray-600">⋮⋮</div>
            <h2 className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
              {seriesData[0]?.title || seriesId}
            </h2>
          </div>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className={`px-3 py-1 rounded text-sm ${
              theme === "dark"
                ? "bg-gray-700 text-white hover:bg-gray-600"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }`}
          >
            {showSearch ? "Close Search" : "Search Series"}
          </button>
        </div>

        {showSearch && (
          <div className={`mb-4 p-4 rounded-lg ${theme === "dark" ? "bg-gray-800" : "bg-gray-100"}`}>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for economic series..."
              className={`w-full px-3 py-2 rounded border ${
                theme === "dark"
                  ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                  : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            {isSearching && (
              <div className="mt-2 text-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            )}
            {searchError && (
              <div className={`mt-2 text-sm ${theme === "dark" ? "text-red-400" : "text-red-600"}`}>
                Error searching series
              </div>
            )}
            {searchResults && searchResults.length > 0 && (
              <div
                className={`mt-2 max-h-48 overflow-y-auto rounded border ${
                  theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
                }`}
              >
                {searchResults.map((series) => (
                  <button
                    key={series.id}
                    onClick={() => {
                      setSelectedSeries(series);
                      setShowSearch(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-blue-500 hover:text-white ${
                      theme === "dark" ? "text-white" : "text-gray-900"
                    }`}
                  >
                    <div className="font-medium">{series.title}</div>
                    <div className="text-sm opacity-75">
                      {series.id} • {series.frequency} • {series.units}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={seriesData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === "dark" ? "#374151" : "#E5E7EB"} />
              <XAxis dataKey="date" tickFormatter={formatDate} stroke={theme === "dark" ? "#9CA3AF" : "#4B5563"} />
              <YAxis tickFormatter={formatValue} stroke={theme === "dark" ? "#9CA3AF" : "#4B5563"} />
              <Tooltip
                contentStyle={{
                  backgroundColor: theme === "dark" ? "#1F2937" : "#FFFFFF",
                  border: `1px solid ${theme === "dark" ? "#374151" : "#E5E7EB"}`,
                  borderRadius: "0.375rem",
                }}
                labelStyle={{ color: theme === "dark" ? "#F3F4F6" : "#1F2937" }}
                formatter={(value: number) => [formatValue(value), "Value"]}
                labelFormatter={formatDate}
              />
              <Line type="monotone" dataKey="value" stroke="#3B82F6" dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className={`mt-2 text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-600"}`}>
          {seriesData[0]?.units && <div>Units: {seriesData[0].units}</div>}
          {seriesData[0]?.frequency && <div>Frequency: {seriesData[0].frequency}</div>}
        </div>
      </div>
    </div>
  );
};

export default FREDChart;
