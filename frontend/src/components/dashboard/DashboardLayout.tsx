import React, { useState } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import ChatInterface from "../chat/ChatInterface";
import CandlestickChart from "../charts/CandlestickChart";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardComponent {
  id: string;
  type: string;
  config: any;
}

const DashboardLayout: React.FC = () => {
  const [components, setComponents] = useState<DashboardComponent[]>([]);
  const [layouts, setLayouts] = useState<any>({
    lg: [],
    md: [],
    sm: [],
    xs: [],
    xxs: [],
  });

  const handleAddComponent = (component: DashboardComponent) => {
    const newComponent = {
      ...component,
      id: `${component.type}-${Date.now()}`,
    };

    setComponents((prev) => [...prev, newComponent]);

    // Add to layouts
    const newLayout = {
      i: newComponent.id,
      x: 0,
      y: Infinity,
      w: 6,
      h: 4,
      minW: 2,
      minH: 2,
    };

    setLayouts((prev: any) => ({
      lg: [...prev.lg, newLayout],
      md: [...prev.md, newLayout],
      sm: [...prev.sm, newLayout],
      xs: [...prev.xs, newLayout],
      xxs: [...prev.xxs, newLayout],
    }));
  };

  const renderComponent = (component: DashboardComponent) => {
    switch (component.type) {
      case "candlestick_chart":
        return (
          <CandlestickChart
            data={component.config.data}
            symbol={component.config.symbol}
            currency={component.config.currency}
          />
        );
      // Add more component types here
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen">
      <div className="w-1/4 border-r">
        <ChatInterface onAddComponent={handleAddComponent} />
      </div>
      <div className="flex-1 p-4">
        <ResponsiveGridLayout
          className="layout"
          layouts={layouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
          cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
          rowHeight={100}
          onLayoutChange={(layout, layouts) => setLayouts(layouts)}
        >
          {components.map((component) => (
            <div key={component.id} className="bg-white rounded-lg shadow p-4">
              {renderComponent(component)}
            </div>
          ))}
        </ResponsiveGridLayout>
      </div>
    </div>
  );
};

export default DashboardLayout;
