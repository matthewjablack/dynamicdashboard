import React, { useState, useEffect } from "react";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { SearchInput } from "../ui/SearchInput";
import { format } from "date-fns";
import { api } from "../../lib/api";
import { useTheme } from "@/contexts/ThemeContext";

interface Domain {
  id: number;
  name: string;
  type: "owned" | "wishlist";
  registrar: string | null;
  creation_date: string | null;
  expiration_date: string | null;
  status: string | null;
}

const DomainTracker: React.FC = () => {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [domains, setDomains] = useState<Domain[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [domainType, setDomainType] = useState<"owned" | "wishlist">("owned");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterType, setFilterType] = useState<"all" | "owned" | "wishlist">("all");

  useEffect(() => {
    fetchDomains();
  }, [sortBy, sortOrder, filterType]);

  const fetchDomains = async () => {
    try {
      const response = await api.get(
        `/api/domains?sort_by=${sortBy}&sort_order=${sortOrder}${
          filterType !== "all" ? `&domain_type=${filterType}` : ""
        }`
      );
      setDomains(response.data);
    } catch (error) {
      console.error("Error fetching domains:", error);
    }
  };

  const addDomain = async () => {
    if (!newDomain) return;

    try {
      const response = await api.post("/api/domains", {
        name: newDomain,
        type: domainType,
      });

      if (response.status === 200) {
        setNewDomain("");
        fetchDomains();
      }
    } catch (error) {
      console.error("Error adding domain:", error);
    }
  };

  const deleteDomain = async (id: number) => {
    try {
      const response = await api.delete(`/api/domains/${id}`);

      if (response.status === 200) {
        fetchDomains();
      }
    } catch (error) {
      console.error("Error deleting domain:", error);
    }
  };

  const refreshDomain = async (id: number) => {
    try {
      const response = await api.post(`/api/domains/${id}/refresh`);

      if (response.status === 200) {
        fetchDomains();
      }
    } catch (error) {
      console.error("Error refreshing domain:", error);
    }
  };

  return (
    <Card
      className={`p-6 shadow ${
        isDarkMode ? "bg-gray-900 text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"
      }`}
    >
      <div className="flex items-center mb-6">
        <div className="drag-handle cursor-move text-gray-400 hover:text-gray-600 mr-2">⋮⋮</div>
        <h2 className="text-2xl font-bold">Domain Tracker</h2>
      </div>
      <div className="flex gap-4 mb-4">
        <SearchInput
          value={newDomain}
          onChange={(e) => setNewDomain(e.target.value)}
          placeholder="Enter domain name..."
          className={`flex-1 ${
            isDarkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-300"
          }`}
        />
        <select
          value={domainType}
          onChange={(e) => setDomainType(e.target.value as "owned" | "wishlist")}
          className={`w-40 rounded-md px-3 py-2 border ${
            isDarkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-300"
          }`}
        >
          <option value="owned">Owned</option>
          <option value="wishlist">Wishlist</option>
        </select>
        <Button onClick={addDomain}>Add Domain</Button>
      </div>
      <div className="flex gap-4 mb-4">
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as "all" | "owned" | "wishlist")}
          className={`w-40 rounded-md px-3 py-2 border ${
            isDarkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-300"
          }`}
        >
          <option value="all">All Domains</option>
          <option value="owned">Owned</option>
          <option value="wishlist">Wishlist</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className={`w-40 rounded-md px-3 py-2 border ${
            isDarkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-300"
          }`}
        >
          <option value="name">Sort by Name</option>
          <option value="expiration">Sort by Expiration</option>
          <option value="registration">Sort by Registration</option>
        </select>
        <Button onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}>
          {sortOrder === "asc" ? "↑" : "↓"}
        </Button>
      </div>
      <div className="overflow-x-auto">
        <table className={`min-w-full text-sm ${isDarkMode ? "text-white" : "text-gray-900"}`}>
          <thead>
            <tr className={`${isDarkMode ? "bg-gray-800" : "bg-gray-100"}`}>
              <th className="px-2 py-1 text-left font-semibold">Domain</th>
              <th className="px-2 py-1 text-left font-semibold">Type</th>
              <th className="px-2 py-1 text-left font-semibold">Created</th>
              <th className="px-2 py-1 text-left font-semibold">Expires</th>
              <th className="px-2 py-1 text-left font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {domains.map((domain) => (
              <tr
                key={domain.id}
                className={`${isDarkMode ? "bg-gray-900 hover:bg-gray-800" : "bg-white hover:bg-gray-50"}`}
                style={{ minHeight: 0, height: "32px" }}
              >
                <td className="px-2 py-1 whitespace-nowrap">{domain.name}</td>
                <td className="px-2 py-1 whitespace-nowrap capitalize">{domain.type}</td>
                <td className="px-2 py-1 whitespace-nowrap">
                  {domain.creation_date ? format(new Date(domain.creation_date), "MMM d, yyyy") : "-"}
                </td>
                <td className="px-2 py-1 whitespace-nowrap">
                  {domain.expiration_date ? format(new Date(domain.expiration_date), "MMM d, yyyy") : "-"}
                </td>
                <td className="px-2 py-1 whitespace-nowrap">
                  <Button onClick={() => refreshDomain(domain.id)} className="mr-1">
                    Refresh
                  </Button>
                  <Button variant="outline" onClick={() => deleteDomain(domain.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default DomainTracker;
