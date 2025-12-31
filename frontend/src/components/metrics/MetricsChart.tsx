import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { useMetricsTimeline } from '@/hooks/useCheckpointData';
import { useAppStore } from '@/stores/appStore';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export function MetricsChart() {
  const { data: timeline, isLoading } = useMetricsTimeline();
  const { currentCheckpoint, setCurrentCheckpoint } = useAppStore();

  if (isLoading || !timeline) {
    return (
      <div className="p-6 h-[500px] flex items-center justify-center">
        <div className="text-[var(--color-muted-foreground)]">Loading metrics...</div>
      </div>
    );
  }

  const chartData = {
    labels: timeline.map(t => `${t.checkpoint}`),
    datasets: [
      {
        label: 'Combined Score',
        data: timeline.map(t => t.combined_score),
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.1)',
        tension: 0.3,
        fill: true,
        pointRadius: timeline.map(t => t.checkpoint === currentCheckpoint ? 8 : 4),
        pointBackgroundColor: timeline.map(t =>
          t.checkpoint === currentCheckpoint ? '#2563eb' : 'rgba(37, 99, 235, 0.5)'
        ),
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
      },
      {
        label: 'Sum Radii',
        data: timeline.map(t => t.sum_radii),
        borderColor: '#16a34a',
        backgroundColor: 'transparent',
        tension: 0.3,
        pointRadius: timeline.map(t => t.checkpoint === currentCheckpoint ? 6 : 3),
        pointBackgroundColor: '#16a34a',
      },
      {
        label: 'Target Ratio',
        data: timeline.map(t => t.target_ratio),
        borderColor: '#dc2626',
        backgroundColor: 'transparent',
        tension: 0.3,
        borderDash: [5, 5],
        pointRadius: timeline.map(t => t.checkpoint === currentCheckpoint ? 6 : 3),
        pointBackgroundColor: '#dc2626',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    onClick: (_event: any, elements: any[]) => {
      if (elements.length > 0) {
        const index = elements[0].index;
        const checkpoint = timeline[index].checkpoint;
        setCurrentCheckpoint(checkpoint);
      }
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          font: {
            family: "'IBM Plex Mono', monospace",
            size: 12,
          },
          usePointStyle: true,
          pointStyle: 'circle',
        },
      },
      title: {
        display: true,
        text: 'Evolution Progress Over Checkpoints',
        font: {
          family: "'IBM Plex Sans', sans-serif",
          size: 18,
          weight: 600,
        },
        color: '#1e293b',
        padding: { bottom: 20 },
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#1e293b',
        bodyColor: '#64748b',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        padding: 12,
        boxPadding: 6,
        titleFont: {
          family: "'IBM Plex Sans', sans-serif",
          size: 14,
          weight: 600,
        },
        bodyFont: {
          family: "'IBM Plex Mono', monospace",
          size: 12,
        },
        callbacks: {
          title: (items: any[]) => `Checkpoint ${items[0].label}`,
          label: (context: any) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y.toFixed(4);
            return `${label}: ${value}`;
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Checkpoint',
          font: {
            family: "'IBM Plex Mono', monospace",
            size: 12,
          },
          color: '#64748b',
        },
        grid: {
          color: '#f1f5f9',
        },
        ticks: {
          font: {
            family: "'IBM Plex Mono', monospace",
            size: 11,
          },
          color: '#64748b',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Score / Value',
          font: {
            family: "'IBM Plex Mono', monospace",
            size: 12,
          },
          color: '#64748b',
        },
        grid: {
          color: '#f1f5f9',
        },
        ticks: {
          font: {
            family: "'IBM Plex Mono', monospace",
            size: 11,
          },
          color: '#64748b',
        },
      },
    },
  };

  // Statistics
  const latestMetrics = timeline[timeline.length - 1];
  const firstMetrics = timeline[0];
  const improvement = latestMetrics.combined_score - firstMetrics.combined_score;

  return (
    <div className="p-6">
      {/* Stats cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-xl">
          <div className="text-xs text-blue-600 font-medium uppercase tracking-wide">Final Score</div>
          <div className="text-2xl font-mono font-bold text-blue-700 mt-1">
            {(latestMetrics.combined_score * 100).toFixed(1)}%
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-green-50 to-white border border-green-100 rounded-xl">
          <div className="text-xs text-green-600 font-medium uppercase tracking-wide">Sum Radii</div>
          <div className="text-2xl font-mono font-bold text-green-700 mt-1">
            {latestMetrics.sum_radii.toFixed(3)}
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-purple-50 to-white border border-purple-100 rounded-xl">
          <div className="text-xs text-purple-600 font-medium uppercase tracking-wide">Improvement</div>
          <div className="text-2xl font-mono font-bold text-purple-700 mt-1">
            +{(improvement * 100).toFixed(1)}%
          </div>
        </div>
        <div className="p-4 bg-gradient-to-br from-amber-50 to-white border border-amber-100 rounded-xl">
          <div className="text-xs text-amber-600 font-medium uppercase tracking-wide">Checkpoints</div>
          <div className="text-2xl font-mono font-bold text-amber-700 mt-1">
            {timeline.length}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="h-[400px] bg-white border border-[var(--color-border)] rounded-xl p-4">
        <Line data={chartData} options={options} />
      </div>

      <div className="mt-4 text-sm text-[var(--color-muted-foreground)] text-center">
        Click on any data point to navigate to that checkpoint
      </div>
    </div>
  );
}
