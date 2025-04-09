import React, { useState } from "react";
import { componentRegistry, ComponentConfig } from "@/lib/componentRegistry";

interface AddComponentProps {
  onAdd: (component: ComponentConfig) => void;
}

export const AddComponent: React.FC<AddComponentProps> = ({ onAdd }) => {
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
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Add Component</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Component Type</label>
          <select
            value={selectedType}
            onChange={(e) => handleTypeChange(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700">{field.label}</label>
                {field.options ? (
                  <select
                    value={config[field.name] || field.default}
                    onChange={(e) => handleConfigChange(field.name, e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                ) : (
                  <input
                    type="text"
                    value={config[field.name] || field.default}
                    onChange={(e) => handleConfigChange(field.name, e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
            <button onClick={handleAdd} className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Add Component
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
