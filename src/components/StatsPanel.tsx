import { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Issue, IssueCategory } from "../types/issue";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../types/issue";
import { relativeTime } from "../lib/relativeTime";
import { CategoryIcon } from "./CategoryIcon";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";

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
  const chartData = useMemo(() => {
    const counts = new Map<IssueCategory, number>();
    for (const category of CATEGORY_ORDER) counts.set(category, 0);
    for (const issue of issues) {
      counts.set(issue.category, (counts.get(issue.category) ?? 0) + 1);
    }

    return CATEGORY_ORDER.map((category) => ({
      category,
      name: CATEGORY_LABELS[category],
      count: counts.get(category) ?? 0,
      fill: CATEGORY_COLORS[category],
    }));
  }, [issues]);

  const last24hCount = useMemo(() => {
    const cutoff = Date.now() - TWENTY_FOUR_HOURS_MS;
    return issues.filter(
      (issue) => new Date(issue.created_at).getTime() >= cutoff,
    ).length;
  }, [issues]);

  const recentIssues = useMemo(
    () => issues.slice(0, RECENT_FEED_LIMIT),
    [issues],
  );

  return (
    <div className="w-full flex-1 space-y-6 text-slate-100">
      {/* 24h Summary Metric Header */}
      <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-sm">
        <CardHeader className="p-5 pb-2">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-300">
            24-Hour Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-extrabold tracking-tight text-blue-400">
              {last24hCount}
            </span>
            <span className="text-sm text-slate-400">
              reports submitted in the last 24 hours
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Responsive Grid for Chart & Feed */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Category Breakdown Chart - Spans 2 cols on large screens */}
        <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-sm xl:col-span-2">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-300">
              Reports by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-md border border-slate-800 bg-slate-950 p-2.5 text-xs text-slate-100 shadow-md flex items-center gap-2">
                            <CategoryIcon
                              category={data.category}
                              className="h-4 w-4"
                            />
                            <span className="font-semibold">{data.name}:</span>
                            <span className="text-blue-300 font-bold">{data.count}</span>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.category} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Feed List - Spans 1 col */}
        <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-sm xl:col-span-1">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-300">
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-2">
            {recentIssues.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No reports yet.
              </p>
            ) : (
              <ul className="divide-y divide-slate-800">
                {recentIssues.map((issue) => (
                  <li
                    key={issue.id}
                    className="py-3 first:pt-0 last:pb-0 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[issue.category]}20`,
                          color: CATEGORY_COLORS[issue.category],
                          borderColor: `${CATEGORY_COLORS[issue.category]}40`,
                        }}
                        className="text-[10px] font-bold gap-1 px-2 py-0.5"
                      >
                        <CategoryIcon
                          category={issue.category}
                          className="h-3 w-3"
                        />
                        {CATEGORY_LABELS[issue.category]}
                      </Badge>
                      <span className="text-slate-400 text-[10px] whitespace-nowrap">
                        {relativeTime(issue.created_at)}
                      </span>
                    </div>
                    <p className="text-slate-200 font-medium truncate">
                      {issue.description}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}