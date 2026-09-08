import { useMemo } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import type { Issue, IssueCategory } from "../types/issue";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../types/issue";
import { relativeTime } from "../lib/relativeTime";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const CATEGORY_ORDER: IssueCategory[] = [
  "water",
  "sewage",
  "waste",
  "pollution",
  "road_damage",
  "encroachment",
  "other",
];

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const RECENT_FEED_LIMIT = 10;

interface StatsPanelProps {
  issues: Issue[];
}

export default function StatsPanel({ issues }: StatsPanelProps) {
  const categoryCounts = useMemo(() => {
    const counts = new Map<IssueCategory, number>();
    for (const category of CATEGORY_ORDER) counts.set(category, 0);
    for (const issue of issues) {
      counts.set(issue.category, (counts.get(issue.category) ?? 0) + 1);
    }
    return counts;
  }, [issues]);

  const last24hCount = useMemo(() => {
    const cutoff = Date.now() - TWENTY_FOUR_HOURS_MS;
    return issues.filter(
      (issue) => new Date(issue.created_at).getTime() >= cutoff
    ).length;
  }, [issues]);

  const recentIssues = useMemo(
    () => issues.slice(0, RECENT_FEED_LIMIT),
    [issues]
  );

  const chartData = {
    labels: CATEGORY_ORDER.map((c) => CATEGORY_LABELS[c]),
    datasets: [
      {
        data: CATEGORY_ORDER.map((c) => categoryCounts.get(c) ?? 0),
        backgroundColor: CATEGORY_ORDER.map((c) => CATEGORY_COLORS[c]),
        borderRadius: 4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: {
        ticks: { font: { size: 10 }, maxRotation: 45, minRotation: 45 },
        grid: { display: false },
      },
      y: {
        beginAtZero: true,
        ticks: { precision: 0 as const },
      },
    },
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-4 w-full max-w-xs flex flex-col gap-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <div>
        <p className="text-2xl font-semibold">{last24hCount}</p>
        <p className="text-xs text-gray-500">reports in the last 24 hours</p>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">By category</p>
        <div style={{ height: 160 }}>
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>

      <div>
        <p className="text-sm font-medium mb-2">Recent reports</p>
        {recentIssues.length === 0 ? (
          <p className="text-xs text-gray-400">No reports yet.</p>
        ) : (
          <ul className="space-y-2">
            {recentIssues.map((issue) => (
              <li key={issue.id} className="text-xs border-b pb-2 last:border-0">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className="font-medium"
                    style={{ color: CATEGORY_COLORS[issue.category] }}
                  >
                    {CATEGORY_LABELS[issue.category]}
                  </span>
                  <span className="text-gray-400 whitespace-nowrap">
                    {relativeTime(issue.created_at)}
                  </span>
                </div>
                <p className="text-gray-600 truncate">{issue.description}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}