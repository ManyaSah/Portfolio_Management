"use client";

import Script from "next/script";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { getPortfolio, addTarget, getXirr, addAsset, sellAsset, getPriceHistory } from "../lib/api";

export default function Home() {
  const isDark = true;
  const [assetLots, setAssetLots] = useState([]);
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

  // Transaction form states
  const [transactionTicker, setTransactionTicker] = useState("");
  const [transactionType, setTransactionType] = useState("BUY");
  const [transactionQty, setTransactionQty] = useState("");
  const [transactionPrice, setTransactionPrice] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [transactionError, setTransactionError] = useState("");
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [ltcgInfo, setLtcgInfo] = useState(null);

  // Stock chart states
  const [chartStock, setChartStock] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [chartError, setChartError] = useState("");
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);

  // Triggered price target alerts
  const [triggeredAlerts, setTriggeredAlerts] = useState([]);

  const groupedHoldings = useMemo(() => {
    const byTicker = new Map();

    for (const lot of assetLots) {
      const key = lot.ticker;
      if (!byTicker.has(key)) {
        byTicker.set(key, {
          ticker: key,
          quantity: 0,
          totalCost: 0,
          marketValue: 0,
          currentPrice: lot.currentPrice ?? null,
          taxLiability: 0,
          taxType: "N/A",
          lots: [],
        });
      }

      const agg = byTicker.get(key);
      agg.quantity += Number(lot.quantity || 0);
      agg.totalCost += Number(lot.cost || 0);
      agg.marketValue += Number(lot.marketValue || 0);
      if (agg.currentPrice == null && lot.currentPrice != null) {
        agg.currentPrice = lot.currentPrice;
      }
      agg.taxLiability += Number(lot.taxLiability || 0);
      agg.lots.push(lot);

      const lotTaxType = lot.taxType || "N/A";
      if (agg.taxType === "N/A") {
        agg.taxType = lotTaxType;
      } else if (agg.taxType !== lotTaxType) {
        agg.taxType = "MIXED";
      }
    }

    return Array.from(byTicker.values()).map((agg) => {
      const avgPrice = agg.quantity > 0 ? agg.totalCost / agg.quantity : 0;
      return {
        ...agg,
        avgPrice,
        lots: agg.lots.sort((a, b) => (a.buyDate || "").localeCompare(b.buyDate || "")),
      };
    });
  }, [assetLots]);

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
           taxLiability: av.taxLiability || 0,
           taxType: av.taxType || 'N/A',
           holdingDays: av.holdingDays || 0,
           unrealizedGain: av.unrealizedGain || 0,
        }));
        setAssetLots(assets);
      } catch (e) {
        console.error("Failed to load portfolio", e);
        setAssetLots([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Load XIRR data for all holdings
  useEffect(() => {
    const loadXirrData = async () => {
      if (groupedHoldings.length === 0) return;

      setXirrLoading(true);
      const xirrMap = {};
      const xirrValues = [];

      for (const holding of groupedHoldings) {
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
        const totalValue = groupedHoldings.reduce((sum, h) => sum + (h.marketValue || 0), 0);
        let weightedXirr = 0;

        for (const holding of groupedHoldings) {
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
  }, [groupedHoldings]);

  // Check for triggered buy price targets
  useEffect(() => {
    if (!portfolioData || !portfolioData.priceTargets || groupedHoldings.length === 0) return;

    const triggered = [];
    const shownAlerts = JSON.parse(localStorage.getItem('shownAlerts') || '{}');

    for (const target of portfolioData.priceTargets) {
      // Only check BUY targets
      if (target.action !== 'BUY') continue;
      
      const holding = groupedHoldings.find(h => h.ticker === target.ticker);
      if (!holding) continue;

      const currentPrice = Number(holding.currentPrice) || 0;
      const targetPrice = Number(target.targetPrice) || 0;
      const alertKey = `${target.ticker}-BUY-${target.targetPrice}`;

      // BUY target triggered when price drops to or below target
      if (currentPrice <= targetPrice && !shownAlerts[alertKey]) {
        triggered.push({
          ticker: target.ticker,
          targetPrice: targetPrice,
          currentPrice: currentPrice,
          timestamp: new Date().toLocaleTimeString()
        });
        shownAlerts[alertKey] = true;
      }
    }

    if (triggered.length > 0) {
      localStorage.setItem('shownAlerts', JSON.stringify(shownAlerts));
      setTriggeredAlerts(triggered);
    }
  }, [portfolioData, groupedHoldings]);


  // Calculate LTCG info when selling
  useEffect(() => {
    if (transactionType === 'SELL' && transactionTicker) {
      const holding = groupedHoldings.find(h => h.ticker === transactionTicker);
      if (holding && holding.lots && holding.lots.length > 0) {
        // Check the oldest lot for LTCG status
        const oldestLot = holding.lots.reduce((oldest, lot) => {
          const oldestDate = oldest.buyDate ? new Date(oldest.buyDate) : new Date();
          const lotDate = lot.buyDate ? new Date(lot.buyDate) : new Date();
          return lotDate < oldestDate ? lot : oldest;
        });

        if (oldestLot.buyDate) {
          const buyDate = new Date(oldestLot.buyDate);
          const today = new Date();
          const ltcgDate = new Date(buyDate);
          ltcgDate.setFullYear(ltcgDate.getFullYear() + 2);
          
          const daysHeld = Math.floor((today - buyDate) / (1000 * 60 * 60 * 24));
          const daysToLtcg = Math.ceil((ltcgDate - today) / (1000 * 60 * 60 * 24));
          
          if (daysHeld < 730 && daysToLtcg > 0 && daysToLtcg <= 180) {
            setLtcgInfo({
              daysToLtcg,
              monthsToLtcg: Math.ceil(daysToLtcg / 30),
              isApproaching: true
            });
          } else {
            setLtcgInfo(null);
          }
        }
      }
    } else {
      setLtcgInfo(null);
    }
  }, [transactionType, transactionTicker, groupedHoldings]);

  // Render chart when selected stock changes
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

  const handleSetAlert = (ticker) => {
    setAlertTicker(ticker);
    setAlertPrice("");
    setAlertAction("SELL");
    setAlertError("");
    setIsAlertOpen(true);
  };

  const handleBuySell = (ticker, type) => {
    setTransactionTicker(ticker);
    setTransactionType(type);
    setTransactionQty("");
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setTransactionError("");
    
    // Get current price for the ticker from holdings
    const holding = groupedHoldings.find(h => h.ticker === ticker);
    const currentPrice = holding?.currentPrice || 0;
    setTransactionPrice(currentPrice.toString());
    
    setIsTransactionOpen(true);
  };

  const handleSubmitTransaction = async () => {
    if (!transactionQty || parseFloat(transactionQty) <= 0) {
      setTransactionError("Please enter valid quantity");
      return;
    }
    if (!transactionDate) {
      setTransactionError("Please select a date");
      return;
    }

    setTransactionLoading(true);
    setTransactionError("");

    try {
      if (transactionType === "SELL") {
        const qtyToSell = parseInt(transactionQty);
        const holding = groupedHoldings.find(h => h.ticker === transactionTicker);
        const ownedQty = holding ? Number(holding.quantity || 0) : 0;
        if (qtyToSell > ownedQty) {
          setTransactionError(`Cannot sell more than ${ownedQty} shares owned`);
          setTransactionLoading(false);
          return;
        }
        await sellAsset({
          ticker: transactionTicker,
          quantity: qtyToSell,
        });
      } else {
        await addAsset({
          ticker: transactionTicker,
          quantity: parseInt(transactionQty),
          buyPrice: parseFloat(transactionPrice) || 0,
          buyDate: transactionDate,
        });
      }

      setIsTransactionOpen(false);
      // Reload portfolio data
      const data = await getPortfolio();
      setPortfolioData(data);
      const assets = (data.assets || []).map(av => ({
        id: av.asset.id,
        ticker: av.asset.ticker,
        quantity: av.asset.quantity,
        buyPrice: av.asset.buyPrice,
        buyDate: av.asset.buyDate,
        currentPrice: av.latestPrice,
        marketValue: av.marketValue,
        cost: av.cost,
        taxLiability: av.taxLiability || 0,
        taxType: av.taxType || 'N/A',
        holdingDays: av.holdingDays || 0,
        unrealizedGain: av.unrealizedGain || 0,
      }));
      setAssetLots(assets);
    } catch (err) {
      setTransactionError("Failed to record transaction: " + err.message);
    } finally {
      setTransactionLoading(false);
    }
  };

  const handleOpenChart = async (asset) => {
    setChartStock(asset);
    setChartLoading(true);
    setChartError("");
    setChartData([]);

    try {
      let data = await getPriceHistory(asset.ticker);
      
      // If no data or minimal data, generate realistic monthly historical data for past 2 years
      if (!Array.isArray(data) || data.length === 0) {
        data = generateMonthlyPriceHistory(asset.ticker, asset.currentPrice || 100);
      } else if (data.length < 24) {
        // If we have some data but less than 2 years, fill in gaps with generated data
        data = mergeWithGeneratedHistory(data, asset.ticker, asset.currentPrice || 100);
      }
      
      setChartData(Array.isArray(data) ? data : []);
    } catch (err) {
      // On error, generate sample data so user can still see a chart
      setChartData(generateMonthlyPriceHistory(asset.ticker, asset.currentPrice || 100));
      setChartError("Using sample data");
    } finally {
      setChartLoading(false);
    }
  };

  // Generate realistic monthly price history for past 2 years
  const generateMonthlyPriceHistory = (ticker, currentPrice) => {
    const data = [];
    const now = new Date();
    let price = currentPrice * (0.7 + Math.random() * 0.6); // Start 30-80% of current price
    
    // Generate 24 months of data going backwards
    for (let i = 23; i >= 0; i--) {
      const date = new Date(now);
      date.setMonth(date.getMonth() - i);
      
      // Add realistic price movement (±5% to ±15% monthly volatility)
      const volatility = (Math.random() - 0.5) * 0.2;
      price = Math.max(price * (1 + volatility), currentPrice * 0.3); // Don't drop below 30% of current
      
      const formattedDate = date.toISOString().split('T')[0];
      data.push({
        priceDate: formattedDate,
        closePrice: parseFloat(price.toFixed(2)),
        ticker: ticker
      });
    }
    
    return data;
  };

  // Merge existing data with generated data
  const mergeWithGeneratedHistory = (existingData, ticker, currentPrice) => {
    const generated = generateMonthlyPriceHistory(ticker, currentPrice);
    const existingDates = new Set(existingData.map(d => d.priceDate));
    
    // Add generated data points that don't already exist
    const merged = [...generated];
    existingData.forEach(item => {
      if (!existingDates.has(item.priceDate) || !merged.find(d => d.priceDate === item.priceDate)) {
        merged.push(item);
      }
    });
    
    // Sort by date
    return merged.sort((a, b) => new Date(a.priceDate) - new Date(b.priceDate));
  };

  const handleCloseChart = () => {
    setChartStock(null);
    setChartData([]);
    setChartError("");
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
    <div
      className={`${
        isDark
          ? "bg-slate-950 text-slate-100"
          : "bg-slate-50 text-slate-800"
      } font-sans h-screen flex overflow-hidden`}
    >
      <Script src="https://cdn.jsdelivr.net/npm/chart.js" strategy="beforeInteractive" />

      {/* <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl">
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

        {/* <div className="p-6 border-t border-slate-800">
          <button
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded shadow transition font-semibold"
            onClick={() => setIsTransactionOpen(true)}
          >
            + Add Transaction
          </button>
        </div> */}
      {/* </aside> */}
      <main className="flex-1 flex flex-col overflow-hidden relative">

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
            <div className={`${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} p-6 rounded-xl shadow-sm border`}>
              <p className={`${isDark ? "text-slate-400" : "text-slate-500"} text-sm font-medium`}>
                Current Portfolio Value
              </p>
              <h3 className={`text-3xl font-bold ${isDark ? "text-slate-100" : "text-slate-800"} mt-2`}>
                {formatCurrency(portfolioValue)}
              </h3>
              <p className={`text-sm mt-1 flex items-center ${totalProfit >= 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-500') : (isDark ? 'text-red-400' : 'text-red-500')}`}>
                <span>{totalProfit >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(totalProfit))}</span>
                <span className={`${isDark ? "text-slate-500" : "text-slate-400"} ml-2`}>All time</span>
              </p>
            </div>
            <div className={`${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} p-6 rounded-xl shadow-sm border`}>
              <p className={`${isDark ? "text-slate-400" : "text-slate-500"} text-sm font-medium`}>
                Total Cost Basis
              </p>
              <h3 className={`text-3xl font-bold ${isDark ? "text-slate-100" : "text-slate-600"} mt-2`}>
                {formatCurrency(portfolioData?.totalCost || 0)}
              </h3>
              <p className={`${isDark ? "text-slate-500" : "text-slate-400"} text-sm mt-1`}>
                Initial investment
              </p>
            </div>
            <div className={`${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} p-6 rounded-xl shadow-sm border relative overflow-hidden`}>
              <div className={`absolute right-0 top-0 p-4 ${isDark ? "opacity-20" : "opacity-10"}`}>
                <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
                  <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
                </svg>
              </div>
              <p className={`${isDark ? "text-slate-400" : "text-slate-500"} text-sm font-medium`}>
                Portfolio XIRR (Return)
              </p>
              <h3 className={`text-3xl font-bold ${isDark ? "text-blue-400" : "text-blue-600"} mt-2`}>
                {xirrLoading ? (
                  <span className={`text-sm ${isDark ? "text-slate-400" : "text-slate-500"}`}>Loading...</span>
                ) : portfolioXirr !== null ? (
                  `${portfolioXirr.toFixed(2)}%`
                ) : (
                  "N/A"
                )}
              </h3>
              <p className={`${isDark ? "text-slate-500" : "text-slate-400"} text-sm mt-1`}>
                Weighted average return
              </p>
            </div>
            <div
              className={`${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} p-6 rounded-xl shadow-sm border cursor-pointer hover:shadow-md transition`}
              onClick={() => setIsTaxOpen(true)}
            >
              <p className={`${isDark ? "text-slate-400" : "text-slate-500"} text-sm font-medium`}>
                Est. Tax Liability
              </p>
               <h3 className={`text-3xl font-bold ${isDark ? "text-orange-400" : "text-orange-500"} mt-2`}>
                 {formatCurrency(portfolioData?.totalTaxLiability || 0)}
               </h3>
              <p className={`${isDark ? "text-blue-400" : "text-blue-500"} text-xs mt-1 font-bold underline`}>
                Click to Estimate Tax
              </p>
            </div>
          </div>

          <div className={`${isDark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200"} rounded-xl shadow-sm border p-6 mb-8`}>
            <div className="flex justify-between items-center mb-4">
              <h3 className={`font-bold text-lg ${isDark ? "text-slate-100" : "text-slate-700"}`}>Current Holdings</h3>
              <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Click a card to view price graph</p>
            </div>
            {isLoading ? (
              <div className="p-6 text-slate-500">Loading...</div>
            ) : groupedHoldings.length === 0 ? (
              <div className="p-6 text-slate-500">No holdings yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {groupedHoldings.map((asset) => {
                  const gainLoss = (asset.marketValue || 0) - (asset.totalCost || 0);
                  const assetXirr = xirrData[asset.ticker];
                  return (
                    <button
                      key={asset.ticker}
                      onClick={() => handleOpenChart(asset)}
                      className={`${isDark ? "bg-slate-950 border-slate-800 hover:border-slate-700" : "bg-slate-50 border-slate-200 hover:shadow-md"} text-left rounded-xl p-5 transition relative`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-xs ${isDark ? "text-slate-500" : "text-slate-400"}`}>Ticker</p>
                          <h4 className={`text-xl font-bold ${isDark ? "text-slate-100" : "text-slate-800"}`}>{asset.ticker}</h4>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded font-semibold ${
                          asset.taxType === 'LONG_TERM' ? (isDark ? 'bg-emerald-900 text-emerald-300' : 'bg-emerald-100 text-emerald-700') : 
                          asset.taxType === 'SHORT_TERM' ? (isDark ? 'bg-orange-900 text-orange-300' : 'bg-orange-100 text-orange-700') : 
                          (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500')
                        }`}>
                          {asset.taxType === 'LONG_TERM' ? 'Long-term' : 
                           asset.taxType === 'SHORT_TERM' ? 'Short-term' : 
                           'N/A'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                        <div>
                          <p className={`text-slate-500`}>Qty</p>
                          <p className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>{asset.quantity}</p>
                        </div>
                        <div>
                          <p className={`text-slate-500`}>Avg Price</p>
                          <p className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                            {formatCurrency(Number(asset.avgPrice ?? 0))}
                          </p>
                        </div>
                        <div>
                          <p className={`text-slate-500`}>Market Value</p>
                          <p className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                            {formatCurrency(Number(asset.marketValue || 0))}
                          </p>
                        </div>
                        <div>
                          <p className={`text-slate-500`}>Current Price</p>
                          <p className={`font-semibold ${gainLoss >= 0 ? (isDark ? 'text-emerald-400' : 'text-emerald-600') : (isDark ? 'text-red-400' : 'text-red-600')}`}>
                            {formatCurrency(Number(asset.currentPrice ?? 0))}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between text-xs">
                        <div>
                          <p className={`text-slate-500`}>XIRR</p>
                          <p className={`font-semibold ${isDark ? "text-slate-200" : "text-slate-700"}`}>
                            {xirrLoading ? (
                              "Loading..."
                            ) : assetXirr !== undefined ? (
                              assetXirr !== null ? (
                                `${assetXirr >= 0 ? '+' : ''}${assetXirr.toFixed(2)}%`
                              ) : (
                                "N/A"
                              )
                            ) : (
                              "-"
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={`text-slate-500`}>Tax Liability</p>
                          <p className={`font-semibold ${isDark ? "text-orange-300" : "text-orange-600"}`}>
                            {asset.taxLiability > 0 ? formatCurrency(Number(asset.taxLiability)) : '-'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center gap-2">
                        <span
                          className={`${
                            isDark
                              ? "text-white hover:text-slate-100 border-emerald-600 bg-emerald-600"
                              : "text-white hover:text-slate-100 border-emerald-500 bg-emerald-500"
                          } font-medium text-xs border px-2 py-1 rounded`}
                          onClick={(e) => { e.stopPropagation(); handleBuySell(asset.ticker, 'BUY'); }}
                        >
                          BUY
                        </span>
                        <span
                          className={`${
                            isDark
                              ? "text-white hover:text-slate-100 border-orange-600 bg-orange-600"
                              : "text-white hover:text-slate-100 border-orange-500 bg-orange-500"
                          } font-medium text-xs border px-2 py-1 rounded`}
                          onClick={(e) => { e.stopPropagation(); handleBuySell(asset.ticker, 'SELL'); }}
                        >
                          SELL
                        </span>
                        <span
                          className={`${isDark ? "text-blue-100 hover:text-white" : "text-blue-700 hover:text-blue-800"} font-medium text-xs underline cursor-pointer`}
                          onClick={(e) => { e.stopPropagation(); handleSetAlert(asset.ticker); }}
                        >
                          Set Alert
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="h-8"></div>
        </div>
      </main>

      {/* Stock Price Chart Modal */}
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
                      {chartStock.lots.map((lot) => {
                        const qty = Number(lot.quantity || 0);
                        const price = Number(lot.buyPrice || 0);
                        const totalCost = price > 0 ? qty * price : Number(lot.cost || 0);
                        return (
                          <tr key={lot.id || `${lot.ticker}-${lot.buyDate}-${lot.quantity}`} className="text-slate-700">
                            <td className="px-4 py-2 text-emerald-600">{lot.buyDate || "-"}</td>
                            <td className="px-4 py-2 text-slate-700">{qty}</td>
                            <td className="px-4 py-2 text-emerald-600">{formatCurrency(price)}</td>
                            <td className="px-4 py-2 font-semibold text-emerald-700">{formatCurrency(totalCost)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
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
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:border-emerald-500 text-slate-900"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Action
              </label>
              <select
                value={alertAction}
                onChange={(e) => setAlertAction(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:border-emerald-500 text-slate-900"
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
            <h3 className="font-bold text-slate-700">Record Transaction</h3>
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
                value={transactionTicker}
                disabled
                className="w-full border border-slate-300 rounded px-3 py-2 bg-slate-100 text-slate-600"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                <select 
                  value={transactionType}
                  onChange={(e) => setTransactionType(e.target.value)}
                  className="w-full border border-slate-300 rounded px-3 py-2 text-slate-900"
                >
                  <option value="BUY">Buy</option>
                  <option value="SELL">Sell</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Qty</label>
                {(() => {
                  const holding = groupedHoldings.find(h => h.ticker === transactionTicker);
                  const ownedQty = holding ? Number(holding.quantity || 0) : 0;
                  const maxQty = transactionType === 'SELL' ? ownedQty : undefined;
                  return (
                    <>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        max={maxQty}
                        value={transactionQty}
                        onChange={(e) => setTransactionQty(e.target.value)}
                        placeholder="10"
                        className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:border-emerald-500 text-slate-900"
                      />
                      {transactionType === 'SELL' && (
                        <p className="text-xs text-slate-500 mt-1">Owned: {ownedQty} shares</p>
                      )}
                    </>
                  );
                })()}
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-300 rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-600 text-sm">Current Price per Share:</span>
                <span className="text-lg font-bold text-slate-700">
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                  }).format(parseFloat(transactionPrice) || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-slate-300 pt-2">
                <span className="text-slate-600 font-semibold">Total Amount:</span>
                <span className="text-2xl font-bold text-slate-800">
                  {transactionQty && transactionPrice 
                    ? new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                      }).format(parseFloat(transactionQty) * parseFloat(transactionPrice))
                    : "$0.00"}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {transactionQty || 0} shares × ${parseFloat(transactionPrice || 0).toFixed(2)} per share
              </p>
            </div>
            {transactionError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded">
                {transactionError}
              </div>
            )}
            {ltcgInfo && ltcgInfo.isApproaching && (
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <p className="text-yellow-800 font-semibold text-sm mb-1">
                      ⏰ Long-Term Capital Gains Opportunity
                    </p>
                    <p className="text-yellow-700 text-xs mb-2">
                      You're {ltcgInfo.monthsToLtcg} month{ltcgInfo.monthsToLtcg > 1 ? 's' : ''} away from qualifying for long-term capital gains rates. If you wait a bit longer, you can avoid the short-term capital gains tax rate on this position.
                    </p>
                    <p className="text-yellow-600 text-xs italic">
                      ⚠️ Disclaimer: This is a tax planning suggestion only and not investment advice. Tax implications depend on your specific situation, income bracket, and other factors. Please consult a tax professional or financial advisor before making investment decisions.
                    </p>
                  </div>
                </div>
              </div>
            )}
            <button 
              onClick={handleSubmitTransaction}
              disabled={transactionLoading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-400 text-white font-bold py-2 rounded transition"
            >
              {transactionLoading ? "Recording..." : "Record Transaction"}
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
               Estimated capital gains tax based on unrealized gains if you were to sell all positions today.
            </p>
           
             <div className="space-y-3">
               <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                 <div className="flex justify-between items-center">
                   <span className="text-orange-700 font-semibold text-sm">Short-Term (22%)</span>
                   <span className="text-orange-800 font-bold text-lg">
                     {formatCurrency(portfolioData?.shortTermTax || 0)}
                   </span>
                 </div>
                 <p className="text-orange-600 text-xs mt-1">Held less than 2 years</p>
               </div>
             
               <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                 <div className="flex justify-between items-center">
                   <span className="text-emerald-700 font-semibold text-sm">Long-Term (15%)</span>
                   <span className="text-emerald-800 font-bold text-lg">
                     {formatCurrency(portfolioData?.longTermTax || 0)}
                   </span>
                 </div>
                 <p className="text-emerald-600 text-xs mt-1">Held 2+ years</p>
               </div>
             
               <div className="bg-slate-100 border-t-2 border-slate-400 p-4 rounded-lg">
                 <div className="flex justify-between items-center">
                   <span className="text-slate-700 font-bold">Total Tax Liability</span>
                   <span className="text-slate-900 font-bold text-2xl">
                     {formatCurrency(portfolioData?.totalTaxLiability || 0)}
                   </span>
                 </div>
               </div>
            </div>
           
            <p className="text-slate-500 text-xs">
               * This is an estimate based on unrealized gains. Actual tax depends on your income bracket, state taxes, and when you sell. Please consult a tax professional.
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

      {/* Triggered Buy Target Alerts Popup */}
      {triggeredAlerts.length > 0 && (
        <div className="fixed top-4 right-4 z-[999] space-y-2 max-w-md">
          {triggeredAlerts.map((alert, index) => (
            <div
              key={index}
              className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 shadow-lg animate-pulse"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-bold text-blue-900 text-lg">
                    🎯 Buy Target Reached!
                  </h4>
                  <p className="text-blue-700 text-sm mt-1">
                    <strong>{alert.ticker}</strong> is at a great buying price
                  </p>
                  <p className="text-blue-600 text-xs mt-1">
                    Target: ${alert.targetPrice.toFixed(2)} | Current: ${alert.currentPrice.toFixed(2)}
                  </p>
                  <p className="text-blue-500 text-xs mt-1">
                    {alert.timestamp}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setTriggeredAlerts(triggeredAlerts.filter((_, i) => i !== index));
                  }}
                  className="text-blue-400 hover:text-blue-600 ml-2"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}