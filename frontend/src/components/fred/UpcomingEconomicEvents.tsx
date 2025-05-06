import React, { useEffect, useState } from "react";
import { getUpcomingFREDReleases, FREDRelease } from "@/lib/fred";
import { useTheme } from "@/contexts/ThemeContext";

interface UpcomingEconomicEventsProps {
  defaultFilterNames?: string[];
}

const UpcomingEconomicEvents: React.FC<UpcomingEconomicEventsProps> = ({ defaultFilterNames = [] }) => {
  const { theme } = useTheme();
  const [allReleases, setAllReleases] = useState<FREDRelease[]>([]);
  const [filteredReleases, setFilteredReleases] = useState<FREDRelease[]>([]);
  const [selectedNames, setSelectedNames] = useState<string[]>(defaultFilterNames);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all releases on mount
  useEffect(() => {
    setIsLoading(true);
    getUpcomingFREDReleases()
      .then((releases) => {
        setAllReleases(releases);
        setIsLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch economic releases");
        setIsLoading(false);
      });
  }, []);

  // Fetch filtered releases when selectedNames changes
  useEffect(() => {
    if (selectedNames.length === 0) {
      setFilteredReleases(allReleases);
      return;
    }
    setIsLoading(true);
    getUpcomingFREDReleases(selectedNames)
      .then((releases) => {
        setFilteredReleases(releases);
        setIsLoading(false);
      })
      .catch((err) => {
        setError("Failed to fetch filtered releases");
        setIsLoading(false);
      });
  }, [selectedNames, allReleases]);

  // Build unique release names for the dropdown
  const releaseNames = Array.from(new Set(allReleases.map((r) => r.name))).sort();

  return (
    <div className={`p-4 rounded-lg shadow ${theme === "dark" ? "bg-gray-800" : "bg-white"}`}>
      <h3 className={`text-lg font-semibold mb-4 ${theme === "dark" ? "text-white" : "text-gray-900"}`}>
        Upcoming Economic Events
      </h3>
      <div className="mb-4">
        <label className={`block text-sm font-medium ${theme === "dark" ? "text-gray-300" : "text-gray-700"}`}>
          Filter by Release
        </label>
        <select
          multiple
          value={selectedNames}
          onChange={(e) => {
            const options = Array.from(e.target.selectedOptions).map((o) => o.value);
            setSelectedNames(options);
          }}
          className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
            theme === "dark" ? "bg-gray-700 text-white border-gray-600" : "border-gray-300"
          }`}
          size={Math.min(8, releaseNames.length)}
        >
          {releaseNames.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <div className="text-xs mt-1 text-gray-500">Hold Ctrl (Cmd on Mac) to select multiple</div>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className={`text-red-500 text-center`}>{error}</div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {filteredReleases.length === 0 ? (
            <div className="text-center text-gray-400">No releases found.</div>
          ) : (
            filteredReleases.map((release) => (
              <div
                key={release.id}
                className={`p-3 rounded border ${
                  theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-base">
                    {release.link ? (
                      <a
                        href={release.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        {release.name}
                      </a>
                    ) : (
                      release.name
                    )}
                  </div>
                </div>
                {release.notes && <div className="text-xs mt-1 text-gray-400 whitespace-pre-line">{release.notes}</div>}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default UpcomingEconomicEvents;
