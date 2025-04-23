import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useTheme } from "@/contexts/ThemeContext";

interface EconomicEvent {
  event: string;
  date: string;
  country: string;
  actual: string | null;
  previous: string | null;
  estimate: string | null;
  impact: string;
  unit: string;
}

interface EconomicCalendarProps {
  showFOMCOnly?: boolean;
}

export const EconomicCalendar: React.FC<EconomicCalendarProps> = ({ showFOMCOnly = false }) => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [selectedCountry, setSelectedCountry] = useState<string>("");

  const {
    data: events = [],
    isLoading,
    error,
  } = useQuery<EconomicEvent[]>({
    queryKey: ["economic-calendar", showFOMCOnly],
    queryFn: async () => {
      const response = await api.get(`/api/economic/${showFOMCOnly ? "fomc" : "calendar"}`);
      return response.data;
    },
    refetchInterval: 300000, // Refetch every 5 minutes
  });

  // Get unique countries for filter
  const countries = [...new Set(events.map((event) => event.country))].sort();

  // Filter events by selected country
  const filteredEvents = selectedCountry ? events.filter((event) => event.country === selectedCountry) : events;

  const getImpactColor = (impact: string) => {
    switch (impact?.toLowerCase()) {
      case "high":
        return "text-red-500";
      case "medium":
        return "text-yellow-500";
      case "low":
        return "text-green-500";
      default:
        return isDarkMode ? "text-gray-400" : "text-gray-600";
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  };

  const getDaysUntil = (dateStr: string) => {
    const eventDate = new Date(dateStr);
    const now = new Date();
    const diffTime = eventDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    return `in ${diffDays} days`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center ${isDarkMode ? "text-red-400" : "text-red-600"}`}>
        Error loading economic calendar
      </div>
    );
  }

  return (
    <div
      className={`h-full overflow-hidden flex flex-col ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-white text-gray-900"
      }`}
    >
      <div className="p-4 border-b border-gray-700">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{showFOMCOnly ? "FOMC Meetings" : "Economic Calendar"}</h2>
          {!showFOMCOnly && (
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className={`px-3 py-1 rounded border ${
                isDarkMode ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-300 text-gray-900"
              }`}
            >
              <option value="">All Countries</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredEvents.length === 0 ? (
          <div className="text-center p-4">No upcoming events</div>
        ) : (
          <div className="divide-y divide-gray-700">
            {filteredEvents.map((event, index) => (
              <div
                key={`${event.event}-${event.date}-${index}`}
                className={`p-4 ${isDarkMode ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="font-semibold">{event.event}</div>
                  <div className={getImpactColor(event.impact)}>{event.impact}</div>
                </div>
                <div className="text-sm flex justify-between items-center">
                  <div className={isDarkMode ? "text-gray-300" : "text-gray-600"}>
                    {formatDate(event.date)}
                    <span className="ml-2 text-xs">({getDaysUntil(event.date)})</span>
                  </div>
                  <div className="text-right">
                    {event.actual !== null && (
                      <div>
                        Actual: <span className="font-mono">{event.actual}</span>
                        {event.unit && <span className="ml-1">{event.unit}</span>}
                      </div>
                    )}
                    {event.estimate !== null && (
                      <div>
                        Est: <span className="font-mono">{event.estimate}</span>
                        {event.unit && <span className="ml-1">{event.unit}</span>}
                      </div>
                    )}
                    {event.previous !== null && (
                      <div>
                        Prev: <span className="font-mono">{event.previous}</span>
                        {event.unit && <span className="ml-1">{event.unit}</span>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
