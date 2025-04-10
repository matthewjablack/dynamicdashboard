import React, { useState } from "react";
import { componentRegistry, ComponentConfig } from "@/lib/componentRegistry";
import { useTheme } from "@/contexts/ThemeContext";

interface AddComponentProps {
  onAdd: (component: ComponentConfig) => void;
}

export const AddComponent: React.FC<AddComponentProps> = ({ onAdd }) => {
  const { theme } = useTheme();
  const [selectedType, setSelectedType] = useState<string>("");
  const [config, setConfig] = useState<Record<string, any>>({});

  const handleTypeChange = (type: string) => {
    setSelectedType(type);
    setConfig(componentRegistry[type].defaultProps || {});
  };

  const handleConfigChange = (field: string, value: any) => {
    setConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleAdd = () => {
    onAdd({
      type: selectedType,
      props: config,
    });
    setSelectedType("");
    setConfig({});
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
            {componentRegistry[selectedType].configFields.map((field) => (
              <div key={field.name}>
                <label className={`block text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
                  {field.label}
                </label>
                {field.options ? (
                  <select
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
                ) : field.type === "number" ? (
                  <input
                    type="number"
                    value={config[field.name] || field.default}
                    onChange={(e) => handleConfigChange(field.name, Number(e.target.value))}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      theme === "dark" ? "bg-gray-700 text-white border-gray-600" : "border-gray-300"
                    }`}
                  />
                ) : (
                  <input
                    type="text"
                    value={config[field.name] || field.default}
                    onChange={(e) => handleConfigChange(field.name, e.target.value)}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
                      theme === "dark" ? "bg-gray-700 text-white border-gray-600" : "border-gray-300"
                    }`}
                  />
                )}
              </div>
            ))}
            <button
              onClick={handleAdd}
              className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors duration-200"
            >
              Add Component
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
