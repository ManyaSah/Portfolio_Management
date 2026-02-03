import { useState } from 'react';

export default function TaxPage() {
  const [sellPrice, setSellPrice] = useState(0);
  const [buyPrice, setBuyPrice] = useState(0);
  const [qty, setQty] = useState(0);
  const [rate, setRate] = useState(0.15);

  const gain = (sellPrice - buyPrice) * qty;
  const tax = gain > 0 ? gain * rate : 0;

  return (
    <div className="container">
      <div className="header"><h2>Estimated Tax Calculator</h2></div>
      <div className="card">
        <div>
          <label>Buy Price: <input type="number" value={buyPrice} onChange={e => setBuyPrice(Number(e.target.value))} /></label>
        </div>
        <div>
          <label>Sell Price: <input type="number" value={sellPrice} onChange={e => setSellPrice(Number(e.target.value))} /></label>
        </div>
        <div>
          <label>Quantity: <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} /></label>
        </div>
        <div>
          <label>Tax Rate (decimal): <input type="number" step="0.01" value={rate} onChange={e => setRate(Number(e.target.value))} /></label>
        </div>
        <div className="card small">Gain: {gain.toFixed(2)}</div>
        <div className="card small">Estimated Tax: {tax.toFixed(2)}</div>
      </div>
    </div>
  );
}
