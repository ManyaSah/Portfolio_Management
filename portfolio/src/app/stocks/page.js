"use client";

import { useState } from "react";

export default function StocksPage() {
  const STORAGE_KEY = "portfolioHoldings";
  const stocks = [
    { ticker: "AAPL", companyName: "Apple Inc." },
    { ticker: "TSLA", companyName: "Tesla" },
    { ticker: "MSFT", companyName: "Microsoft Corporation" },
    { ticker: "GOOGL", companyName: "Alphabet Inc" },
    { ticker: "AMZN", companyName: "Amazon.com Inc" },
  ];

  const getHoldings = () => {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  };

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const addToPortfolio = (stock, qty) => {
    const existing = getHoldings();
    if (existing.some((item) => item.ticker === stock.ticker)) {
      return;
    }
    const updated = [
      ...existing,
      {
        id: stock.ticker,
        ticker: stock.ticker,
        companyName: stock.companyName,
        quantity: qty,
        avgPrice: 0,
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event("portfolio-updated"));
  };

  const openAddModal = (stock) => {
    setSelectedStock(stock);
    setQuantity(1);
    setIsAddOpen(true);
  };

  const handleConfirmAdd = () => {
    if (!selectedStock) return;
    const qty = Math.max(1, Number(quantity) || 1);
    addToPortfolio(selectedStock, qty);
    setIsAddOpen(false);
  };
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 p-8">
      <h1 className="text-2xl font-bold mb-4">Choose a Stock</h1>
      <ul className="space-y-2">
        {stocks.map((stock) => (
          <li
            key={stock.ticker}
            className="bg-white border border-slate-200 rounded px-4 py-2 flex items-center justify-between"
          >
            <div>
              <span className="font-semibold">{stock.ticker}</span>
              <span className="text-slate-400 ml-2">{stock.companyName}</span>
            </div>
            <button
              className="text-emerald-500 hover:text-emerald-700 font-medium text-xs border border-emerald-200 bg-emerald-50 px-3 py-1 rounded"
              onClick={() => openAddModal(stock)}
            >
              Add
            </button>
          </li>
        ))}
      </ul>

      <div
        className={`${isAddOpen ? "" : "hidden"} fixed inset-0 bg-slate-900 bg-opacity-50 z-50 flex items-center justify-center backdrop-blur-sm`}
      >
        <div className="bg-white rounded-lg shadow-2xl w-96 overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h3 className="font-bold text-slate-700">Add to Portfolio</h3>
            <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-slate-600">
              &times;
            </button>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-slate-600">
              {selectedStock ? (
                <>
                  {selectedStock.ticker} <span className="text-slate-400">{selectedStock.companyName}</span>
                </>
              ) : (
                ""
              )}
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full border border-slate-300 rounded px-3 py-2 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2 rounded"
              onClick={handleConfirmAdd}
            >
              Add Stock
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
