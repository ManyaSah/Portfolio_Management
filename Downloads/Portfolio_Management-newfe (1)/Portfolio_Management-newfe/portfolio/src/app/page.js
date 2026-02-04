"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getPortfolio, addTarget, getXirr, getPriceHistory } from "../lib/api";

export default function Home() {
  const [holdings, setHoldings] = useState([]);
  const [portfolioData, setPortfolioData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransactionOpen, setIsTransactionOpen] = useState(false);
  const [isTaxOpen, setIsTaxOpen] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isAlertPopupOpen, setIsAlertPopupOpen] = useState(false);

  // XIRR states
  const [xirrData, setXirrData] = useState({});
  const [portfolioXirr, setPortfolioXirr] = useState(null);
  const [xirrLoading, setXirrLoading] = useState(false);

  // Alert form states
  const [alertTicker, setAlertTicker] = useState("");
  const [alertPrice, setAlertPrice] = useState("");
  const [alertAction, setAlertAction] = useState("SELL");
  const [alertError, setAlertError] = useState("");
  const [alertLoading, setAlertLoading] = useState(false);

  // Per-stock growth chart
  const chartInstanceRef = useRef(null);
  const [chartTicker, setChartTicker] = useState(null);
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [isChartJsReady, setIsChartJsReady] = useState(false);

  // Load portfolio data
  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPortfolio();
        setPortfolioData(data);
        // Transform backend format to frontend format
        const assets = (data.assets || []).map(av => ({
          id: av.asset.id,
          ticker: av.asset.ticker,
          quantity: av.asset.quantity,
          buyPrice: av.asset.buyPrice,
          buyDate: av.asset.buyDate,
          currentPrice: av.latestPrice,
          marketValue: av.marketValue,
          cost: av.cost,
          gainLoss: av.gainLoss,
          capitalGainType: av.capitalGainType,
          holdingDays: av.holdingDays,
          taxRate: av.taxRate,
          taxAmount: av.taxAmount,
        }));
        setHoldings(assets);
      } catch (e) {
        console.error("Failed to load portfolio", e);
        setHoldings([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Load XIRR data for all holdings
  useEffect(() => {
    const loadXirrData = async () => {
      if (holdings.length === 0) return;

      setXirrLoading(true);
      const xirrMap = {};
      const xirrValues = [];

      for (const holding of holdings) {
        try {
          const data = await getXirr(holding.ticker);
          xirrMap[holding.ticker] = data.xirrPercent;
          if (data.xirrPercent !== null) {
            xirrValues.push(data.xirrPercent);
          }
        } catch (err) {
          console.error(`Failed to load XIRR for ${holding.ticker}`, err);
          xirrMap[holding.ticker] = null;
        }
      }

      setXirrData(xirrMap);

      // Calculate portfolio-wide XIRR (weighted average)
      if (xirrValues.length > 0) {
        const totalValue = holdings.reduce((sum, h) => sum + (h.marketValue || 0), 0);
        let weightedXirr = 0;

        for (const holding of holdings) {
          const xirrVal = xirrMap[holding.ticker];
          if (xirrVal !== null) {
            const weight = (holding.marketValue || 0) / totalValue;
            weightedXirr += xirrVal * weight;
          }
        }

        setPortfolioXirr(weightedXirr);
      }

      setXirrLoading(false);
    };

    loadXirrData();
  }, [chartTicker]);

  // Build growth chart for selected stock
  useEffect(() => {
    const buildChart = async () => {
      if (!chartTicker) return;
      if (!isChartJsReady) return;
      if (typeof window === "undefined" || !window.Chart) return;

      try {
        let history = [];
        try {
          history = await getPriceHistory(chartTicker);
        } catch (err) {
          console.error(`Failed to load history for ${chartTicker}`, err);
          return;
        }

        if (!history || history.length === 0) return;

        const sorted = [...history].filter(p => p && p.priceDate && p.closePrice != null)
          .sort((a, b) => a.priceDate.localeCompare(b.priceDate));

        // Remove duplicates by date, keeping the last one (latest in sort)
        const uniqueByDate = [];
        const seenDates = new Set();
        for (let i = sorted.length - 1; i >= 0; i--) {
          const p = sorted[i];
          if (!seenDates.has(p.priceDate)) {
            seenDates.add(p.priceDate);
            uniqueByDate.unshift(p); // add to front to maintain order
          }
        }

        const labels = uniqueByDate.map(p => p.priceDate);
        const values = uniqueByDate.map(p => Number(p.closePrice || 0));

        const canvas = document.getElementById("stockChartCanvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        if (chartInstanceRef.current) {
          chartInstanceRef.current.destroy();
        }

        chartInstanceRef.current = new window.Chart(ctx, {
          type: "line",
          data: {
            labels,
            datasets: [
              {
                label: `${chartTicker} Price`,
                data: values,
                borderColor: "rgba(16, 185, 129, 1)", // emerald-500
                backgroundColor: "rgba(16, 185, 129, 0.1)",
                borderWidth: 2,
                tension: 0.25,
                pointRadius: 0,
                fill: true,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: true,
              },
              tooltip: {
                callbacks: {
                  label(context) {
                    const value = context.parsed.y || 0;
                    return new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 2,
                    }).format(value);
                  },
                },
              },
            },
            scales: {
              x: {
                ticks: {
                  maxTicksLimit: 6,
                },
                grid: {
                  display: false,
                },
              },
              y: {
                beginAtZero: false,
                ticks: {
                  callback(value) {
                    return new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    }).format(value);
                  },
                },
                grid: {
                  color: "rgba(148, 163, 184, 0.15)", // slate-400/15
                },
              },
            },
          },
        });
      } catch (err) {
        console.error("Failed to build portfolio performance chart", err);
      }
    };

    buildChart();

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [chartTicker, isChartJsReady]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);

  const portfolioValue = useMemo(() => {
    return portfolioData?.totalValue || 0;
  }, [portfolioData]);

  const totalProfit = useMemo(() => {
    return portfolioData?.totalProfit || 0;
  }, [portfolioData]);

  const totalTax = useMemo(() => {
    return portfolioData?.totalTax || 0;
  }, [portfolioData]);

  const handleSetAlert = (ticker) => {
    setAlertTicker(ticker);
    setAlertPrice("");
    setAlertAction("SELL");
    setAlertError("");
    setIsAlertOpen(true);
  };

  const handleCreateAlert = async () => {
    if (!alertPrice || parseFloat(alertPrice) <= 0) {
      setAlertError("Please enter a valid target price");
      return;
    }

    setAlertLoading(true);
    setAlertError("");

    try {
      await addTarget({
        ticker: alertTicker,
        targetPrice: parseFloat(alertPrice),
        action: alertAction,
        triggered: false,
      });

      // Close modal and reload
      setIsAlertOpen(false);
      window.location.reload();
    } catch (err) {
      setAlertError("Failed to create alert: " + err.message);
    } finally {
      setAlertLoading(false);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-800 font-sans h-screen flex overflow-hidden">
      <Script
        src="https://cdn.jsdelivr.net/npm/chart.js"
        strategy="afterInteractive"
        onLoad={() => setIsChartJsReady(true)}
      />

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

          <Link
            href="/alerts"
            className="flex items-center space-x-3 text-slate-400 px-4 py-3 rounded-lg hover:bg-slate-800 hover:text-white transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span>Alerts</span>
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

        {portfolioData?.alerts?.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg shadow-sm m-8 mb-0">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <h4 className="font-bold text-yellow-800">Price Alerts Triggered!</h4>
            </div>
            <ul className="space-y-1">
              {portfolioData.alerts.map((alert, i) => (
                <li key={i} className="text-yellow-700 text-sm">🔔 {alert}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-8 scroller">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <p className="text-slate-500 text-sm font-medium">Current Portfolio Value</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-2">
                {formatCurrency(portfolioValue)}
              </h3>
              <p className={`text-sm mt-1 flex items-center ${totalProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                <span>{totalProfit >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(totalProfit))}</span>
                <span className="text-slate-400 ml-2">All time</span>
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <p className="text-slate-500 text-sm font-medium">Total Cost Basis</p>
              <h3 className="text-3xl font-bold text-slate-600 mt-2">
                {formatCurrency(portfolioData?.totalCost || 0)}
              </h3>
              <p className="text-slate-400 text-sm mt-1">Initial investment</p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
              <div className="absolute right-0 top-0 p-4 opacity-10">
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
                </svg>
              </div>
              <p className="text-slate-500 text-sm font-medium">Portfolio XIRR (Return)</p>
              <h3 className="text-3xl font-bold text-blue-600 mt-2">
                {xirrLoading ? (
                  <span className="text-sm text-slate-500">Loading...</span>
                ) : portfolioXirr !== null ? (
                  `${portfolioXirr.toFixed(2)}%`
                ) : (
                  "N/A"
                )}
              </h3>
              <p className="text-slate-400 text-sm mt-1">Weighted average return</p>
            </div>
            <div
              className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 cursor-pointer hover:shadow-md transition"
              onClick={() => setIsTaxOpen(true)}
            >
              <p className="text-slate-500 text-sm font-medium">Est. Tax Liability</p>
              <h3 className="text-3xl font-bold text-orange-500 mt-2">{formatCurrency(Number(totalTax || 0))}</h3>
              <p className="text-blue-500 text-xs mt-1 font-bold underline">Click to Estimate Tax</p>
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
                    <th className="px-6 py-4">Current Price</th>
                    <th className="px-6 py-4">Market Value</th>
                    <th className="px-6 py-4">Gain/Loss</th>
                    <th className="px-6 py-4">LTCG/STCG</th>
                    <th className="px-6 py-4">Est. Tax</th>
                    <th className="px-6 py-4">XIRR</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-slate-700 text-sm divide-y divide-slate-100">
                  {holdings.map((asset) => {
                    const gainLoss = (asset.marketValue || 0) - (asset.cost || 0);
                    const assetXirr = xirrData[asset.ticker];
                    return (
                      <tr
                        key={asset.id || asset.ticker}
                        className="hover:bg-slate-50 transition cursor-pointer"
                        onClick={() => {
                          setChartTicker(asset.ticker);
                          setIsChartOpen(true);
                        }}
                      >
                        <td className="px-6 py-4 font-bold">{asset.ticker}</td>
                        <td className="px-6 py-4">{asset.quantity}</td>
                        <td className="px-6 py-4">
                          {formatCurrency(Number(asset.buyPrice ?? 0))}
                        </td>
                        <td className="px-6 py-4">
                          {formatCurrency(Number(asset.currentPrice ?? 0))}
                        </td>
                        <td className="px-6 py-4 font-semibold">
                          {formatCurrency(Number(asset.marketValue || 0))}
                        </td>
                        <td className={`px-6 py-4 font-semibold ${gainLoss >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                          {gainLoss >= 0 ? '+' : ''}{formatCurrency(gainLoss)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold px-2 py-1 rounded ${asset.capitalGainType === 'LTCG' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-orange-50 text-orange-700 border border-orange-200'}`}>
                            {asset.capitalGainType || 'STCG'}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">
                            {asset.holdingDays ? `${asset.holdingDays}d` : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold text-slate-700">
                          {formatCurrency(Number(asset.taxAmount || 0))}
                          <div className="text-[10px] text-slate-400 mt-1">
                            Rate: {`${(Number(asset.taxRate || 0) * 100).toFixed(0)}%`}
                          </div>
                        </td>
                        <td className="px-6 py-4 font-semibold">
                          {xirrLoading ? (
                            <span className="text-xs text-slate-400">Loading...</span>
                          ) : assetXirr !== undefined ? (
                            assetXirr !== null ? (
                              <span className={assetXirr >= 0 ? 'text-blue-600' : 'text-red-600'}>
                                {assetXirr >= 0 ? '+' : ''}{assetXirr.toFixed(2)}%
                              </span>
                            ) : (
                              <span className="text-slate-400">N/A</span>
                            )
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 space-x-2">
                          <button
                            className="text-emerald-500 hover:text-emerald-700 font-medium text-xs border border-emerald-200 bg-emerald-50 px-2 py-1 rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: implement BUY flow
                            }}
                          >
                            BUY
                          </button>
                          <button
                            className="text-orange-500 hover:text-orange-700 font-medium text-xs border border-orange-200 bg-orange-50 px-2 py-1 rounded"
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: implement SELL flow
                            }}
                          >
                            SELL
                          </button>
                          <button
                            className="text-blue-500 hover:text-blue-700 font-medium text-xs underline ml-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSetAlert(asset.ticker);
                            }}
                          >
                            Set Alert
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="h-8"></div>
        </div>
      </main>

      {/* Stock Growth Chart Modal */}
      <div
        className={`${isChartOpen ? "" : "hidden"} fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm`}
      >
        <div className="bg-white rounded-lg shadow-2xl w-[32rem] max-w-full overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">
              {chartTicker ? `${chartTicker} Price History` : "Price History"}
            </h3>
            <button
              onClick={() => {
                setIsChartOpen(false);
                setChartTicker(null);
              }}
              className="text-slate-400 hover:text-slate-600"
            >
              &times;
            </button>
          </div>
          <div className="p-6">
            <div className="h-64 bg-slate-50 rounded border border-slate-200">
              <canvas id="stockChartCanvas" className="w-full h-full"></canvas>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Modal */}
      <div
        className={`${isAlertOpen ? "" : "hidden"} fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm`}
      >
        <div className="bg-white rounded-lg shadow-2xl w-96 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Set Price Alert</h3>
            <button
              onClick={() => setIsAlertOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              &times;
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Stock Ticker
              </label>
              <input
                type="text"
                value={alertTicker}
                disabled
                className="w-full border border-slate-300 rounded px-3 py-2 bg-slate-100 text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Target Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={alertPrice}
                onChange={(e) => setAlertPrice(e.target.value)}
                placeholder="180.00"
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Action
              </label>
              <select
                value={alertAction}
                onChange={(e) => setAlertAction(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:border-emerald-500"
              >
                <option value="SELL">SELL - Alert when price rises to target</option>
                <option value="BUY">BUY - Alert when price drops to target</option>
              </select>
            </div>

            {alertError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded">
                {alertError}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-700">
              <strong>How it works:</strong>
              <ul className="list-disc ml-4 mt-1">
                <li><strong>SELL:</strong> Triggers when price reaches or exceeds target</li>
                <li><strong>BUY:</strong> Triggers when price drops to or below target</li>
              </ul>
            </div>

            <button
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-400 text-white font-bold py-2 rounded transition"
              onClick={handleCreateAlert}
              disabled={alertLoading}
            >
              {alertLoading ? "Creating..." : "Create Alert"}
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
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
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Qty</label>
                <input
                  type="number"
                  placeholder="10"
                  className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Price</label>
              <input
                type="number"
                placeholder="150.00"
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
              <input
                type="date"
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded">
              + Add
            </button>
          </div>
        </div>
      </div>

      {/* Tax Modal */}
      <div
        id="modal-tax"
        className={`${isTaxOpen ? "" : "hidden"} fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm`}
      >
        <div className="bg-white rounded-lg shadow-2xl w-96 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Tax Estimation</h3>
            <button
              onClick={() => setIsTaxOpen(false)}
              className="text-slate-400 hover:text-slate-600"
            >
              &times;
            </button>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-slate-600 text-sm">
              Estimated capital gains tax based on each holding’s gain and holding period (LTCG vs STCG).
            </p>
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded">
              <p className="text-orange-800 font-bold text-2xl">{formatCurrency(Number(totalTax || 0))}</p>
              <p className="text-orange-600 text-sm mt-1">
                LTCG: {formatCurrency(Number(portfolioData?.totalLtcgTax || 0))} · STCG: {formatCurrency(Number(portfolioData?.totalStcgTax || 0))}
              </p>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 uppercase">
                Per stock
              </div>
              <div className="max-h-52 overflow-auto divide-y divide-slate-100">
                {holdings.length === 0 ? (
                  <div className="p-3 text-sm text-slate-500">No holdings.</div>
                ) : (
                  holdings.map((h) => (
                    <div key={h.id || h.ticker} className="p-3 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-700">{h.ticker}</div>
                        <div className="text-xs text-slate-400">
                          {h.capitalGainType || 'STCG'} · Gain: {formatCurrency(Number((h.marketValue || 0) - (h.cost || 0)))}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-800">{formatCurrency(Number(h.taxAmount || 0))}</div>
                        <div className="text-[10px] text-slate-400">
                          {(Number(h.taxRate || 0) * 100).toFixed(0)}%
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <p className="text-slate-500 text-xs">
              * This is a simplified estimate (unrealized gains). Consult a tax professional for accurate calculations.
            </p>
            <button
              onClick={() => setIsTaxOpen(false)}
              className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}