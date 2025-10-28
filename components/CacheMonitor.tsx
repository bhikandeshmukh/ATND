"use client";

import { useState, useEffect } from "react";

interface CacheStats {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  evictions: number;
  size: number;
  memoryUsage: number;
  hitRate: number;
  hitRatePercentage: string;
  memoryUsageMB: string;
  avgEntrySize: string;
}

interface TopEntry {
  key: string;
  accessCount: number;
  size: number;
  age: number;
  ttl: number;
}

export default function CacheMonitor() {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [topEntries, setTopEntries] = useState<TopEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/cache/stats");
      const data = await response.json();
      setStats(data.stats);
      setTopEntries(data.topEntries || []);
    } catch (error) {
      console.error("Error fetching cache stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const handleClear = async (action: string, value?: string) => {
    setClearing(true);
    try {
      const body: any = { action };
      if (action === "tag") body.tag = value;
      if (action === "pattern") body.pattern = value;

      const response = await fetch("/api/cache/clear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      alert(data.message || "Cache cleared successfully");
      fetchStats();
    } catch (error) {
      console.error("Error clearing cache:", error);
      alert("Failed to clear cache");
    } finally {
      setClearing(false);
    }
  };

  const formatAge = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h`;
  };

  const formatTTL = (ms: number) => {
    if (ms < 0) return "Expired";
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  if (loading && !stats) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <p className="text-gray-600">Loading cache stats...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            📊 Cache Monitor
          </h2>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Hit Rate</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.hitRatePercentage}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.hits} hits / {stats.misses} misses
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Cache Size</p>
              <p className="text-2xl font-bold text-blue-600">{stats.size}</p>
              <p className="text-xs text-gray-500 mt-1">entries</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Memory Usage</p>
              <p className="text-2xl font-bold text-purple-600">
                {stats.memoryUsageMB}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Avg: {stats.avgEntrySize}
              </p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Operations</p>
              <p className="text-2xl font-bold text-orange-600">
                {stats.sets + stats.deletes}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.evictions} evictions
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Top Accessed Entries */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🔥 Top Accessed Entries
        </h3>
        {topEntries.length === 0 ? (
          <p className="text-gray-500 text-sm">No cache entries yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Key
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Access Count
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Size
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Age
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    TTL
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topEntries.map((entry, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm text-gray-900 font-mono">
                      {entry.key}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {entry.accessCount}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {(entry.size / 1024).toFixed(2)} KB
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {formatAge(entry.age)}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-600">
                      {formatTTL(entry.ttl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cache Management */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          🧹 Cache Management
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => handleClear("expired")}
            disabled={clearing}
            className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 text-sm"
          >
            Clear Expired
          </button>
          <button
            onClick={() => handleClear("tag", "employees")}
            disabled={clearing}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
          >
            Clear Employees
          </button>
          <button
            onClick={() => handleClear("tag", "attendance")}
            disabled={clearing}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50 text-sm"
          >
            Clear Attendance
          </button>
          <button
            onClick={() => {
              if (confirm("Are you sure you want to clear ALL cache?")) {
                handleClear("all");
              }
            }}
            disabled={clearing}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 text-sm"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}
