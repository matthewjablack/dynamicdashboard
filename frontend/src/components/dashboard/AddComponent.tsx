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

  // Fetch exchanges
  const {
    data: exchanges = [],
    isLoading: isLoadingExchanges,
    error: exchangesError,
  } = useQuery({
    queryKey: ["ccxt-exchanges"],
    queryFn: async () => {
      const response = await api.get<string[]>("/api/ccxt/exchanges");
      return response.data;
    },
    enabled: selectedType === "CCXTChart",
    retry: 1,
    staleTime: 300000, // Cache for 5 minutes
  });

  // Fetch markets
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
      componentRegistry[selectedType as keyof typeof componentRegistry].configFields.forEach((field) => {
        defaultConfig[field.name] = field.default;
      });
      setConfig(defaultConfig);
    }
  }, [selectedType]);

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setConfig(componentRegistry[type]?.defaultProps || {});
  };

  const handleConfigChange = (field: string, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    const componentConfig = {
      type: selectedType,
      props: config,
    };
    onAdd(componentConfig);
    setSelectedType("");
    setConfig({});
  };

  const renderField = (field: ComponentField) => {
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
            {exchanges.map((exchange) => (
              <option key={exchange} value={exchange}>
                {exchange}
              </option>
            ))}
          </select>
          {exchangesError && <p className="mt-1 text-sm text-red-500">Error loading exchanges. Please try again.</p>}
        </div>
      );
    }

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
