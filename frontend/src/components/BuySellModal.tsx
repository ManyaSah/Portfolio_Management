import { useState, useEffect } from 'react';
import api from '../services/api';

export default function BuySellModal({ ticker, onClose }: any) {
  const [qty, setQty] = useState(0);
  const [price, setPrice] = useState(0);
  const [date, setDate] = useState(new Date().toISOString().slice(0,10));
  const [busy, setBusy] = useState(false);
  const [assets, setAssets] = useState<any[]>([]);
  const [showStcg, setShowStcg] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Tax rates (defaults)
  const [stcgRate, setStcgRate] = useState(0.15);
  const [ltcgRate, setLtcgRate] = useState(0.10);

  useEffect(() => {
    api.getAssets().then(a => setAssets(a)).catch(() => setAssets([]));
  }, []);

  // simple FIFO match to determine whether any matched lots are < 2 years old
  function sellingTriggersStcg(sellQty: number, sellDateStr: string) {
    let remaining = sellQty;
    const sellDate = new Date(sellDateStr);
    const lots = assets.filter(a => a.ticker === ticker && a.quantity > 0)
                       .map(a => ({ qty: a.quantity, date: new Date(a.buyDate) }))
                       .sort((x,y) => x.date.getTime() - y.date.getTime());
    for (const lot of lots) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, lot.qty);
      const diffYears = (sellDate.getTime() - lot.date.getTime()) / (1000*60*60*24*365.0);
      if (diffYears < 2.0) return true;
      remaining -= take;
    }
    return false;
  }

  // Compute tax estimate for a sell using FIFO matching. Returns breakdown.
  function computeTaxEstimate(sellQty: number, sellPrice: number, sellDateStr: string) {
    let remaining = sellQty;
    const sellDate = new Date(sellDateStr);
    const lots = assets.filter(a => a.ticker === ticker && a.quantity > 0)
                       .map(a => ({ qty: a.quantity, date: new Date(a.buyDate), buyPrice: Number(a.buyPrice || 0) }))
                       .sort((x,y) => x.date.getTime() - y.date.getTime());

    let stcgGain = 0;
    let ltcgGain = 0;

    for (const lot of lots) {
      if (remaining <= 0) break;
      const take = Math.min(remaining, lot.qty);
      const diffYears = (sellDate.getTime() - lot.date.getTime()) / (1000*60*60*24*365.0);
      const gainPerShare = sellPrice - (lot.buyPrice || 0);
      const gain = gainPerShare * take;
      if (gain > 0) {
        if (diffYears < 2.0) stcgGain += gain;
        else ltcgGain += gain;
      }
      remaining -= take;
    }

    // If selling more than existing holdings, treat remaining as short sale (no buy lots) - we won't tax it here
    const stcgTax = stcgGain * stcgRate;
    const ltcgTax = ltcgGain * ltcgRate;
    const totalTax = stcgTax + ltcgTax;
    const totalGain = stcgGain + ltcgGain;

    return { stcgGain, ltcgGain, stcgTax, ltcgTax, totalTax, totalGain };
  }

  async function submit(isSell = false) {
    setBusy(true);
    try {
      if (isSell) {
        const sellQty = Math.abs(Number(qty));
        const needsStcg = sellingTriggersStcg(sellQty, date);
        if (needsStcg && !confirmed) {
          setShowStcg(true);
          setBusy(false);
          return;
        }
      }

      const payload = {
        ticker,
        quantity: isSell ? -Math.abs(Number(qty)) : Number(qty),
        buyPrice: Number(price),
        buyDate: date
      };
      await api.addAsset(payload);
      // naive: reload page
      window.location.reload();
    } catch (e) {
      console.error(e);
      alert('Failed');
    } finally {
      setBusy(false);
      onClose();
    }
  }

  // derive an estimate to show whenever the STCG modal is visible
  const estimate = showStcg ? computeTaxEstimate(Math.abs(Number(qty)), Number(price), date) : null;

  return (
    <div className="card">
      <h4>Buy / Sell {ticker}</h4>
      <div>
        <label>Quantity: <input type="number" value={qty} onChange={e => setQty(Number(e.target.value))} /></label>
      </div>
      <div>
        <label>Price: <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} /></label>
      </div>
      <div>
        <label>Date: <input type="date" value={date} onChange={e => setDate(e.target.value)} /></label>
      </div>
      <div style={{ marginTop: 8 }}>
        <button className="button" onClick={() => submit(false)} disabled={busy}>Buy</button>
        <button className="button" onClick={() => submit(true)} disabled={busy} style={{ marginLeft: 8 }}>Sell</button>
        <button className="button" onClick={onClose} style={{ marginLeft: 8 }}>Close</button>
      </div>

      {showStcg && estimate && (
        <div className="card" style={{ marginTop: 8, background: '#fff7e6' }}>
          <div><strong>Warning:</strong> Some matched lots are held for less than 2 years; Short-Term Capital Gains (STCG) will apply.</div>

          <div style={{ marginTop: 8 }}>
            <div>STCG Rate: <input type="number" step="0.01" value={stcgRate} onChange={e => setStcgRate(Number(e.target.value))} /> (decimal)</div>
            <div>LTCG Rate: <input type="number" step="0.01" value={ltcgRate} onChange={e => setLtcgRate(Number(e.target.value))} /> (decimal)</div>
          </div>

          <div style={{ marginTop: 8 }}>
            <div>Estimated Short-term Gain: {estimate.stcgGain.toFixed(2)}</div>
            <div>Estimated Long-term Gain: {estimate.ltcgGain.toFixed(2)}</div>
            <div>Estimated STCG Tax: {(estimate.stcgGain * stcgRate).toFixed(2)}</div>
            <div>Estimated LTCG Tax: {(estimate.ltcgGain * ltcgRate).toFixed(2)}</div>
            <div style={{ marginTop: 6 }}><strong>Estimated Total Tax: {(estimate.stcgGain * stcgRate + estimate.ltcgGain * ltcgRate).toFixed(2)}</strong></div>
          </div>

          <div style={{ marginTop: 8 }}>
            <label><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /> I understand and want to proceed</label>
          </div>
          <div style={{ marginTop: 8 }}>
            <button className="button primary" onClick={() => { setShowStcg(false); submit(true); }} disabled={!confirmed}>Confirm Sell</button>
            <button className="button" onClick={() => setShowStcg(false)} style={{ marginLeft: 8 }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
