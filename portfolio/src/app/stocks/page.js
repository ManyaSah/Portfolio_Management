"use client";

import { useState } from "react";
import { addAsset } from "../../lib/api";
import { useRouter } from "next/navigation";

export default function StocksPage() {
  const router = useRouter();
  const stocks = [
    { ticker: "AAPL", companyName: "Apple Inc." },
    { ticker: "TSLA", companyName: "Tesla" },
    { ticker: "MSFT", companyName: "Microsoft Corporation" },
    { ticker: "GOOGL", companyName: "Alphabet Inc" },
    { ticker: "AMZN", companyName: "Amazon.com Inc" },
    { ticker: "NFLX", companyName: "Netflix Inc" },
  ];

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [buyPrice, setBuyPrice] = useState(0);
  const [buyDate, setBuyDate] = useState(new Date().toISOString().split('T')[0]);
  const [error, setError] = useState("");

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
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <h1 className="text-2xl font-bold mb-4">Choose a Stock</h1>
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
    </div>
  );
}
