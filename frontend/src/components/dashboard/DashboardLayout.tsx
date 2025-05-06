"use client";

import React, { useState, useEffect } from "react";
import { Responsive, WidthProvider, Layout, ResponsiveProps } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import ChatInterface from "../chat/ChatInterface";
import { AddComponent } from "./AddComponent";
import { componentRegistry, ComponentConfig } from "@/lib/componentRegistry";
import { ThemeToggle } from "../ThemeToggle";
import { useTheme } from "@/contexts/ThemeContext";
import Navbar from "../navigation/Navbar";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

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

// Breakpoint configuration
const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const COLS = { lg: 12, md: 10, sm: 6, xs: 4, xxs: 1 };

// Minimum component sizes for different types
const MIN_SIZES = {
  default: { w: 4, h: 4, minW: 3, minH: 3 },
  chart: { w: 6, h: 6, minW: 4, minH: 4 },
  small: { w: 3, h: 3, minW: 2, minH: 2 },
  feed: { w: 6, h: 8, minW: 2, minH: 6 }, // For components like TwitterFeed that need more height
  perpetualSwaps: { w: 6, h: 3.5, minW: 4, minH: 2.5 }, // Adjusted size for PerpetualSwaps
};

// Function to get minimum size for a component type
const getMinSize = (componentType: string) => {
  if (componentType.includes("Chart")) return MIN_SIZES.chart;
  if (componentType === "TwitterFeed") return MIN_SIZES.feed;
  if (componentType === "PerpetualSwaps") return MIN_SIZES.perpetualSwaps;
  return MIN_SIZES.default;
};

// Function to get size for a breakpoint
const getSizeForBreakpoint = (componentType: string, breakpoint: string) => {
  const cols = COLS[breakpoint as keyof typeof COLS];
  const minSize = getMinSize(componentType);

  // On xxs screens, components take full width and maintain minimum height
  if (breakpoint === "xxs") {
    return {
      w: cols,
      h: Math.max(minSize.h, 4), // Ensure minimum height of 4 units
      minW: cols,
      minH: minSize.minH,
    };
  }

  // On xs screens, components take full width but can be taller
  if (breakpoint === "xs") {
    return {
      w: cols,
      h: Math.max(minSize.h, 5), // Slightly taller on xs screens
      minW: cols,
      minH: minSize.minH,
    };
  }

  // On small screens, components take half width if possible
  if (breakpoint === "sm") {
    return {
      w: Math.min(cols, Math.max(Math.floor(cols / 2), minSize.minW)),
      h: Math.max(minSize.h, 4),
      minW: Math.max(Math.floor(cols / 2), minSize.minW),
      minH: minSize.minH,
    };
  }

  // Default sizes for larger screens
  return {
    w: minSize.w,
    h: minSize.h,
    minW: minSize.minW,
    minH: minSize.minH,
  };
};

