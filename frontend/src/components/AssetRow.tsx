import useSWR from 'swr';
import api from '../services/api';
import { useState } from 'react';
import BuySellModal from './BuySellModal';

export default function AssetRow({ av }: any) {
  const asset = av.asset;
  const { data: xirr } = useSWR(asset.ticker ? ['xirr', asset.ticker] : null, () => api.getXirr(asset.ticker));
  const [open, setOpen] = useState(false);

  const marketValue = av.marketValue || 0;
  const cost = av.cost || 0;
  const gain = Number(marketValue) - Number(cost);
  const pct = cost && Number(cost) !== 0 ? (gain / Number(cost)) * 100 : 0;

  return (
    <>
      <tr>
        <td>{asset.ticker}</td>
        <td>{asset.quantity}</td>
        <td>{av.latestPrice ?? '-'}</td>
        <td>{marketValue}</td>
        <td>{cost}</td>
        <td>{gain.toFixed(2)} ({pct.toFixed(2)}%)</td>
        <td>{xirr?.xirrPercent ? xirr.xirrPercent.toFixed(2) + '%' : '-'}</td>
        <td>
          <button className="button" onClick={() => setOpen(true)}>Buy/Sell</button>
        </td>
      </tr>
      {open && <BuySellModal ticker={asset.ticker} onClose={() => setOpen(false)} />}
    </>
  );
}
