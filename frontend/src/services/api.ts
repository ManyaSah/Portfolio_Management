const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081';

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
  return await res.json();
}

export const api = {
  getPortfolio: () => getJson<any>(`${BASE}/api/portfolio`),
  getAssets: () => getJson<any>(`${BASE}/api/assets`),
  addAsset: (asset: any) => fetch(`${BASE}/api/assets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(asset) }).then(r => r.json()),
  deleteAsset: (id: number) => fetch(`${BASE}/api/assets/${id}`, { method: 'DELETE' }),
  getXirr: (ticker: string) => getJson<any>(`${BASE}/api/portfolio/xirr/${ticker}`),
  getPriceHistory: (ticker: string) => getJson<any>(`${BASE}/api/prices/${ticker}`),
  postPrice: (ticker: string, price: number) => fetch(`${BASE}/api/prices`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticker, price }) }).then(r => r.json()),
  getTargets: () => getJson<any>(`${BASE}/api/targets`),
  addTarget: (t: any) => fetch(`${BASE}/api/targets`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(t) }).then(r => r.json()),
};

export default api;
