import React from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface PerpetualData {
  exchange: string;
  symbol: string;
  markPrice: number;
  indexPrice: number;
  fundingRate: number;
  nextFundingTime: string;
  volume24h: number;
  openInterest: number;
}

interface PerpetualSwapsProps {
  exchanges?: string[] | string;
  symbols?: string[] | string;
}

export const PerpetualSwaps: React.FC<PerpetualSwapsProps> = ({
  exchanges = ["binance", "okx", "bybit"],
  symbols = ["BTC/USDT:USDT", "ETH/USDT:USDT"],
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";

  // Convert inputs to arrays if they're strings
  const exchangesArray = Array.isArray(exchanges) ? exchanges : exchanges.split(",").map((e) => e.trim());
  const symbolsArray = Array.isArray(symbols) ? symbols : symbols.split(",").map((s) => s.trim());

  const {
    data: perpetualData,
    isPending,
    error,
  } = useQuery({
    queryKey: ["perpetual-swaps", exchangesArray, symbolsArray],
    queryFn: async (): Promise<PerpetualData[]> => {
      try {
        console.log("Fetching perpetual swaps with params:", {
          exchanges: exchangesArray.join(","),
          symbols: symbolsArray.join(","),
        });

        const response = await api.get(`/api/ccxt/perpetual-swaps`, {
          params: {
            exchanges: exchangesArray.join(","),
            symbols: symbolsArray.join(","),
          },
        });

        console.log("Perpetual swaps response:", response.data);
        return response.data.data;
      } catch (err: any) {
        console.error("Error fetching perpetual swaps:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status,
        });
        throw err;
      }
    },
    refetchInterval: 10000, // Refetch every 10 seconds
    staleTime: 5000, // Consider data stale after 5 seconds
  });

  // Log error if present
  React.useEffect(() => {
    if (error) {
      console.error("PerpetualSwaps component error:", error);
    }
  }, [error]);

  const formatNumber = (value: number | null | undefined, decimals: number = 2, prefix: string = "") => {
    if (value == null) return `${prefix}0.00`;

    if (value >= 1_000_000) {
      return `${prefix}${(value / 1_000_000).toFixed(decimals)}M`;
    } else if (value >= 1_000) {
      return `${prefix}${(value / 1_000).toFixed(decimals)}K`;
    }
    return `${prefix}${value.toFixed(decimals)}`;
  };

  const formatFundingRate = (rate: number | null | undefined) => {
    if (rate == null) return <span className="text-gray-400">N/A</span>;

    const percentage = (rate * 100).toFixed(4);
    const color = rate >= 0 ? "text-green-500" : "text-red-500";
    return <span className={color}>{percentage}%</span>;
  };

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
        className={`p-4 rounded-lg shadow h-full w-full flex flex-col items-center justify-center gap-2 ${
          isDarkMode ? "bg-gray-800" : "bg-white"
        }`}
      >
        <div className="text-red-500 font-semibold">Error loading perpetual swap data</div>
        <div className="text-sm text-gray-500">{error instanceof Error ? error.message : "Unknown error occurred"}</div>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-lg shadow h-full w-full ${isDarkMode ? "bg-gray-800" : "bg-white"}`}>
      <div className="flex items-center gap-2 select-none mb-4">
        <div className="drag-handle cursor-move text-gray-400 hover:text-gray-600">⋮⋮</div>
        <h2 className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>Perpetual Swaps</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className={`text-sm ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>
              <th className="text-left py-2">Exchange</th>
              <th className="text-left py-2">Symbol</th>
              <th className="text-right py-2">Mark Price</th>
              <th className="text-right py-2">Index Price</th>
              <th className="text-right py-2">Premium</th>
              <th className="text-right py-2">Funding Rate</th>
              <th className="text-right py-2">Next Funding</th>
              <th className="text-right py-2">24h Vol</th>
              <th className="text-right py-2">OI</th>
            </tr>
          </thead>
          <tbody>
            {perpetualData?.map((row: PerpetualData) => {
              const premium =
                row.markPrice && row.indexPrice ? ((row.markPrice / row.indexPrice - 1) * 100).toFixed(4) : "0.00";
              const premiumColor = parseFloat(premium) >= 0 ? "text-green-500" : "text-red-500";

              return (
                <tr
                  key={`${row.exchange}-${row.symbol}`}
                  className={`text-sm ${isDarkMode ? "text-gray-200" : "text-gray-800"} border-b ${
                    isDarkMode ? "border-gray-700" : "border-gray-200"
                  }`}
                >
                  <td className="py-2 capitalize">{row.exchange}</td>
                  <td className="py-2">{row.symbol}</td>
                  <td className="text-right py-2">{formatNumber(row.markPrice, 2, "$")}</td>
                  <td className="text-right py-2">{formatNumber(row.indexPrice, 2, "$")}</td>
                  <td className={`text-right py-2 ${premiumColor}`}>{premium}%</td>
                  <td className="text-right py-2">{formatFundingRate(row.fundingRate)}</td>
                  <td className="text-right py-2">{row.nextFundingTime || "N/A"}</td>
                  <td className="text-right py-2">{formatNumber(row.volume24h, 2, "$")}</td>
                  <td className="text-right py-2">{formatNumber(row.openInterest, 2, "$")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PerpetualSwaps;
