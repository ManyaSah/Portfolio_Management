import { useRouter } from 'next/router';
import useSWR from 'swr';
import api from '../../services/api';
import Link from 'next/link';

export default function StockPage() {
  const router = useRouter();
  const { ticker } = router.query;

  const { data: history, error } = useSWR(ticker ? ['prices', ticker] : null, () => api.getPriceHistory(String(ticker)));
  const { data: xirr } = useSWR(ticker ? ['xirr', ticker] : null, () => api.getXirr(String(ticker)));
  const { data: assets } = useSWR('/assets', api.getAssets);

  if (!ticker) return <div className="container">Loading...</div>;
  if (error) return <div className="container">Failed to load</div>;

  const orders = (assets || []).filter((a: any) => a.ticker === ticker);

  return (
    <div className="container">
      <div className="header">
        <h2>{ticker}</h2>
        <div><Link href="/">Back</Link></div>
      </div>

      <div className="card">
        <div>XIRR: {xirr?.xirrPercent ?? 'N/A'}</div>
      </div>

      <div className="card">
        <h3>Orders</h3>
        <table className="table">
          <thead><tr><th>ID</th><th>Qty</th><th>Price</th><th>Date</th></tr></thead>
          <tbody>
            {orders.map((o: any) => (
              <tr key={o.id}><td>{o.id}</td><td>{o.quantity}</td><td>{o.buyPrice}</td><td>{o.buyDate}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Price History</h3>
        <table className="table">
          <thead><tr><th>Date</th><th>Close</th></tr></thead>
          <tbody>
            {(history || []).map((h: any) => (
              <tr key={h.id}><td>{h.priceDate}</td><td>{h.closePrice}</td></tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
