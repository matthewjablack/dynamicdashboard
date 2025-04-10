"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import {
  createChart,
  ColorType,
  Time,
  IChartApi,
  DeepPartial,
  ChartOptions,
  CrosshairMode,
  LineStyle,
  PriceScaleMode,
  CandlestickSeries,
  HistogramSeries,
} from "lightweight-charts";
import { useTheme } from "@/contexts/ThemeContext";

interface CustomCandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickChartProps {
  data: CustomCandlestickData[];
  symbol: string;
  currency: string;
  isLoading?: boolean;
  error?: string;
  height?: number;
  onTimeframeChange?: (timeframe: string) => void;
}

type Timeframe = "1h" | "4h" | "1d" | "1w" | "1m";

const CandlestickChart: React.FC<CandlestickChartProps> = ({
  data,
  symbol,
  currency,
  isLoading = false,
  error = "",
  height = 400,
  onTimeframeChange,
}) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickSeriesRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);

  // Set initial timeframe based on data interval
  const getInitialTimeframe = (): Timeframe => {
    if (data && data.length > 1) {
      const time1 = parseInt(data[0].time);
      const time2 = parseInt(data[1].time);
      const diffMs = Math.abs(time2 - time1);
      const diffMinutes = diffMs / (1000 * 60);

      if (diffMinutes <= 1) return "1m";
      if (diffMinutes <= 60) return "1h";
      if (diffMinutes <= 240) return "4h";
      if (diffMinutes <= 1440) return "1d";
      if (diffMinutes <= 10080) return "1w";
    }
    return "1d";
  };

  const [selectedTimeframe, setSelectedTimeframe] = useState<Timeframe>(getInitialTimeframe());
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipData, setTooltipData] = useState<{
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  } | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Theme colors based on isDarkMode
  const chartTheme = useMemo(() => {
    return {
      background: isDarkMode ? "#1a1a2e" : "white",
      textColor: isDarkMode ? "#D9D9D9" : "#191919",
      gridColor: isDarkMode ? "#2B2B43" : "#f0f0f0",
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
      tooltipBackground: isDarkMode ? "rgba(45, 45, 65, 0.9)" : "rgba(255, 255, 255, 0.9)",
      tooltipText: isDarkMode ? "#D9D9D9" : "#191919",
      tooltipBorder: isDarkMode ? "#3C3C50" : "#DCDCDC",
    };
  }, [isDarkMode]);

  // Format price with appropriate decimal places
  const formatPrice = useCallback((price: number): string => {
    if (price >= 1000) {
      return price.toFixed(2);
    } else if (price >= 100) {
      return price.toFixed(3);
    } else if (price >= 1) {
      return price.toFixed(4);
    } else {
      return price.toFixed(6);
    }
  }, []);

  // Format volume with K, M, B suffixes
  const formatVolume = useCallback((volume: number): string => {
    if (volume >= 1_000_000_000) {
      return `${(volume / 1_000_000_000).toFixed(2)}B`;
    } else if (volume >= 1_000_000) {
      return `${(volume / 1_000_000).toFixed(2)}M`;
    } else if (volume >= 1_000) {
      return `${(volume / 1_000).toFixed(2)}K`;
    } else {
      return volume.toString();
    }
  }, []);

  // Format date from timestamp
  const formatDate = useCallback((timestamp: string): string => {
    // Our timestamps are in milliseconds, so use directly
    const timeMs = parseInt(timestamp);
    const date = new Date(timeMs);

    return date.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  // Handle timeframe change
  const handleTimeframeChange = useCallback(
    (timeframe: Timeframe) => {
      setSelectedTimeframe(timeframe);
      if (onTimeframeChange) {
        onTimeframeChange(timeframe);
      }
    },
    [onTimeframeChange]
  );

  // Create and setup chart
  useEffect(() => {
    if (!chartContainerRef.current || isLoading || error || !data?.length) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chartHeight = height || chartContainerRef.current.clientHeight || 400;

    const chartOptions: DeepPartial<ChartOptions> = {
      layout: {
        background: { type: ColorType.Solid, color: chartTheme.background },
        textColor: chartTheme.textColor,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
      },
      grid: {
        vertLines: { visible: true, color: chartTheme.gridColor, style: LineStyle.Dotted },
        horzLines: { visible: true, color: chartTheme.gridColor, style: LineStyle.Dotted },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          color: isDarkMode ? "#555" : "#999",
          width: 1,
          style: LineStyle.Solid,
          labelBackgroundColor: isDarkMode ? "#2B2B43" : "#f0f0f0",
        },
        horzLine: {
          color: isDarkMode ? "#555" : "#999",
          width: 1,
          style: LineStyle.Solid,
          labelBackgroundColor: isDarkMode ? "#2B2B43" : "#f0f0f0",
        },
      },
      rightPriceScale: {
        borderColor: isDarkMode ? "#2B2B43" : "#D6DCDE",
        scaleMargins: {
          top: 0.1,
          bottom: 0.2,
        },
        mode: PriceScaleMode.Normal,
        visible: true,
        autoScale: true,
      },
      timeScale: {
        borderColor: isDarkMode ? "#2B2B43" : "#D6DCDE",
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: false,
        fixRightEdge: false,
        borderVisible: true,
        visible: true,
      },
      width: chartContainerRef.current.clientWidth,
      height: chartHeight,
      handleScroll: true,
      handleScale: true,
    };

    // Create chart instance
    const chart = createChart(chartContainerRef.current, chartOptions);
    chartRef.current = chart;

    // Create candlestick series using the correct API for lightweight-charts v5.0.5
    const candlestickSeries = chart.addSeries(CandlestickSeries, {
      upColor: chartTheme.upColor,
      downColor: chartTheme.downColor,
      borderVisible: true,
      borderUpColor: chartTheme.borderUpColor,
      borderDownColor: chartTheme.borderDownColor,
      wickUpColor: chartTheme.wickUpColor,
      wickDownColor: chartTheme.wickDownColor,
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
    });
    candlestickSeriesRef.current = candlestickSeries;

    // Create volume series using the correct API for lightweight-charts v5.0.5
    // Using type assertion to handle the scaleMargins property
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: chartTheme.upColor,
      priceFormat: {
        type: "volume",
      },
      priceScaleId: "", // Create a separate scale for volume
    } as any);

    // Apply scale margins separately to avoid TypeScript errors
    volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });
    volumeSeriesRef.current = volumeSeries;

    // Set data
    if (data.length > 0) {
      // Sort data by time in ascending order to avoid errors
      const sortedData = [...data].sort((a, b) => parseInt(a.time) - parseInt(b.time));

      // Make sure there are no duplicate timestamps
      // const uniqueData = sortedData.reduce((acc: CustomCandlestickData[], current) => {
      //   const exists = acc.find(item => parseInt(item.time) === parseInt(current.time));
      //   if (!exists) {
      //     acc.push(current);
      //   }
      //   return acc;
      // }, []);

      console.log("sortedData", sortedData);

      console.log(
        "data",
        sortedData.map((d) => {
          // Convert timestamp from milliseconds to seconds (TradingView format)
          // Example: 1743953220000 -> 1743953220
          const timestamp = Math.floor(parseInt(d.time) / 1000);

          return {
            time: timestamp as Time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          };
        })
      );

      // Set candlestick data
      candlestickSeriesRef.current.setData(
        sortedData.map((d) => {
          // Convert timestamp from milliseconds to seconds (TradingView format)
          // Example: 1743953220000 -> 1743953220
          const timestamp = Math.floor(parseInt(d.time) / 1000);

          return {
            time: timestamp as Time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          };
        })
      );

      // Set volume data
      volumeSeriesRef.current.setData(
        sortedData.map((d) => {
          // Convert timestamp from milliseconds to seconds (TradingView format)
          // Example: 1743953220000 -> 1743953220
          const timestamp = Math.floor(parseInt(d.time) / 1000);

          return {
            time: timestamp as Time,
            value: d.volume,
            color: d.close >= d.open ? chartTheme.upColor : chartTheme.downColor,
          };
        })
      );

      // Set visible range to show more candles (adjust based on data size)
      // const visibleRange = Math.min(Math.max(sortedData.length * 0.8, 10), sortedData.length);
      // if (sortedData.length > 1) {
      //   // Ensure we're showing at least 80% of available candles, but not less than 10
      //   chart.timeScale().setVisibleRange({
      //     from: (parseInt(sortedData[Math.max(0, sortedData.length - visibleRange)].time) / 1000) as Time,
      //     to: (parseInt(sortedData[sortedData.length - 1].time) / 1000) as Time,
      //   });
      // }
    }

    // Add crosshair move handler for tooltip
    const crosshairMoveHandler = (param: any) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartContainerRef.current!.clientWidth ||
        param.point.y < 0 ||
        param.point.y > height
      ) {
        setTooltipVisible(false);
        return;
      }

      // Convert the time from the parameter to milliseconds for comparison
      const timestamp = (param.time as number) * 1000;

      // Find the corresponding data point
      // param.time is in seconds, but our data timestamps are in milliseconds
      const dataPoint = data.find((d) => Math.floor(parseInt(d.time) / 1000) === param.time);

      if (dataPoint) {
        setTooltipData({
          time: dataPoint.time,
          open: dataPoint.open,
          high: dataPoint.high,
          low: dataPoint.low,
          close: dataPoint.close,
          volume: dataPoint.volume,
        });
        setTooltipPosition({
          x: param.point.x,
          y: param.point.y,
        });
        setTooltipVisible(true);
      } else {
        setTooltipVisible(false);
      }
    };

    chart.subscribeCrosshairMove(crosshairMoveHandler);

    // Fit content
    chart.timeScale().fitContent();

    // Handle resize
    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        const newHeight = height || chartContainerRef.current.clientHeight || 400;
        chartRef.current.applyOptions({
          width: chartContainerRef.current.clientWidth,
          height: newHeight,
        });
        chartRef.current.timeScale().fitContent();
      }
    };

    // Create a ResizeObserver to detect container size changes
    const resizeObserver = new ResizeObserver(handleResize);
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
    }

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserver.disconnect();
      chart.unsubscribeCrosshairMove(crosshairMoveHandler);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [data, isLoading, error, height, chartTheme, isDarkMode]);

  // Handle timeframe changes
  useEffect(() => {
    if (onTimeframeChange) {
      onTimeframeChange(selectedTimeframe);
    }
  }, [selectedTimeframe, onTimeframeChange]);

  // Update chart theme when isDarkMode changes
  useEffect(() => {
    if (!chartRef.current) return;

    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: chartTheme.background },
        textColor: chartTheme.textColor,
      },
      grid: {
        vertLines: { color: chartTheme.gridColor },
        horzLines: { color: chartTheme.gridColor },
      },
      rightPriceScale: {
        borderColor: isDarkMode ? "#2B2B43" : "#D6DCDE",
      },
      timeScale: {
        borderColor: isDarkMode ? "#2B2B43" : "#D6DCDE",
      },
    });

    // Update candlestick colors
    if (candlestickSeriesRef.current) {
      candlestickSeriesRef.current.applyOptions({
        upColor: chartTheme.upColor,
        downColor: chartTheme.downColor,
        borderUpColor: chartTheme.borderUpColor,
        borderDownColor: chartTheme.borderDownColor,
        wickUpColor: chartTheme.wickUpColor,
        wickDownColor: chartTheme.wickDownColor,
      });
    }

    // Update volume colors
    if (volumeSeriesRef.current && data.length > 0) {
      volumeSeriesRef.current.applyOptions({
        color: (bar: any) => (bar.value >= 0 ? chartTheme.upColor : chartTheme.downColor),
      });
    }
  }, [isDarkMode, chartTheme, data]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="w-full" style={{ height: `${height}px` }}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  // Render no data state
  if (!data || data.length === 0) {
    return (
      <div className="w-full" style={{ height: `${height}px` }}>
        <div className="flex items-center justify-center h-full">
          <div className="text-gray-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 mb-2 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-center">No data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full h-full relative flex flex-col ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
      <div className="flex justify-between items-center mb-2">
        <div className={`text-lg font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          {symbol} Price Chart ({currency})
        </div>
        <div className="flex space-x-1">
          {["1h", "4h", "1d", "1w", "1m"].map((timeframe) => (
            <button
              key={timeframe}
              className={`px-2 py-1 text-xs rounded ${
                selectedTimeframe === timeframe
                  ? isDarkMode
                    ? "bg-gray-700 text-white"
                    : "bg-gray-200 text-gray-800"
                  : isDarkMode
                  ? "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
              onClick={() => handleTimeframeChange(timeframe as Timeframe)}
            >
              {timeframe}
            </button>
          ))}
        </div>
      </div>

      <div className="relative flex-1 min-h-0">
        <div
          ref={chartContainerRef}
          className="w-full h-full"
          style={height ? { height: `${height}px` } : { height: "100%" }}
        />

        {/* Custom tooltip */}
        {tooltipVisible && tooltipData && (
          <div
            className={`absolute z-10 p-2 rounded shadow-lg pointer-events-none ${
              isDarkMode ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"
            }`}
            style={{
              left: `${tooltipPosition.x + 10}px`,
              top: `${tooltipPosition.y + 10}px`,
              border: `1px solid ${isDarkMode ? "#3C3C50" : "#DCDCDC"}`,
              maxWidth: "200px",
              fontSize: "12px",
            }}
          >
            <div className="font-bold mb-1">{formatDate(tooltipData.time)}</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div>Open:</div>
              <div className="text-right">{formatPrice(tooltipData.open)}</div>
              <div>High:</div>
              <div className="text-right">{formatPrice(tooltipData.high)}</div>
              <div>Low:</div>
              <div className="text-right">{formatPrice(tooltipData.low)}</div>
              <div>Close:</div>
              <div className="text-right">{formatPrice(tooltipData.close)}</div>
              <div>Volume:</div>
              <div className="text-right">{formatVolume(tooltipData.volume)}</div>
            </div>
          </div>
        )}
      </div>

      {/* Legend/Stats */}
      {data.length > 0 && (
        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div className={`p-2 rounded ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
            <div className={`text-xs opacity-70 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Open</div>
            <div className={isDarkMode ? "text-white" : "text-gray-900"}>{formatPrice(data[data.length - 1].open)}</div>
          </div>
          <div className={`p-2 rounded ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
            <div className={`text-xs opacity-70 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>High</div>
            <div className={isDarkMode ? "text-white" : "text-gray-900"}>{formatPrice(data[data.length - 1].high)}</div>
          </div>
          <div className={`p-2 rounded ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
            <div className={`text-xs opacity-70 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Low</div>
            <div className={isDarkMode ? "text-white" : "text-gray-900"}>{formatPrice(data[data.length - 1].low)}</div>
          </div>
          <div className={`p-2 rounded ${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
            <div className={`text-xs opacity-70 ${isDarkMode ? "text-gray-400" : "text-gray-600"}`}>Volume</div>
            <div className={isDarkMode ? "text-white" : "text-gray-900"}>
              {formatVolume(data[data.length - 1].volume)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandlestickChart;
