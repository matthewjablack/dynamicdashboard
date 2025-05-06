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
  time: string; // Changed to string to match CandlestickChart's expected format
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

  const { data, error, isLoading } = useQuery({
    queryKey: ["ccxt-ohlcv", exchange, symbol, timeframe],
    queryFn: async () => {
      const response = await api.get(`/api/ccxt/exchanges/${exchange}/ohlcv`, {
        params: {
          symbol,
          timeframe,
          limit: 1000,
        },
      });
      return response.data;
    },
    enabled: !!exchange && !!symbol,
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
    retry: 1,
  });

  // Handle timeframe change
  const handleTimeframeChange = useCallback((newTimeframe: string) => {
    setTimeframe(newTimeframe);
  }, []);

  // Handle filter change
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(e.target.value);
  };

  if (error) return <div className={`${isDarkMode ? "text-white" : "text-gray-900"}`}>Error loading data</div>;
  if (!data) return null;

  // Transform CCXT OHLCV data to the format expected by CandlestickChart
  const chartData = data
    .map(
      ([timestamp, open, high, low, close, volume]: number[]): OHLCVData => ({
        time: timestamp.toString(), // Keep as string with full timestamp
        open,
        high,
        low,
        close,
        volume,
      })
    )
    // Remove duplicates by time
    .reduce((acc: OHLCVData[], curr: OHLCVData) => {
      if (!acc.find((item) => item.time === curr.time)) {
        acc.push(curr);
      }
      return acc;
    }, [])
    // Sort by time in ascending order
    .sort((a: OHLCVData, b: OHLCVData) => parseInt(a.time) - parseInt(b.time));

  return (
    <div className={`p-4 rounded-lg shadow h-full w-full flex flex-col ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <div className="drag-handle cursor-move text-gray-400 hover:text-gray-600">⋮⋮</div>
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
        </div>
        {chartData.length > 0 && (
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
