import React, { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { CandlestickChart } from "../charts/CandlestickChart";
import { LineChart } from "../charts/LineChart";
import { VolumeChart } from "../charts/VolumeChart";
import { SearchInput } from "../ui/SearchInput";
import { Select } from "../ui/Select";
import { Button } from "../ui/Button";
import { Switch } from "../ui/Switch";
import { Slider } from "../ui/Slider";
import { Card } from "../ui/Card";

interface Market {
  symbol: string;
  base: string;
  quote: string;
  active: boolean;
}

interface ChartConfig {
  type: "candlestick" | "line" | "volume";
  timeframe: string;
  indicators: string[];
  refreshInterval: number;
  showVolume: boolean;
  showGrid: boolean;
  showCrosshair: boolean;
  theme: "light" | "dark" | "system";
}

interface CCXTExplorerProps {
  initialExchange?: string;
  initialSymbol?: string;
  initialConfig?: Partial<ChartConfig>;
  onConfigChange?: (config: ChartConfig) => void;
  className?: string;
}

const defaultConfig: ChartConfig = {
  type: "candlestick",
  timeframe: "1m",
  indicators: [],
  refreshInterval: 60,
  showVolume: true,
  showGrid: true,
  showCrosshair: true,
  theme: "system",
};

export const CCXTExplorer: React.FC<CCXTExplorerProps> = ({
  initialExchange,
  initialSymbol,
  initialConfig = {},
  onConfigChange,
  className = "",
}) => {
  const { theme: systemTheme } = useTheme();
  const [selectedExchange, setSelectedExchange] = useState<string>(initialExchange || "");
  const [selectedSymbol, setSelectedSymbol] = useState<string>(initialSymbol || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [config, setConfig] = useState<ChartConfig>({ ...defaultConfig, ...initialConfig });
  const [savedConfigs, setSavedConfigs] = useState<Record<string, ChartConfig>>({});

  // Fetch available exchanges
  const { data: exchanges = [] } = useQuery({
    queryKey: ["ccxt-exchanges"],
    queryFn: async () => {
      const response = await api.get<string[]>("/api/ccxt/exchanges");
      return response.data;
    },
  });

  // Fetch markets for selected exchange
  const { data: markets = [] } = useQuery({
    queryKey: ["ccxt-markets", selectedExchange],
    queryFn: async () => {
      if (!selectedExchange) return [];
      const response = await api.get<Market[]>(`/api/ccxt/exchanges/${selectedExchange}/markets`);
      return response.data;
    },
    enabled: !!selectedExchange,
  });

  // Fetch OHLCV data
  const { data: ohlcvData, isLoading } = useQuery({
    queryKey: ["ccxt-ohlcv", selectedExchange, selectedSymbol, config.timeframe],
    queryFn: async () => {
      if (!selectedExchange || !selectedSymbol) return [];
      const response = await api.get(`/api/ccxt/exchanges/${selectedExchange}/ohlcv`, {
        params: {
          symbol: selectedSymbol,
          timeframe: config.timeframe,
        },
      });
      return response.data;
    },
    enabled: !!selectedExchange && !!selectedSymbol,
    refetchInterval: config.refreshInterval * 1000,
  });

  // Filter markets based on search query
  const filteredMarkets = markets.filter((market) => market.symbol.toLowerCase().includes(searchQuery.toLowerCase()));

  // Handle exchange selection
  const handleExchangeSelect = (exchange: string) => {
    setSelectedExchange(exchange);
    setSelectedSymbol(""); // Reset symbol when exchange changes
  };

  // Handle symbol selection
  const handleSymbolSelect = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  // Handle config changes
  const handleConfigChange = (key: keyof ChartConfig, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onConfigChange?.(newConfig);
  };

  // Save current configuration
  const handleSaveConfig = () => {
    const configName = `${selectedExchange}-${selectedSymbol}-${Date.now()}`;
    setSavedConfigs((prev) => ({ ...prev, [configName]: config }));
  };

  // Load saved configuration
  const handleLoadConfig = (configName: string) => {
    const savedConfig = savedConfigs[configName];
    if (savedConfig) {
      setConfig(savedConfig);
      onConfigChange?.(savedConfig);
    }
  };

  // Determine theme based on config and system theme
  const effectiveTheme = config.theme === "system" ? systemTheme : config.theme;

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Exchange and Market Selection */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Exchange</label>
            <Select
              value={selectedExchange}
              onChange={(e) => handleExchangeSelect(e.target.value)}
              options={exchanges.map((exchange) => ({ value: exchange, label: exchange }))}
              placeholder="Select an exchange"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Market</label>
            <SearchInput
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search markets..."
            />
            <div className="mt-2 max-h-40 overflow-y-auto">
              {filteredMarkets.map((market) => (
                <div
                  key={market.symbol}
                  className={`p-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    selectedSymbol === market.symbol ? "bg-blue-50 dark:bg-blue-900" : ""
                  }`}
                  onClick={() => handleSymbolSelect(market.symbol)}
                >
                  {market.symbol} ({market.base}/{market.quote})
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Chart Configuration */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Chart Type</label>
            <Select
              value={config.type}
              onChange={(e) => handleConfigChange("type", e.target.value)}
              options={[
                { value: "candlestick", label: "Candlestick" },
                { value: "line", label: "Line" },
                { value: "volume", label: "Volume" },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Timeframe</label>
            <Select
              value={config.timeframe}
              onChange={(e) => handleConfigChange("timeframe", e.target.value)}
              options={[
                { value: "1m", label: "1 Minute" },
                { value: "5m", label: "5 Minutes" },
                { value: "15m", label: "15 Minutes" },
                { value: "1h", label: "1 Hour" },
                { value: "4h", label: "4 Hours" },
                { value: "1d", label: "1 Day" },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Refresh Interval (seconds)</label>
            <Slider
              value={config.refreshInterval}
              onChange={(value) => handleConfigChange("refreshInterval", value)}
              min={10}
              max={300}
              step={10}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <Select
              value={config.theme}
              onChange={(e) => handleConfigChange("theme", e.target.value)}
              options={[
                { value: "system", label: "System" },
                { value: "light", label: "Light" },
                { value: "dark", label: "Dark" },
              ]}
            />
          </div>
        </div>
        <div className="mt-4 flex gap-4">
          <Switch
            label="Show Volume"
            checked={config.showVolume}
            onChange={(checked) => handleConfigChange("showVolume", checked)}
          />
          <Switch
            label="Show Grid"
            checked={config.showGrid}
            onChange={(checked) => handleConfigChange("showGrid", checked)}
          />
          <Switch
            label="Show Crosshair"
            checked={config.showCrosshair}
            onChange={(checked) => handleConfigChange("showCrosshair", checked)}
          />
        </div>
      </Card>

      {/* Chart Display */}
      <Card className="flex-1 min-h-0">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : !selectedExchange || !selectedSymbol ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select an exchange and market to view data
          </div>
        ) : (
          <div className="h-full">
            {config.type === "candlestick" && (
              <CandlestickChart
                data={ohlcvData}
                symbol={selectedSymbol}
                currency="USD"
                onTimeframeChange={(timeframe) => handleConfigChange("timeframe", timeframe)}
                isLoading={isLoading}
                height={undefined}
              />
            )}
            {config.type === "line" && (
              <LineChart
                data={ohlcvData}
                symbol={selectedSymbol}
                currency="USD"
                onTimeframeChange={(timeframe) => handleConfigChange("timeframe", timeframe)}
                isLoading={isLoading}
                height={undefined}
              />
            )}
            {config.type === "volume" && (
              <VolumeChart
                data={ohlcvData}
                symbol={selectedSymbol}
                currency="USD"
                onTimeframeChange={(timeframe) => handleConfigChange("timeframe", timeframe)}
                isLoading={isLoading}
                height={undefined}
              />
            )}
          </div>
        )}
      </Card>

      {/* Configuration Management */}
      <Card className="p-4">
        <div className="flex justify-between items-center">
          <Button onClick={handleSaveConfig}>Save Configuration</Button>
          <div className="flex gap-2">
            {Object.keys(savedConfigs).map((configName) => (
              <Button key={configName} variant="outline" onClick={() => handleLoadConfig(configName)}>
                Load {configName}
              </Button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
