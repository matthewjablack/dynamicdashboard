import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import { Chart } from "react-chartjs-2";
import "chartjs-adapter-date-fns";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, TimeScale);

interface CandlestickData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickChartProps {
  data: CandlestickData[];
  symbol: string;
  currency: string;
}

const CandlestickChart: React.FC<CandlestickChartProps> = ({ data, symbol, currency }) => {
  const chartData = {
    labels: data.map((d) => new Date(d.timestamp)),
    datasets: [
      {
        type: "candlestick" as const,
        label: `${symbol} Price`,
        data: data.map((d) => ({
          x: new Date(d.timestamp),
          o: d.open,
          h: d.high,
          l: d.low,
          c: d.close,
        })),
        borderColor: "rgb(75, 192, 192)",
        borderWidth: 2,
      },
      {
        type: "bar" as const,
        label: "Volume",
        data: data.map((d) => d.volume),
        yAxisID: "y1",
        backgroundColor: "rgba(75, 192, 192, 0.2)",
      },
    ],
  };

  const options = {
    responsive: true,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    scales: {
      x: {
        type: "time" as const,
        time: {
          unit: "day" as const,
        },
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: `Price (${currency})`,
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: "Volume",
        },
      },
    },
    plugins: {
      title: {
        display: true,
        text: `${symbol} Price Chart`,
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            let label = context.dataset.label || "";
            if (label) {
              label += ": ";
            }
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: currency,
              }).format(context.parsed.y);
            }
            return label;
          },
        },
      },
    },
  };

  return <Chart type="candlestick" data={chartData} options={options} />;
};

export default CandlestickChart;
