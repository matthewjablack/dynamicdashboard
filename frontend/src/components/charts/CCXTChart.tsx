import React, { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { CandlestickChart } from "./CandlestickChart";
import { api } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";

interface CCXTChartProps {
  exchange: string;
  symbol: string;
  timeframe?: string;
}

interface OHLCVData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export const CCXTChart: React.FC<CCXTChartProps> = ({ exchange, symbol, timeframe: initialTimeframe = "1m" }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [filters, setFilters] = useState("");

  const { data, isLoading, error } = useQuery({
    queryKey: ["ccxt-ohlcv", exchange, symbol, timeframe],
    queryFn: async () => {
      const response = await api.get(`/ccxt/exchanges/${exchange}/ohlcv`, {
        params: {
          symbol,
          timeframe,
          filters: filters.trim() ? filters.split(",").map((f) => f.trim()) : undefined,
        },
      });
      return response.data;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  // Handle timeframe change
  const handleTimeframeChange = useCallback(
    (newTimeframe: string) => {
      // Map timeframe to interval
      let selectedTimeframe;
      switch (newTimeframe) {
        case "1h":
          selectedTimeframe = "1h";
          break;
        case "4h":
          selectedTimeframe = "4h";
          break;
        case "1d":
          selectedTimeframe = "1d";
          break;
        case "1w":
          selectedTimeframe = "1w";
          break;
        case "1m":
          selectedTimeframe = "1m"; // Use 1m for minute view
          break;
        default:
          selectedTimeframe = initialTimeframe; // Default to the initial timeframe
      }

      if (selectedTimeframe !== timeframe) {
        setTimeframe(selectedTimeframe);
        // Data will be refetched automatically due to query key change
      }
    },
    [timeframe, initialTimeframe]
  );

  // Handle filter change
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(e.target.value);
  };

  if (isLoading) return <div className={`${isDarkMode ? "text-white" : "text-gray-900"}`}>Loading...</div>;
  if (error) return <div className={`${isDarkMode ? "text-white" : "text-gray-900"}`}>Error loading data</div>;
  if (!data) return null;

  // Transform CCXT OHLCV data to the format expected by CandlestickChart
  const chartData = data.map(
    ([timestamp, open, high, low, close, volume]: number[]): OHLCVData => ({
      time: timestamp / 1000, // Convert to seconds
      open,
      high,
      low,
      close,
      volume,
    })
  );

  return (
    <div className={`p-4 rounded-lg shadow h-full w-full flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex flex-col gap-2">
          <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{symbol}</h2>
          <input
            type="text"
            value={filters}
            onChange={handleFilterChange}
            placeholder="Enter filters (comma-separated)"
            className={`px-3 py-1 rounded border ${
              isDarkMode
                ? "bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"
            } focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />
        </div>
        {data.length > 0 && (
          <div className="text-right">
            <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
              ${Number(chartData[chartData.length - 1].close).toFixed(2)}
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0">
        <CandlestickChart
          data={chartData}
          symbol={symbol}
          currency="USD"
          onTimeframeChange={handleTimeframeChange}
          isLoading={isLoading}
          height={undefined} // Let it fill the container
        />
      </div>
    </div>
  );
};