export const DashboardLayout: React.FC = () => {
  console.log("[DashboardLayout] Rendering");

  const { theme } = useTheme();
  const { user } = useAuth();
  const isDarkMode = theme === "dark";
  const [isResizing, setIsResizing] = useState(false);

  console.log("[DashboardLayout] Theme context:", { theme, isDarkMode });

  const [components, setComponents] = useState<DashboardComponent[]>([]);
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({
    lg: [],
    md: [],
    sm: [],
    xs: [],
    xxs: [],
  });
  const [currentBreakpoint, setCurrentBreakpoint] = useState("lg");
  const [dashboardId, setDashboardId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAddComponentOpen, setIsAddComponentOpen] = useState(false);
  const isInitialLayout = React.useRef(true);

  // Function to generate responsive layouts
  const generateResponsiveLayout = (layout: Layout[], breakpoint: string) => {
    const cols = COLS[breakpoint as keyof typeof COLS];

    return layout.map((l) => {
      const component = components.find((c) => c.id === l.i);
      const size = component
        ? getSizeForBreakpoint(component.type, breakpoint)
        : getSizeForBreakpoint("default", breakpoint);

      // For xxs and xs, always position at x: 0 to ensure full width
      const xPos = breakpoint === "xxs" || breakpoint === "xs" ? 0 : Math.min(l.x, Math.max(0, cols - size.w));

      return {
        ...l,
        w: size.w,
        h: size.h,
        x: xPos,
        minW: size.minW,
        minH: size.minH,
      };
    });
  };

  // Load dashboard from backend
  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const response = await api.get("/api/dashboard");
        const dashboards = response.data;
        if (dashboards && dashboards.length > 0) {
          const lastDashboard = dashboards[0];
          setDashboardId(lastDashboard.id);

          // Properly restore components with their props and layouts
          const restoredComponents = (lastDashboard.components || []).map((comp: any) => ({
            id: comp.id || `${comp.type}-${Date.now()}`,
            type: comp.type,
            props: comp.props || {},
            layout: comp.layout || {
              x: 0,
              y: 0,
              w: getMinSize(comp.type).w,
              h: getMinSize(comp.type).h,
              minW: getMinSize(comp.type).minW,
              minH: getMinSize(comp.type).minH,
            },
          }));

          setComponents(restoredComponents);

          if (lastDashboard.layouts && Object.keys(lastDashboard.layouts).length > 0) {
            // Ensure all breakpoints have layouts
            const baseLayout = lastDashboard.layouts.lg || [];
            const responsiveLayouts = {
              lg: baseLayout.map((item: Layout) => ({
                ...item,
                minW: getMinSize(restoredComponents.find((c: DashboardComponent) => c.id === item.i)?.type || "default")
                  .minW,
                minH: getMinSize(restoredComponents.find((c: DashboardComponent) => c.id === item.i)?.type || "default")
                  .minH,
              })),
              md: lastDashboard.layouts.md || generateResponsiveLayout(baseLayout, "md"),
              sm: lastDashboard.layouts.sm || generateResponsiveLayout(baseLayout, "sm"),
              xs: lastDashboard.layouts.xs || generateResponsiveLayout(baseLayout, "xs"),
              xxs: lastDashboard.layouts.xxs || generateResponsiveLayout(baseLayout, "xxs"),
            };
            setLayouts(responsiveLayouts);
            isInitialLayout.current = false;
          } else {
            // Generate initial layouts if none exist
            const initialLayouts = generateInitialLayout(restoredComponents);
            setLayouts(initialLayouts);
            isInitialLayout.current = false;
          }
        } else {
          // Create a new dashboard if none exists
          const newDashboard = await api.post("/api/dashboard", {
            name: "My Dashboard",
            components: [],
            layouts: {
              lg: [],
              md: [],
              sm: [],
              xs: [],
              xxs: [],
            },
          });
          setDashboardId(newDashboard.data.id);
        }
      } catch (error) {
        console.error("Error loading dashboard:", error);
      }
    };

    if (user) {
      loadDashboard();
    }
  }, [user]);

  // Helper function to generate initial layout
  const generateInitialLayout = (comps: DashboardComponent[]) => {
    const baseLayout = comps.map((component, index) => ({
      i: component.id,
      x: (index % 3) * 4,
      y: Math.floor(index / 3) * 4,
      w: component.layout?.w || getMinSize(component.type).w,
      h: component.layout?.h || getMinSize(component.type).h,
      minW: component.layout?.minW || getMinSize(component.type).minW,
      minH: component.layout?.minH || getMinSize(component.type).minH,
    }));

    return {
      lg: baseLayout,
      md: generateResponsiveLayout(baseLayout, "md"),
      sm: generateResponsiveLayout(baseLayout, "sm"),
      xs: generateResponsiveLayout(baseLayout, "xs"),
      xxs: generateResponsiveLayout(baseLayout, "xxs"),
    };
  };

  // Generate layout items from components
  useEffect(() => {
    if (isInitialLayout.current && components.length > 0) {
      const baseLayout: Layout[] = components.map((component, index) => {
        const defaultLayout = {
          x: (index % 3) * 4,
          y: Math.floor(index / 3) * 4,
          w: component.type.includes("Chart") ? 6 : 4,
          h: component.type.includes("Chart") ? 6 : 4,
          minW: 2,
          minH: 2,
        };

        const layout = component.layout || defaultLayout;

        return {
          i: component.id,
          x: layout.x,
          y: layout.y,
          w: layout.w,
          h: layout.h,
          minW: layout.minW || 2,
          minH: layout.minH || 2,
        };
      });

      // Generate responsive layouts for all breakpoints
      const newLayouts = {
        lg: baseLayout,
        md: generateResponsiveLayout(baseLayout, "md"),
        sm: generateResponsiveLayout(baseLayout, "sm"),
        xs: generateResponsiveLayout(baseLayout, "xs"),
        xxs: generateResponsiveLayout(baseLayout, "xxs"),
      };

      setLayouts(newLayouts);
      isInitialLayout.current = false;
    }
  }, [components]);

  const handleBreakpointChange = (newBreakpoint: string) => {
    setCurrentBreakpoint(newBreakpoint);
  };

  const handleLayoutChange = (currentLayout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    // Update the layouts state with the new layouts
    setLayouts(allLayouts);

    // Find the layout items for the current breakpoint
    const currentBreakpointLayout = currentLayout;

    // Update component layouts based on the current layout
    const updatedComponents = components.map((component) => {
      const layoutItem = currentBreakpointLayout.find((item) => item.i === component.id);
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

    // Update the components state
    setComponents(updatedComponents);

    // Save the updated state
    if (dashboardId) {
      const saveTimeout = setTimeout(() => {
        api
          .put(`/api/dashboard/${dashboardId}`, {
            name: "My Dashboard",
            components: updatedComponents.map((comp) => ({
              id: comp.id,
              type: comp.type,
              props: comp.props,
              layout: comp.layout,
            })),
            layouts: allLayouts,
          })
          .catch((error) => {
            console.error("Error saving dashboard:", error);
          });
      }, 500); // Debounce save operations

      return () => clearTimeout(saveTimeout);
    }
  };

  const handleAddComponent = (component: ComponentConfig) => {
    const size = getSizeForBreakpoint(component.type, currentBreakpoint);
    const newComponent = {
      ...component,
      id: `${component.type}-${Date.now()}`,
      layout: {
        x: 0,
        y: 0,
        ...size,
      },
    };
    setComponents((prev) => [...prev, newComponent]);

    // Add the new component to all breakpoint layouts
    const newLayouts = { ...layouts };
    Object.keys(newLayouts).forEach((breakpoint) => {
      const layout = newLayouts[breakpoint];
      const breakpointSize = getSizeForBreakpoint(component.type, breakpoint);

      const newLayoutItem = {
        i: newComponent.id,
        x: 0,
        y: 0,
        ...breakpointSize,
      };
      newLayouts[breakpoint] = [...layout, newLayoutItem];
    });
    setLayouts(newLayouts);

    // Save the updated dashboard
    if (dashboardId) {
      api
        .put(`/api/dashboard/${dashboardId}`, {
          name: "My Dashboard",
          components: [...components, newComponent],
          layouts: newLayouts,
        })
        .catch((error) => {
          console.error("Error saving dashboard:", error);
        });
    }
  };

  const handleRemoveComponent = (id: string) => {
    setComponents((prev) => prev.filter((comp) => comp.id !== id));

    // Remove the component from all breakpoint layouts
    const newLayouts = { ...layouts };
    Object.keys(newLayouts).forEach((breakpoint) => {
      newLayouts[breakpoint] = newLayouts[breakpoint].filter((item) => item.i !== id);
    });
    setLayouts(newLayouts);

    // Save the updated dashboard
    if (dashboardId) {
      const updatedComponents = components.filter((comp) => comp.id !== id);
      api
        .put(`/api/dashboard/${dashboardId}`, {
          name: "My Dashboard",
          components: updatedComponents,
          layouts: newLayouts,
        })
        .catch((error) => {
          console.error("Error saving dashboard:", error);
        });
    }
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

  // Function to handle resize start
  const handleResizeStart = () => {
    setIsResizing(true);
    document.body.style.overflow = "hidden";
  };

  // Function to handle resize stop
  const handleResizeStop = () => {
    setIsResizing(false);
    document.body.style.overflow = "";
  };

  // Function to handle drag start
  const handleDragStart = () => {
    document.body.style.overflow = "hidden";
  };

  // Function to handle drag stop
  const handleDragStop = () => {
    document.body.style.overflow = "";
  };

  return (
    <div className={`flex flex-col h-screen overflow-hidden ${isDarkMode ? "bg-gray-900" : "bg-gray-50"}`}>
      <Navbar />

      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden relative">
        <ThemeToggle />

        {/* Sidebar Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`fixed left-0 top-20 z-30 p-2 rounded-r-lg bg-blue-500 text-white hover:bg-blue-600 transition-transform duration-300 ${
            isSidebarOpen ? "translate-x-64" : "translate-x-0"
          }`}
        >
          {isSidebarOpen ? "←" : "→"}
        </button>

        {/* Sliding Sidebar */}
        <div
          className={`fixed left-0 top-16 h-full w-64 bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 transform z-20 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-full overflow-y-auto">
            <ChatInterface onAddComponent={handleAddComponent} />
          </div>
        </div>

        {/* Add Component Toggle Button */}
        <button
          onClick={() => setIsAddComponentOpen(!isAddComponentOpen)}
          className={`fixed right-4 top-20 z-30 px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600`}
        >
          {isAddComponentOpen ? "Close" : "Add Component"}
        </button>

        {/* Sliding Add Component Panel */}
        <div
          className={`fixed right-0 top-16 h-auto w-96 bg-white dark:bg-gray-800 shadow-lg transition-transform duration-300 transform z-20 ${
            isAddComponentOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="p-4">
            <AddComponent
              onAdd={(component) => {
                handleAddComponent(component);
                setIsAddComponentOpen(false);
              }}
            />
          </div>
        </div>

        {/* Main Dashboard Area */}
        <div
          className={`flex-1 p-4 overflow-y-auto transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-0"} ${
            isResizing ? "pointer-events-none" : ""
          }`}
        >
          {components.length > 0 ? (
            <div className="pb-32">
              <ResponsiveGridLayout
                className="layout"
                layouts={layouts}
                breakpoints={BREAKPOINTS}
                cols={COLS}
                rowHeight={50}
                margin={[20, 20]}
                containerPadding={[8, 32]}
                onLayoutChange={handleLayoutChange}
                onBreakpointChange={handleBreakpointChange}
                isDraggable={true}
                isResizable={true}
                compactType="vertical"
                verticalCompact={true}
                draggableHandle=".drag-handle"
                style={{ minHeight: "100%" }}
                resizeHandles={["se", "s", "e"]}
                preventCollision={false}
                autoSize={true}
                isBounded={true}
                useCSSTransforms={true}
                transformScale={1}
                onResizeStart={handleResizeStart}
                onResizeStop={handleResizeStop}
                onDragStart={handleDragStart}
                onDragStop={handleDragStop}
              >
                {components.map((component) => renderComponent(component))}
              </ResponsiveGridLayout>
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-gray-500 dark:text-gray-400">
                Add components to your dashboard using the Add Component button
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
