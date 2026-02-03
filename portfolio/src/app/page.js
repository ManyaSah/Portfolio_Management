"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchAssets } from "../lib/api";

export default function Home() {
  const [holdings, setHoldings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [isTaxOpen, setIsTaxOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isAlertPopupOpen, setIsAlertPopupOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchAssets();
        setHoldings(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Failed to load assets", e);
        setHoldings([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);

  const portfolioValue = useMemo(() => {
    return holdings.reduce((sum, h) => {
      const qty = Number(h.quantity || 0);
      const avg = Number(h.buyPrice || h.avgPrice || 0);
      return sum + qty * avg;
    }, 0);
  }, [holdings]);

  return (
    <div className="bg-slate-50 text-slate-800 font-sans h-screen flex overflow-hidden">
      <Script src="https://cdn.jsdelivr.net/npm/chart.js" strategy="beforeInteractive" />

      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-bold text-emerald-400">
            Charlie<span className="text-white"></span>
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <a
            href="#"
            className="flex items-center space-x-3 bg-slate-800 text-white px-4 py-3 rounded-lg transition hover:bg-slate-700"
          >
            <svg
              className="w-5 h-5 text-emerald-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
              ></path>
            </svg>
            <span>Dashboard</span>
          </a>

          <Link
            href="/stocks"
            className="flex items-center space-x-3 text-slate-400 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7h18M3 12h18M3 17h18" />
            </svg>
            <span>Stocks</span>
          </Link>
        </nav>

        <div className="p-6 border-t border-slate-800">
          <button
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded shadow transition font-semibold"
            onClick={() => setIsTransactionOpen(true)}
          >
            + Add Transaction
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden relative">
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-8 z-10">
          <h2 className="text-xl font-bold text-slate-700">Portfolio Overview</h2>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800">Charlie Kirk</p>
              <p className="text-xs text-slate-500">Investor</p>
            </div>
            <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold">
              CK
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 scroller">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <p className="text-slate-500 text-sm font-medium">Current Portfolio Value</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">
                {formatCurrency(portfolioValue)}
              </h3>
              <p className="text-emerald-500 text-sm mt-1 flex items-center">
                <span>▲ 12.5%</span> <span className="text-slate-400 ml-2">All time</span>
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <p className="text-slate-500 text-sm font-medium">Today&apos;s Gain/Loss</p>
              <h3 className="text-3xl font-bold text-emerald-500 mt-2">+$340.50</h3>
              <p className="text-slate-400 text-sm mt-1">Updates live</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
              <div className="absolute right-0 top-0 p-4 opacity-10">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
                </svg>
              </div>
              <p className="text-slate-500 text-sm font-medium">XIRR (Return)</p>
              <h3 className="text-3xl font-bold text-blue-600 mt-2">18.4%</h3>
              <p className="text-slate-400 text-sm mt-1">Annualized Return</p>
            </div>
            <div
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition"
              onClick={() => setIsTaxOpen(true)}
            >
              <p className="text-slate-500 text-sm font-medium">Est. Tax Liability</p>
              <h3 className="text-3xl font-bold text-orange-500 mt-2">$1,200</h3>
              <p className="text-blue-500 text-xs mt-1 font-bold underline">Click to Estimate Tax</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-700">Performance History</h3>
              <select className="bg-slate-50 border border-slate-300 rounded text-sm px-3 py-1">
                <option>1 Year</option>
              </select>
            </div>
            <div className="h-64 bg-slate-50 rounded flex items-center justify-center text-slate-400 border border-dashed border-slate-300">
              <canvas id="portfolioChart" className="w-full h-full"></canvas>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-lg text-slate-700">Current Holdings</h3>
            </div>
            {isLoading ? (
              <div className="p-6 text-slate-500">Loading...</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold">
                  <tr>
                    <th className="px-6 py-4">Ticker</th>
                    <th className="px-6 py-4">Qty</th>
                    <th className="px-6 py-4">Avg Price</th>
                    <th className="px-6 py-4">Current Value</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 text-sm divide-y divide-slate-100">
                  {holdings.map((asset) => (
                    <tr key={asset.id || asset.ticker} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-bold">
                        {asset.ticker}{" "}
                        <span className="font-normal text-slate-400 ml-1">
                          {asset.companyName || ""}
                        </span>
                      </td>
                      <td className="px-6 py-4">{asset.quantity}</td>
                      <td className="px-6 py-4">
                        {formatCurrency(Number(asset.buyPrice ?? asset.avgPrice ?? 0))}
                      </td>
                      <td className="px-6 py-4 font-semibold">
                        {formatCurrency(
                          Number(asset.quantity || 0) * Number(asset.buyPrice ?? asset.avgPrice ?? 0)
                        )}
                      </td>
                      <td className="px-6 py-4 space-x-2">
                        <button className="text-emerald-500 hover:text-emerald-700 font-medium text-xs border border-emerald-200 bg-emerald-50 px-2 py-1 rounded">
                          BUY
                        </button>
                        <button className="text-orange-500 hover:text-orange-700 font-medium text-xs border border-orange-200 bg-orange-50 px-2 py-1 rounded">
                          SELL
                        </button>
                        <button
                          className="text-blue-500 hover:text-blue-700 font-medium text-xs underline ml-2"
                          onClick={() => setIsAlertOpen(true)}
                        >
                          Set Alert
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="h-8"></div>
        </div>
      </main>

      <div
        id="modal-transaction"
        className={`${isTransactionOpen ? "" : "hidden"} fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm`}
      >
        <div className="bg-white rounded-lg shadow-2xl w-96 overflow-hidden transform transition-all scale-100">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Add Transaction</h3>
            <button
              onClick={() => setIsTransactionOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              &times;
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Stock Ticker</label>
              <input
                type="text"
                placeholder="e.g. MSFT"
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                <select className="w-full border border-slate-300 rounded px-3 py-2">
                  <option>Buy</option>
                  <option>Sell</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity</label>
                <input type="number" className="w-full border border-slate-300 rounded px-3 py-2" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price per share</label>
              <input type="number" step="0.01" className="w-full border border-slate-300 rounded px-3 py-2" />
            </div>
            <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded mt-2">
              Save Transaction
            </button>
          </div>
        </div>
      </div>

      <div
        id="modal-tax"
        className={`${isTaxOpen ? "" : "hidden"} fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm`}
      >
        <div className="bg-white rounded-lg shadow-2xl w-[450px] overflow-hidden">
          <div className="bg-orange-50 px-6 py-4 border-b border-orange-100 flex justify-between items-center">
            <h3 className="font-bold text-orange-800 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                ></path>
              </svg>
              Tax Estimator
            </h3>
            <button onClick={() => setIsTaxOpen(false)} className="text-orange-400 hover:text-orange-600">
              &times;
            </button>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-600 mb-4">Select a stock to simulate selling all units today.</p>
            <select className="w-full border border-slate-300 rounded px-3 py-2 mb-4">
              <option>Select Stock...</option>
              <option>AAPL (10 units)</option>
              <option>TSLA (5 units)</option>
            </select>

            <div className="bg-slate-50 border border-slate-200 rounded p-4 text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Profit:</span>
                <span className="font-bold text-emerald-600">+$2,400.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Holding Period:</span>
                <span className="font-bold">14 Months (Long Term)</span>
              </div>
              <div className="border-t border-slate-200 my-2 pt-2 flex justify-between text-base">
                <span className="font-bold text-slate-700">Tax Liability (10%):</span>
                <span className="font-bold text-red-500">$240.00</span>
              </div>
            </div>
          </div>
          <div className="bg-slate-50 px-6 py-3 text-right">
            <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded text-sm">
              Run Simulation
            </button>
          </div>
        </div>
      </div>

      <div
        id="modal-alert"
        className={`${isAlertOpen ? "" : "hidden"} fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm`}
      >
        <div className="bg-white rounded-lg shadow-2xl w-80 overflow-hidden">
          <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
            <h3 className="font-bold text-blue-800">Set Price Alert</h3>
            <button onClick={() => setIsAlertOpen(false)} className="text-blue-400 hover:text-blue-600">
              &times;
            </button>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600">
              Notify me when <b>AAPL</b> price reaches:
            </p>
            <div className="relative">
              <span className="absolute left-3 top-2 text-slate-400">$</span>
              <input
                type="number"
                className="w-full border border-slate-300 rounded pl-8 pr-3 py-2 focus:outline-none focus:border-blue-500"
                placeholder="150.00"
              />
            </div>
            <button className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 rounded">
              Set Alert
            </button>
          </div>
        </div>
      </div>

      <div
        id="alert-popup"
        className={`${isAlertPopupOpen ? "" : "hidden"} fixed bottom-5 right-5 bg-white border-l-4 border-blue-500 shadow-2xl rounded p-4 w-80 z-50 animate-bounce`}
      >
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-slate-900">Target Price Hit!</h3>
            <div className="mt-1 text-sm text-slate-500">AAPL has reached your target of $150.00.</div>
            <div className="mt-2">
              <button
                onClick={() => setIsAlertPopupOpen(false)}
                className="text-xs font-medium text-blue-600 hover:text-blue-500"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}