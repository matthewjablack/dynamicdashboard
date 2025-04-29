import React, { useState, useEffect } from "react";
import { componentRegistry, ComponentConfig, ComponentField } from "@/lib/componentRegistry";
import { api } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";
import { useQuery } from "@tanstack/react-query";

interface Market {
  symbol: string;
  base: string;
  quote: string;
  active: boolean;
}

interface AddComponentProps {
  onAdd: (component: ComponentConfig) => void;
}

export const AddComponent: React.FC<AddComponentProps> = ({ onAdd }) => {
  const { theme } = useTheme();
  const [selectedType, setSelectedType] = useState<string>("");
  const [config, setConfig] = useState<Record<string, any>>({});
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Fetch all available exchanges
  const {
    data: allExchanges = [],
    isLoading: isLoadingExchanges,
    error: exchangesError,
  } = useQuery({
    queryKey: ["ccxt-exchanges"],
    queryFn: async () => {
      const response = await api.get<string[]>("/api/ccxt/exchanges");
      return response.data;
    },
    enabled: selectedType === "CCXTChart" || selectedType === "PerpetualSwaps",
    retry: 1,
    staleTime: 300000, // Cache for 5 minutes
  });

  // Fetch markets for CCXTChart
  const {
    data: markets = [],
    isLoading: isLoadingMarkets,
    error: marketsError,
  } = useQuery({
    queryKey: ["ccxt-markets", config.exchange],
    queryFn: async () => {
      const response = await api.get<Market[]>(`/api/ccxt/exchanges/${config.exchange}/markets`);
      return response.data;
    },
    enabled: selectedType === "CCXTChart" && !!config.exchange,
    retry: 1,
    staleTime: 60000, // Cache for 1 minute
  });

  useEffect(() => {
    // Reset config when component type changes
    if (selectedType && selectedType in componentRegistry) {
      const defaultConfig: Record<string, any> = {};
      const componentDef = componentRegistry[selectedType as keyof typeof componentRegistry];

      // Handle special case for PerpetualSwaps
      if (selectedType === "PerpetualSwaps") {
        componentDef.configFields.forEach((field) => {
          // Convert array defaults to comma-separated strings
          defaultConfig[field.name] = Array.isArray(componentDef.defaultProps[field.name])
            ? componentDef.defaultProps[field.name].join(",")
            : field.default;
        });
      } else {
        // Handle other components normally
        componentDef.configFields.forEach((field) => {
          defaultConfig[field.name] = field.default;
        });
      }

      setConfig(defaultConfig);
      setSearchTerm("");
    }
  }, [selectedType]);

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
  };

  const handleConfigChange = (field: string, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    let processedConfig = { ...config };

    // Special handling for PerpetualSwaps component
    if (selectedType === "PerpetualSwaps") {
      // No need to convert strings to arrays here since we're keeping everything as strings
      processedConfig = config;
    }

    const componentConfig = {
      type: selectedType,
      props: processedConfig,
    };
    onAdd(componentConfig);
    setSelectedType("");
    setConfig({});
  };

  const renderMultiSelect = (field: ComponentField, options: string[], selectedValues: string[]) => {
    const filteredOptions = options.filter(
      (option) => option.toLowerCase().includes(searchTerm.toLowerCase()) && !selectedValues.includes(option)
    );

    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedValues.map((value) => (
            <div
              key={value}
              className={`px-2 py-1 rounded-full text-sm flex items-center gap-1 ${
                theme === "dark" ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-800"
              }`}
            >
              <span>{value}</span>
              <button
                onClick={() => {
                  const newValues = selectedValues.filter((v) => v !== value);
                  handleConfigChange(field.name, newValues.join(","));
                }}
                className="ml-1 text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
          className={`w-full px-3 py-2 rounded-md ${
            theme === "dark"
              ? "bg-gray-700 text-white placeholder-gray-400"
              : "bg-white text-gray-900 placeholder-gray-500"
          } border ${
            theme === "dark" ? "border-gray-600" : "border-gray-300"
          } focus:outline-none focus:ring-2 focus:ring-blue-500`}
        />
        {searchTerm && (
          <div
            className={`mt-2 max-h-48 overflow-y-auto rounded-md border ${
              theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"
            }`}
          >
            {filteredOptions.map((option) => (
              <button
                key={option}
                onClick={() => {
                  const newValues = [...selectedValues, option];
                  handleConfigChange(field.name, newValues.join(","));
                  setSearchTerm("");
                }}
                className={`w-full text-left px-3 py-2 hover:bg-blue-500 hover:text-white ${
                  theme === "dark" ? "text-white" : "text-gray-900"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderField = (field: ComponentField) => {
    // Special handling for PerpetualSwaps exchanges
    if (field.name === "exchanges" && selectedType === "PerpetualSwaps") {
      const defaultValue = Array.isArray(field.default) ? field.default.join(",") : field.default;
      const selectedExchanges = (config[field.name] || defaultValue || "").split(",").filter(Boolean);
      return renderMultiSelect(field, allExchanges, selectedExchanges);
    }

    // Special handling for PerpetualSwaps symbols
    if (field.name === "symbols" && selectedType === "PerpetualSwaps") {
      const commonPairs = [
        "BTC/USDT:USDT",
        "ETH/USDT:USDT",
        "SOL/USDT:USDT",
        "BNB/USDT:USDT",
        "AVAX/USDT:USDT",
        "MATIC/USDT:USDT",
        "DOGE/USDT:USDT",
        "XRP/USDT:USDT",
        "ADA/USDT:USDT",
        "DOT/USDT:USDT",
      ];
      const defaultValue = Array.isArray(field.default) ? field.default.join(",") : field.default;
      const selectedSymbols = (config[field.name] || defaultValue || "").split(",").filter(Boolean);
      return renderMultiSelect(field, commonPairs, selectedSymbols);
    }

    // Special handling for CCXTChart exchange
    if (field.name === "exchange" && selectedType === "CCXTChart") {
      return (
        <div>
          <select
            key={field.name}
            value={config[field.name] || ""}
            onChange={(e) => handleConfigChange(field.name, e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              theme === "dark" ? "bg-gray-700 text-white border-gray-600" : "border-gray-300"
            }`}
            disabled={isLoadingExchanges}
          >
            <option value="">Select an exchange</option>
            {allExchanges.map((exchange) => (
              <option key={exchange} value={exchange}>
                {exchange}
              </option>
            ))}
          </select>
          {exchangesError && <p className="mt-1 text-sm text-red-500">Error loading exchanges. Please try again.</p>}
        </div>
      );
    }

    // Special handling for CCXTChart symbol
    if (field.name === "symbol" && selectedType === "CCXTChart") {
      return (
        <div>
          <select
            key={field.name}
            value={config[field.name] || ""}
            onChange={(e) => handleConfigChange(field.name, e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              theme === "dark" ? "bg-gray-700 text-white border-gray-600" : "border-gray-300"
            }`}
            disabled={isLoadingMarkets || !config.exchange}
          >
            <option value="">Select a trading pair</option>
            {markets.map((market) => (
              <option key={market.symbol} value={market.symbol}>
                {market.symbol} ({market.base}/{market.quote})
              </option>
            ))}
          </select>
          {marketsError && <p className="mt-1 text-sm text-red-500">Error loading markets. Please try again.</p>}
        </div>
      );
    }

    if (field.type === "select" && field.options) {
      return (
        <select
          key={field.name}
          value={config[field.name] || field.default}
          onChange={(e) => handleConfigChange(field.name, e.target.value)}
          className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
            theme === "dark" ? "bg-gray-700 text-white border-gray-600" : "border-gray-300"
          }`}
        >
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === "boolean") {
      return (
        <label className="inline-flex items-center mt-1">
          <input
            type="checkbox"
            checked={config[field.name] || field.default}
            onChange={(e) => handleConfigChange(field.name, e.target.checked)}
            className={`form-checkbox h-5 w-5 ${
              theme === "dark"
                ? "text-blue-500 bg-gray-700 border-gray-600"
                : "text-blue-600 bg-gray-100 border-gray-300"
            } rounded focus:ring-blue-500`}
          />
          <span className={`ml-2 ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>{field.label}</span>
        </label>
      );
    }

    return (
      <input
        key={field.name}
        type={field.type}
        value={config[field.name] || field.default}
        onChange={(e) => handleConfigChange(field.name, e.target.value)}
        className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
          theme === "dark" ? "bg-gray-700 text-white border-gray-600" : "border-gray-300"
        }`}
      />
    );
  };

  return (
    <div className={`p-4 rounded-lg shadow ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
      <h3 className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
        Add Component
      </h3>
      <div className="space-y-4">
        <div>
          <label className={`block text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
            Component Type
          </label>
          <select
            value={selectedType}
            onChange={(e) => handleTypeChange(e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
              theme === "dark" ? "bg-gray-700 text-white border-gray-600" : "border-gray-300"
            }`}
          >
            <option value="">Select a component</option>
            {Object.entries(componentRegistry).map(([type, def]) => (
              <option key={type} value={type}>
                {def.name}
              </option>
            ))}
          </select>
        </div>

        {selectedType && (
          <div className="space-y-4">
            {componentRegistry[selectedType as keyof typeof componentRegistry].configFields.map((field) => (
              <div key={field.name}>
                <label className={`block text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  {field.label}
                </label>
                {renderField(field)}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={handleAdd}
          disabled={!selectedType || isLoadingExchanges || isLoadingMarkets}
          className={`w-full py-2 px-4 rounded-md ${
            !selectedType || isLoadingExchanges || isLoadingMarkets
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          } text-white focus:outline-none focus:ring-2 focus:ring-blue-500`}
        >
          Add Component
        </button>
      </div>
    </div>
  );
};
