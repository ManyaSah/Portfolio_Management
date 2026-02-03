// Simple XIRR implementation using Newton-Raphson
export function computeXirr(cashflows: { date: string; amount: number }[]): number | null {
  if (!cashflows || cashflows.length === 0) return null;

  // convert to Date and sort
  const flows = cashflows
    .map(f => ({ date: new Date(f.date), amount: f.amount }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const firstDate = flows[0].date;
  const days = (d: Date) => (d.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);

  function npv(rate: number) {
    return flows.reduce((s, f) => s + f.amount / Math.pow(1 + rate, days(f.date) / 365.0), 0);
  }

  function dNpv(rate: number) {
    return flows.reduce((s, f) => s - (days(f.date) / 365.0) * f.amount / Math.pow(1 + rate, days(f.date) / 365.0), 0);
  }

  // initial guess
  let rate = 0.1;
  for (let i = 0; i < 100; i++) {
    const value = npv(rate);
    const deriv = dNpv(rate);
    if (Math.abs(deriv) < 1e-12) break;
    const next = rate - value / deriv;
    if (!isFinite(next)) break;
    if (Math.abs(next - rate) < 1e-7) {
      rate = next;
      break;
    }
    rate = next;
  }

  if (!isFinite(rate) || Math.abs(npv(rate)) > 1e-3) return null;
  return rate * 100.0;
}
