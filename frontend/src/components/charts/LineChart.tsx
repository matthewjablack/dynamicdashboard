import React, { useEffect, useRef } from "react";
import { createChart, ColorType, Time, IChartApi, ISeriesApi, LineStyle, LineSeries } from "lightweight-charts";
import { useTheme } from "@/contexts/ThemeContext";

interface LineChartData {
  time: number;
  value: number;
}

interface LineChartProps {
  data: LineChartData[];
  symbol: string;
  currency: string;
  isLoading?: boolean;
  error?: string;
  height?: number;
  onTimeframeChange?: (timeframe: string) => void;
}

export const LineChart: React.FC<LineChartProps> = ({
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
  const seriesRef = useRef<ISeriesApi<"Line"> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current || isLoading || error || !data?.length) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chartHeight = height || chartContainerRef.current.clientHeight || 400;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: isDarkMode ? "#1a1a2e" : "white" },
        textColor: isDarkMode ? "#D9D9D9" : "#191919",
      },
      grid: {
        vertLines: { color: isDarkMode ? "#2B2B43" : "#f0f0f0" },
        horzLines: { color: isDarkMode ? "#2B2B43" : "#f0f0f0" },
      },
      width: chartContainerRef.current.clientWidth,
      height: chartHeight,
    });

    chartRef.current = chart;

    // Create a new line series
    const lineSeries = chart.addSeries(LineSeries, {
      color: isDarkMode ? "#26a69a" : "#2962FF",
      lineWidth: 2,
      lineStyle: LineStyle.Solid,
      priceFormat: {
        type: "price",
        precision: 2,
        minMove: 0.01,
      },
    });

    seriesRef.current = lineSeries;

    // Format the data
    const formattedData = data.map((item) => ({
      time: Math.floor(item.time / 1000) as Time,
      value: item.value,
    }));

    // Set the data
    lineSeries.setData(formattedData);

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
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      if (seriesRef.current) {
        seriesRef.current = null;
      }
    };
  }, [data, isLoading, error, height, isDarkMode]);

  if (isLoading) {
    return (
      <div className="w-full" style={{ height: `${height}px` }}>
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full" style={{ height: `${height}px` }}>
        <div className="flex items-center justify-center h-full text-gray-500">No data available</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <div
        ref={chartContainerRef}
        className="w-full h-full"
        style={height ? { height: `${height}px` } : { height: "100%" }}
      />
    </div>
  );
};
