import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "react-query";
import { api } from "@/lib/api";

interface FuturesData {
  instrument: string;
  bidAmount: number;
  bid: number;
  mark: number;
  ask: number;
  askAmount: number;
  low24h: number;
  high24h: number;
  change24h: string;
  volume24h: number;
  openInterest: number;
  premium: string;
  premiumAmount: number;
  tenor: string;
  apr: string;
}

interface DeribitFuturesProps {
  symbol?: string;
}

export const DeribitFutures: React.FC<DeribitFuturesProps> = ({ symbol = "BTC" }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  const {
    data: futuresData,
    isLoading,
    error,
  } = useQuery<FuturesData[]>(
    ["deribit-futures", symbol],
    async () => {
      const response = await api.get(`/api/deribit/futures/${symbol}`);
      return response.data;
    },
    {
      refetchInterval: 10000, // Refetch every 10 seconds
      staleTime: 5000, // Consider data stale after 5 seconds
    }
  );

  const formatNumber = (value: number, decimals: number = 2, prefix: string = "") => {
    if (value >= 1_000_000) {
      return `${prefix}${(value / 1_000_000).toFixed(decimals)}M`;
    } else if (value >= 1_000) {
      return `${prefix}${(value / 1_000).toFixed(decimals)}K`;
    }
    return `${prefix}${value.toFixed(decimals)}`;
  };

  if (isLoading) {
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
        <div className="text-red-500">Error loading futures data</div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg shadow h-full w-full ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
      <div className="flex items-center gap-2 select-none mb-4">
        <div className="drag-handle cursor-move text-gray-400 hover:text-gray-600">⋮⋮</div>
        <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>{symbol} Futures</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              <th className="text-left py-2">Instrument</th>
              <th className="text-right py-2">Bid (Size)</th>
              <th className="text-right py-2">Mark</th>
              <th className="text-right py-2">Ask (Size)</th>
              <th className="text-right py-2">Premium</th>
              <th className="text-right py-2">APR</th>
              <th className="text-right py-2">24h Vol</th>
              <th className="text-right py-2">OI</th>
              <th className="text-right py-2">Tenor</th>
            </tr>
          </thead>
          <tbody>
            {futuresData?.map((row) => (
              <tr
                key={row.instrument}
                className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-800"} border-b ${
                  isDarkMode ? "border-gray-700" : "border-gray-200"
                }`}
              >
                <td className="py-2">{row.instrument}</td>
                <td className="text-right py-2">
                  {formatNumber(row.bid, 1, "$")} ({formatNumber(row.bidAmount, 0)})
                </td>
                <td className="text-right py-2">{formatNumber(row.mark, 1, "$")}</td>
                <td className="text-right py-2">
                  {formatNumber(row.ask, 1, "$")} ({formatNumber(row.askAmount, 0)})
                </td>
                <td className={`text-right py-2 ${row.premium.startsWith("+") ? "text-green-500" : "text-red-500"}`}>
                  {row.premium} (${formatNumber(row.premiumAmount, 2)})
                </td>
                <td className={`text-right py-2 ${row.apr.startsWith("+") ? "text-green-500" : "text-gray-400"}`}>
                  {row.apr}
                </td>
                <td className="text-right py-2">{formatNumber(row.volume24h, 2, "$")}</td>
                <td className="text-right py-2">{formatNumber(row.openInterest, 2, "$")}</td>
                <td className="text-right py-2">{row.tenor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DeribitFutures;
