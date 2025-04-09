import React, { useState, useCallback } from "react";
import { useQuery } from "react-query";
import CandlestickChart from "../charts/CandlestickChart";
import { marketDataApi } from "@/lib/api";

interface HyperliquidChartProps {
  symbol: string;
  interval?: string;
  limit?: number;
  currency?: string;
}

export const HyperliquidChart: React.FC<HyperliquidChartProps> = ({
  symbol,
  interval: initialInterval = "1m",
  limit = 5000,
  currency = "USD",
}) => {
  // Use the provided interval without overriding it
  const [interval, setInterval] = useState(initialInterval);
  const { data: candles, isLoading, refetch } = useQuery(
    ["hyperliquid-candles", symbol, interval, limit],
    () => marketDataApi.getHistoricalData(symbol, interval, limit),
    {
      refetchInterval: 60000, // Refetch every minute
      staleTime: 30000, // Consider data stale after 30 seconds
    }
  );

  const { data: marketData } = useQuery(
    ["hyperliquid-market-data", symbol],
    () => marketDataApi.getMarketData(symbol),
    {
      refetchInterval: 10000, // Refetch every 10 seconds
      staleTime: 5000, // Consider data stale after 5 seconds
    }
  );
  
  // Handle timeframe change
  const handleTimeframeChange = useCallback((timeframe: string) => {
    // Map timeframe to interval
    let newInterval;
    switch (timeframe) {
      case "1h":
        newInterval = "1h";
        break;
      case "4h":
        newInterval = "4h";
        break;
      case "1d":
        newInterval = "1d";
        break;
      case "1w":
        newInterval = "1w";
        break;
      case "1m":
        newInterval = "1m"; // Use 1m for minute view
        break;
      default:
        newInterval = initialInterval; // Default to the initial interval
    }
    
    if (newInterval !== interval) {
      setInterval(newInterval);
      // Data will be refetched automatically due to query key change
    }
  }, [interval]);

  if (isLoading || !candles) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow h-full w-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{symbol}</h2>
        {marketData && marketData.markPx !== undefined && (
          <div className="text-right">
            <div className="text-2xl font-bold">${Number(marketData.markPx).toFixed(2)}</div>
            <div className="text-sm text-gray-500">
              24h Change: {marketData.prevDayPx !== undefined ? Number(marketData.prevDayPx).toFixed(2) : "N/A"}%
            </div>
          </div>
        )}
      </div>
      <div className="flex-1 min-h-0">
        <CandlestickChart 
          data={candles} 
          symbol={symbol} 
          currency={currency}
          onTimeframeChange={handleTimeframeChange}
          isDarkMode={false}
          isLoading={isLoading}
          height={undefined} // Let it fill the container
        />
      </div>
      {marketData && (
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="text-sm text-gray-500">Funding Rate</div>
            <div className="text-lg font-semibold">
              {marketData.funding !== undefined ? `${(Number(marketData.funding) * 100).toFixed(4)}%` : "N/A"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">Open Interest</div>
            <div className="text-lg font-semibold">
              {marketData.openInterest !== undefined ? Number(marketData.openInterest).toLocaleString() : "N/A"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-500">24h Volume</div>
            <div className="text-lg font-semibold">
              {marketData.dayNtlVlm !== undefined ? `$${Number(marketData.dayNtlVlm).toLocaleString()}` : "N/A"}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
