import useSWR from 'swr';
import api from '../services/api';
import Link from 'next/link';
import AssetRow from '../components/AssetRow';
import PortfolioChart from '../components/PortfolioChart';
import { useEffect, useState } from 'react';
import { computeXirr } from '../utils/xirr';

export default function Home() {
  const { data, error } = useSWR('/portfolio', api.getPortfolio);
  const { data: allAssets } = useSWR('/assets', api.getAssets);
  const [portfolioXirr, setPortfolioXirr] = useState<number | null>(null);

  useEffect(() => {
    if (!allAssets || !data) return;
    // build cashflows: each buy -> negative (price * qty), sells are negative qty so result positive
    const flows: { date: string; amount: number }[] = [];
    for (const a of allAssets) {
      const amt = Number(a.buyPrice || 0) * Number(a.quantity || 0) * -1.0; // buyPrice * quantity * -1
      // Note: quantity negative for sells will flip sign to positive cash inflow automatically
      flows.push({ date: a.buyDate, amount: amt });
    }
    // add final positive cashflow = total market value now
    const totalValue = Number(data.totalValue || 0);
    flows.push({ date: new Date().toISOString().slice(0,10), amount: totalValue });

    const x = computeXirr(flows);
    setPortfolioXirr(x);
  }, [allAssets, data]);

  if (error) return <div className="container">Failed to load</div>;
  if (!data) return <div className="container">Loading...</div>;

  const assets = data.assets || [];
  const totalValue = data.totalValue || 0;
  const totalProfit = data.totalProfit || 0;

  // Build simple chart points from asset totals over time using latest price only (placeholder)
  const points = [
    { date: 'Start', value: Number(data.totalCost || 0) },
    { date: 'Now', value: Number(totalValue) }
  ];
  const chartColor = Number(totalProfit) >= 0 ? 'green' : 'red';

  return (
    <div className="container">
      <div className="header">
        <h1>Portfolio</h1>
        <div>
          <Link href="/tax">Tax Calculator</Link>
        </div>
      </div>

      <div className="card">
        <div>Total Value: {totalValue}</div>
        <div>Total Profit: {totalProfit}</div>
        <div>Portfolio XIRR: {portfolioXirr != null ? portfolioXirr.toFixed(2) + '%' : 'N/A'}</div>
      </div>

      <PortfolioChart points={points} color={chartColor} />

      <div className="card">
        <h3>Holdings</h3>
        <table className="table">
          <thead><tr><th>Ticker</th><th>Quantity</th><th>Latest</th><th>Market Value</th><th>Cost</th><th>Gain</th><th>XIRR</th><th></th></tr></thead>
          <tbody>
            {assets.map((av: any) => (
              <AssetRow key={av.asset.id} av={av} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
