const API_URL = "http://localhost:8080/api";

export const fetchAssets = async () => {
  const res = await fetch(`${API_URL}/assets`);
  return res.json();
};

export const fetchStockPrices = async (ticker) => {
  const res = await fetch(`${API_URL}/prices/${ticker}`);
  return res.json();
};