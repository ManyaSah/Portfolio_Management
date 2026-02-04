"use client";

import { useState, useEffect } from "react";
import { getAllAlerts, getActiveAlerts } from "../../lib/api";
import Link from "next/link";

export default function AlertsPage() {
  const [allAlerts, setAllAlerts] = useState([]);
  const [activeOnly, setActiveOnly] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAlerts();
  }, [activeOnly]);

  const loadAlerts = async () => {
    try {
      const data = activeOnly ? await getActiveAlerts() : await getAllAlerts();
      setAllAlerts(data);
    } catch (err) {
      console.error("Failed to load alerts", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Price Alerts</h1>
          <Link href="/" className="text-blue-500 hover:text-blue-700">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm">Show only active alerts</span>
          </label>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : allAlerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center text-slate-500">
            No alerts found. Set alerts from your portfolio holdings.
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4 text-left">Ticker</th>
                  <th className="px-6 py-4 text-left">Target Price</th>
                  <th className="px-6 py-4 text-left">Action</th>
                  <th className="px-6 py-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-bold">{alert.ticker}</td>
                    <td className="px-6 py-4">${alert.targetPrice}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          alert.action === "BUY"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {alert.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {alert.triggered ? (
                        <span className="text-yellow-600 font-semibold">🔔 Triggered</span>
                      ) : (
                        <span className="text-slate-500">Active</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}