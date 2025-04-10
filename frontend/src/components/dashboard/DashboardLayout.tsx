"use client";

import React, { useState, useEffect } from "react";
import { Responsive, WidthProvider, Layout, ResponsiveProps } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import ChatInterface from "../chat/ChatInterface";
import CandlestickChart from "../charts/CandlestickChart";
import { AddComponent } from "./AddComponent";
import { componentRegistry, ComponentConfig } from "@/lib/componentRegistry";
import { ThemeToggle } from "../ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";

// Create a properly typed responsive grid layout
const ResponsiveGridLayout = WidthProvider(Responsive) as React.ComponentClass<ResponsiveProps>;

interface DashboardComponent extends ComponentConfig {
  id: string;
  layout?: {
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
  };
}

export const DashboardLayout: React.FC = () => {
  const { theme } = useTheme();
  const [components, setComponents] = useState<DashboardComponent[]>([]);
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({
    lg: [],
    md: [],
    sm: [],
    xs: [],
    xxs: [],
  });

  // Generate layout items from components
  useEffect(() => {
    const newLayouts: { [key: string]: Layout[] } = {
      lg: [],
      md: [],
      sm: [],
      xs: [],
      xxs: [],
    };

    components.forEach((component, index) => {
      // Default layout if none specified
      const defaultLayout = {
        x: (index % 3) * 4, // Position in a grid, 3 columns
        y: Math.floor(index / 3) * 4, // Stack vertically when a row is filled
        w: 4, // Default width of 4 grid units
        h: 4, // Default height of 4 grid units
        minW: 2, // Minimum width
        minH: 2, // Minimum height
      };

      const layout = component.layout || defaultLayout;

      // Add layout for each breakpoint
      Object.keys(newLayouts).forEach((breakpoint) => {
        newLayouts[breakpoint].push({
          i: component.id,
          x: layout.x,
          y: layout.y,
          w: layout.w,
          h: layout.h,
          minW: layout.minW || 2,
          minH: layout.minH || 2,
        });
      });
    });

    setLayouts(newLayouts);
  }, [components]);

  const handleAddComponent = (component: ComponentConfig) => {
    const newComponent = {
      ...component,
      id: `${component.type}-${Date.now()}`,
      // Set default layout based on component type
      layout: {
        x: 0,
        y: 0,
        w: component.type.includes("Chart") ? 6 : 4, // Charts are wider by default
        h: component.type.includes("Chart") ? 6 : 4, // Charts are taller by default
        minW: 2,
        minH: 2,
      },
    };
    setComponents((prev) => [...prev, newComponent]);
  };

  const handleRemoveComponent = (id: string) => {
    setComponents((prev) => prev.filter((comp) => comp.id !== id));
  };

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    // Update component layouts based on the changed layout
    setLayouts(allLayouts);

    // Update the components with their new layout positions
    setComponents((prevComponents) => {
      return prevComponents.map((component) => {
        const layoutItem = currentLayout.find((item) => item.i === component.id);
        if (layoutItem) {
          return {
            ...component,
            layout: {
              x: layoutItem.x,
              y: layoutItem.y,
              w: layoutItem.w,
              h: layoutItem.h,
              minW: layoutItem.minW,
              minH: layoutItem.minH,
            },
          };
        }
        return component;
      });
    });
  };

  const renderComponent = (component: DashboardComponent) => {
    const ComponentType = componentRegistry[component.type].component;
    return (
      <div key={component.id} className="relative h-full w-full overflow-hidden">
        <button
          onClick={() => handleRemoveComponent(component.id)}
          className="absolute top-2 right-2 z-10 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
        <div className="h-full w-full p-2 overflow-auto">
          <ComponentType {...component.props} />
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <ThemeToggle />
      <div className="w-1/4 border-r dark:border-gray-700">
        <ChatInterface onAddComponent={handleAddComponent} />
      </div>
      <div className="flex-1 p-4 overflow-hidden">
        <div className="mb-4">
          <AddComponent onAdd={handleAddComponent} />
        </div>
        <div className="flex-1 overflow-auto">
          {components.length > 0 ? (
            <ResponsiveGridLayout
              className="layout"
              layouts={layouts}
              breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
              cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
              rowHeight={100}
              margin={[16, 16]}
              onLayoutChange={handleLayoutChange}
              isDraggable={true}
              isResizable={true}
              compactType="vertical"
            >
              {components.map((component) => renderComponent(component))}
            </ResponsiveGridLayout>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">Add components to your dashboard using the form above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
