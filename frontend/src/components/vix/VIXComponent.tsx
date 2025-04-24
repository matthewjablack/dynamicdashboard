import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { LineChart } from "@/components/charts/LineChart";

interface VIXData {
  current: {
    price: number;
    change: number;
    high: number;
    low: number;
    volume: number;
  };
  historical: Array<{
    Date: string;
    Close: number;
    Change: number;
  }>;
}

export const VIXComponent: React.FC = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const {
    data: vixData,
    isPending,
    error,
  } = useQuery({
    queryKey: ["vix-data"],
    queryFn: async (): Promise<VIXData> => {
      const response = await api.get("/api/vix");
      return response.data;
    },
    refetchInterval: 60000, // Refetch every minute
    staleTime: 30000, // Consider data stale after 30 seconds
  });

  if (isPending) {
    return (
      <div
        className={`p-4 rounded-lg shadow h-full w-full flex items-center justify-center ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`p-4 rounded-lg shadow h-full w-full flex items-center justify-center ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="text-red-500">Error loading VIX data</div>
      </div>
    );
  }

  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
  };

  // Transform data for LineChart
  const chartData = vixData.historical.map((item) => ({
    time: new Date(item.Date).getTime(),
    value: item.Close,
  }));

  return (
    <div className={`p-4 rounded-lg shadow h-full w-full ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
      <div className="flex items-center gap-2 select-none mb-4">
        <div className="drag-handle cursor-move text-gray-400 hover:text-gray-600">⋮⋮</div>
        <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>VIX Index</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
          <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Current</div>
          <div className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            {formatNumber(vixData.current.price)}
          </div>
          <div className={`text-sm ${vixData.current.change >= 0 ? "text-green-500" : "text-red-500"}`}>
            {vixData.current.change >= 0 ? "+" : ""}
            {formatNumber(vixData.current.change)}%
          </div>
        </div>
        <div className={`p-3 rounded-lg ${isDarkMode ? "bg-gray-700" : "bg-gray-50"}`}>
          <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Range</div>
          <div className={`text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>
            H: {formatNumber(vixData.current.high)} L: {formatNumber(vixData.current.low)}
          </div>
          <div className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
            Vol: {vixData.current.volume.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="h-64">
        <LineChart data={chartData} symbol="VIX" currency="USD" height={256} />
      </div>
    </div>
  );
};

export default VIXComponent;
