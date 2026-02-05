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
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Price Alerts</h1>
        </div>

        <div className="bg-slate-900 rounded-lg shadow-sm border border-slate-800 p-4 mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
              className="rounded"
            />
            <span className="text-sm text-slate-200">Show only active alerts</span>
          </label>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading...</div>
        ) : allAlerts.length === 0 ? (
          <div className="bg-slate-900 rounded-lg shadow-sm border border-slate-800 p-8 text-center text-slate-400">
            No alerts found. Set alerts from your portfolio holdings.
          </div>
        ) : (
          <div className="bg-slate-900 rounded-lg shadow-sm border border-slate-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-950 text-slate-400 uppercase text-xs font-semibold">
                <tr>
                  <th className="px-6 py-4 text-left">Ticker</th>
                  <th className="px-6 py-4 text-left">Target Price</th>
                  <th className="px-6 py-4 text-left">Action</th>
                  <th className="px-6 py-4 text-left">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {allAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-800/60">
                    <td className="px-6 py-4 font-bold text-slate-100">{alert.ticker}</td>
                    <td className="px-6 py-4">${alert.targetPrice}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          alert.action === "BUY"
                            ? "bg-emerald-900 text-emerald-300"
                            : "bg-orange-900 text-orange-300"
                        }`}
                      >
                        {alert.action}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {alert.triggered ? (
                        <span className="text-yellow-300 font-semibold">🔔 Triggered</span>
                      ) : (
                        <span className="text-slate-400">Active</span>
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