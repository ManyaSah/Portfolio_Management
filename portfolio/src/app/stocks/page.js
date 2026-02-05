"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { addAsset, getPriceHistory, getStocks } from "../../lib/api";
import { useRouter } from "next/navigation";

export default function StocksPage() {
  const router = useRouter();
  const [stocks, setStocks] = useState([]);
  const [stocksLoading, setStocksLoading] = useState(true);
  const [stocksError, setStocksError] = useState("");

  const [chartStock, setChartStock] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState("");
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [buyPrice, setBuyPrice] = useState(0);
  const [buyDate, setBuyDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!chartStock || !chartRef.current || typeof window === "undefined") return;
    if (!window.Chart) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const labels = (chartData || []).map((p) => p.priceDate);
    const values = (chartData || []).map((p) => Number(p.closePrice || 0));

    // Build buy markers aligned with chart labels (null where no buy on that date)
    const buyMarkers = (labels || []).map(() => null);
    if (chartStock && Array.isArray(chartStock.lots)) {
      chartStock.lots.forEach((lot) => {
        if (!lot.buyDate) return;
        const idx = labels.indexOf(lot.buyDate);
        if (idx >= 0) {
          buyMarkers[idx] = Number(lot.buyPrice || 0);
        }
      });
    }

    const ctx = chartRef.current.getContext("2d");
    chartInstanceRef.current = new window.Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: `${chartStock.ticker} Price`,
            data: values,
            borderColor: "#10b981",
            backgroundColor: "rgba(16, 185, 129, 0.1)",
            tension: 0.3,
            fill: true,
          },
          // Buy markers dataset (renders as points without a connecting line)
          {
            label: 'Buys',
            data: buyMarkers,
            borderColor: 'transparent',
            backgroundColor: '#ef4444',
            pointRadius: 6,
            pointStyle: 'triangle',
            showLine: false,
            spanGaps: true,
            tension: 0,
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
        },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: "rgba(148, 163, 184, 0.2)" } },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [chartStock, chartData]);

  useEffect(() => {
    const loadStocks = async () => {
      setStocksLoading(true);
      setStocksError("");
      try {
        const data = await getStocks();
        setStocks(Array.isArray(data) ? data : []);
      } catch (err) {
        setStocksError("Failed to load stocks");
        setStocks([]);
      } finally {
        setStocksLoading(false);
      }
    };

    loadStocks();
  }, []);

  const addToPortfolio = async (stock, qty) => {
    try {
      setError("");
      await addAsset({
        ticker: stock.ticker,
        quantity: parseInt(qty),
        buyPrice: parseFloat(buyPrice) || 0,
        buyDate: buyDate,
      });
      router.push('/');
    } catch (err) {
      setError("Failed to add asset: " + err.message);
      console.error("Failed to add asset", err);
    }
  };

  const openAddModal = (stock) => {
    setSelectedStock(stock);
    setQuantity(1);
    setBuyPrice(0);
    setBuyDate(new Date().toISOString().split('T')[0]);
    setError("");
    setIsAddOpen(true);
  };

  const handleConfirmAdd = async () => {
    if (!selectedStock) return;
    const qty = Math.max(1, Number(quantity) || 1);
    await addToPortfolio(selectedStock, qty);
    setIsAddOpen(false);
  };

  const handleOpenChart = async (stock) => {
    setChartStock(stock);
    setChartLoading(true);
    setChartError("");
    setChartData([]);

    try {
      let data = await getPriceHistory(stock.ticker);

      if (!Array.isArray(data) || data.length === 0) {
        data = generateMonthlyPriceHistory(stock.ticker, 100);
      } else if (data.length < 24) {
        data = mergeWithGeneratedHistory(data, stock.ticker, 100);
      }

      setChartData(Array.isArray(data) ? data : []);
    } catch (err) {
      setChartData(generateMonthlyPriceHistory(stock.ticker, 100));
      setChartError("Using sample data");
    } finally {
      setChartLoading(false);
    }
  };

  const generateMonthlyPriceHistory = (ticker, currentPrice) => {
    const data = [];
    const now = new Date();
    let price = currentPrice * (0.7 + Math.random() * 0.6);

    for (let i = 23; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);

      const volatility = (Math.random() - 0.5) * 0.2;
      price = Math.max(price * (1 + volatility), currentPrice * 0.3);

      const formattedDate = date.toISOString().split('T')[0];
      data.push({
        priceDate: formattedDate,
        closePrice: parseFloat(price.toFixed(2)),
        ticker: ticker,
      });
    }

    return data;
  };

  const mergeWithGeneratedHistory = (existingData, ticker, currentPrice) => {
    const generated = generateMonthlyPriceHistory(ticker, currentPrice);
    const existingDates = new Set(existingData.map(d => d.priceDate));

    const merged = [...generated];
    existingData.forEach(item => {
      if (!existingDates.has(item.priceDate) || !merged.find(d => d.priceDate === item.priceDate)) {
        merged.push(item);
      }
    });

    return merged.sort((a, b) => new Date(a.priceDate) - new Date(b.priceDate));
  };

  const handleCloseChart = () => {
    setChartStock(null);
    setChartData([]);
    setChartError("");
  };
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      {/* <Script src="https://cdn.jsdelivr.net/npm/chart.js" strategy="beforeInteractive" /> */}
      <h1 className="text-2xl font-bold mb-4">Choose a Stock</h1>
      {stocksLoading ? (
        <div className="text-slate-400">Loading stocks...</div>
      ) : stocksError ? (
        <div className="text-red-400">{stocksError}</div>
      ) : stocks.length === 0 ? (
        <div className="text-slate-400">No stocks available.</div>
      ) : (
        <ul className="space-y-2">
          {stocks.map((stock) => (
            <li
              key={stock.ticker}
              className="bg-slate-900 border border-slate-800 rounded px-4 py-2 flex items-center justify-between"
            >
              <div>
                <span className="font-semibold text-slate-100">{stock.ticker}</span>
                <span className="text-slate-400 ml-2">{stock.companyName}</span>
              </div>
              <button
                className="text-emerald-300 hover:text-emerald-200 font-medium text-xs border border-emerald-900 bg-emerald-950 px-3 py-1 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  openAddModal(stock);
                }}
              >
                Add
              </button>
            </li>
          ))}
        </ul>
      )}

      <div
        className={`${isAddOpen ? "" : "hidden"} fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm`}
      >
        <div className="bg-slate-900 rounded-lg shadow-2xl w-96 overflow-hidden border border-slate-800">
          <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
            <h3 className="font-bold text-slate-100">Add to Portfolio</h3>
            <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-200">
              &times;
            </button>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-300">
              {selectedStock ? (
                <>
                  {selectedStock.ticker} <span className="text-slate-500">{selectedStock.companyName}</span>
                </>
              ) : (
                ""
              )}
            </p>
            {error && (
              <div className="bg-red-900/30 border border-red-800 text-red-200 text-sm p-2 rounded">
                {error}
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                step="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full border border-slate-700 bg-slate-950 text-slate-100 rounded px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Buy Price (USD)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                className="w-full border border-slate-700 bg-slate-950 text-slate-100 rounded px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Buy Date</label>
              <input
                type="date"
                value={buyDate}
                onChange={(e) => setBuyDate(e.target.value)}
                className="w-full border border-slate-700 bg-slate-950 text-slate-100 rounded px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded"
              onClick={handleConfirmAdd}
            >
              Add Stock
            </button>
          </div>
        </div>
      </div>

      {/*
      <div
        className={`${chartStock ? "" : "hidden"} fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm`}
      >
        <div className="bg-white rounded-lg shadow-2xl w-[720px] max-w-[95vw] overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">
              {chartStock ? `${chartStock.ticker} Price Chart` : "Price Chart"}
            </h3>
            <button
              onClick={handleCloseChart}
              className="text-slate-400 hover:text-slate-600"
            >
              &times;
            </button>
          </div>
          <div className="p-6">
            {chartLoading ? (
              <div className="h-64 flex items-center justify-center text-slate-400">Loading chart...</div>
            ) : chartError ? (
              <div className="h-64 flex items-center justify-center text-red-500">{chartError}</div>
            ) : chartData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-slate-400">No price history available.</div>
            ) : (
              <div className="h-64">
                <canvas ref={chartRef} className="w-full h-full"></canvas>
              </div>
            )}

            {chartStock?.lots?.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-bold text-slate-700 mb-2">Order History</h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs">
                      <tr>
                        <th className="px-4 py-2">Buy Date</th>
                        <th className="px-4 py-2">Qty</th>
                        <th className="px-4 py-2">Buy Price</th>
                        <th className="px-4 py-2">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {chartStock.lots
                        .filter((lot) => Number(lot.buyPrice || 0) > 0 && Number(lot.cost || 0) > 0)
                        .map((lot) => (
                          <tr key={lot.id || `${lot.ticker}-${lot.buyDate}-${lot.quantity}`}>
                            <td className="px-4 py-2">{lot.buyDate || "-"}</td>
                            <td className="px-4 py-2">{lot.quantity}</td>
                            <td className="px-4 py-2">{new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(Number(lot.buyPrice || 0))}</td>
                            <td className="px-4 py-2">{new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD",
                            }).format(Number(lot.cost || 0))}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      */}
    </div>
  );
}
