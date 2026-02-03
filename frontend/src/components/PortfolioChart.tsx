import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, PointElement, CategoryScale, LinearScale, Title } from 'chart.js';
ChartJS.register(LineElement, PointElement, CategoryScale, LinearScale, Title);

export default function PortfolioChart({ points, color }: any) {
  const data = {
    labels: points.map((p: any) => p.date),
    datasets: [{ label: 'Portfolio Value', data: points.map((p: any) => p.value), borderColor: color || 'green', fill: false }]
  };
  return <div className="card"><Line data={data} /></div>;
}
