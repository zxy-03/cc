import { ChartSpecification } from '../types/dataflow';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const chartColors = [
  'rgba(59, 130, 246, 0.8)',
  'rgba(16, 185, 129, 0.8)',
  'rgba(245, 158, 11, 0.8)',
  'rgba(239, 68, 68, 0.8)',
  'rgba(139, 92, 246, 0.8)',
  'rgba(236, 72, 153, 0.8)',
  'rgba(20, 184, 166, 0.8)',
  'rgba(249, 115, 22, 0.8)',
];

const borderColors = [
  'rgba(59, 130, 246, 1)',
  'rgba(16, 185, 129, 1)',
  'rgba(245, 158, 11, 1)',
  'rgba(239, 68, 68, 1)',
  'rgba(139, 92, 246, 1)',
  'rgba(236, 72, 153, 1)',
  'rgba(20, 184, 166, 1)',
  'rgba(249, 115, 22, 1)',
];

interface ChartRendererProps {
  chart: ChartSpecification;
}

export const ChartRenderer = ({ chart }: ChartRendererProps) => {
  const renderLineChart = () => {
    const data = chart.data as { labels: string[]; datasets: { label: string; data: number[] }[] };
    
    const chartData = {
      labels: data.labels,
      datasets: data.datasets.map((dataset, index) => ({
        ...dataset,
        backgroundColor: chartColors[index % chartColors.length],
        borderColor: borderColors[index % borderColors.length],
        borderWidth: 2,
        tension: 0.3,
      })),
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: chart.title,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    };

    return <Line data={chartData} options={options} />;
  };

  const renderBarChart = () => {
    const data = chart.data as { labels: string[]; datasets: { label: string; data: number[] }[] };
    
    const chartData = {
      labels: data.labels,
      datasets: data.datasets.map((dataset, index) => ({
        ...dataset,
        backgroundColor: chartColors[index % chartColors.length],
        borderColor: borderColors[index % borderColors.length],
        borderWidth: 1,
      })),
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top' as const,
        },
        title: {
          display: true,
          text: chart.title,
        },
      },
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    };

    return <Bar data={chartData} options={options} />;
  };

  const renderPieChart = () => {
    const data = chart.data as { labels: string[]; values: number[] };
    
    const chartData = {
      labels: data.labels,
      datasets: [
        {
          data: data.values,
          backgroundColor: chartColors.slice(0, data.values.length),
          borderColor: borderColors.slice(0, data.values.length),
          borderWidth: 2,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right' as const,
        },
        title: {
          display: true,
          text: chart.title,
        },
      },
    };

    return <Pie data={chartData} options={options} />;
  };

  const renderWaterfallChart = () => {
    const data = chart.data as { categories: string[]; values: number[] };
    
    let cumulative = 0;
    const barColors = data.values.map((value) => {
      const color = value >= 0 ? 'rgba(16, 185, 129, 0.8)' : 'rgba(239, 68, 68, 0.8)';
      return color;
    });

    const chartData = {
      labels: data.categories,
      datasets: [
        {
          label: 'GMV变化',
          data: data.values,
          backgroundColor: barColors,
          borderColor: barColors.map(c => c.replace('0.8', '1')),
          borderWidth: 1,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: chart.title,
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const value = context.raw;
              cumulative += value;
              return `${value >= 0 ? '+' : ''}${value} (累计: ${cumulative})`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: false,
        },
      },
    };

    return <Bar data={chartData} options={options} />;
  };

  const renderDefault = () => {
    return (
      <div className="h-48 bg-gray-50 rounded flex items-center justify-center">
        <div className="text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm">图表类型: {chart.type}</p>
        </div>
      </div>
    );
  };

  switch (chart.type) {
    case 'line':
      return (
        <div className="h-48">
          {renderLineChart()}
        </div>
      );
    case 'bar':
      return (
        <div className="h-48">
          {renderBarChart()}
        </div>
      );
    case 'pie':
      return (
        <div className="h-48">
          {renderPieChart()}
        </div>
      );
    case 'waterfall':
      return (
        <div className="h-48">
          {renderWaterfallChart()}
        </div>
      );
    default:
      return renderDefault();
  }
};
