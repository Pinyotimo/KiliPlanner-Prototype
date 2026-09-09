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
import { getCategoryIcon } from "../lib/categoryIcons";
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
      (issue) => new Date(issue.created_at).getTime() >= cutoff
    ).length;
  }, [issues]);

  const recentIssues = useMemo(
    () => issues.slice(0, RECENT_FEED_LIMIT),
    [issues]
  );

  return (
    <div className="w-full max-w-sm space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">
      {/* 24h Summary Card */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            24-Hour Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <p className="text-3xl font-bold tracking-tight text-primary">
            {last24hCount}
          </p>
          <p className="text-xs text-muted-foreground">
            reports submitted in the last 24 hours
          </p>
        </CardContent>
      </Card>

      {/* Category Breakdown Chart */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Reports by Category
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: -25, bottom: 20 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 9, fill: "var(--muted-foreground)" }}
                  interval={0}
                  angle={-35}
                  textAnchor="end"
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover text-popover-foreground border rounded-md shadow-md p-2 text-xs flex items-center gap-2">
                          <CategoryIcon category={data.category} className="h-3.5 w-3.5" />
                          <span className="font-semibold">{data.name}:</span>
                          <span>{data.count}</span>
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

      {/* Recent Feed List */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {recentIssues.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">No reports yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recentIssues.map((issue) => (
                <li key={issue.id} className="py-2.5 first:pt-0 last:pb-0 text-xs">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Badge
                      variant="outline"
                      style={{
                        backgroundColor: `${CATEGORY_COLORS[issue.category]}15`,
                        color: CATEGORY_COLORS[issue.category],
                        borderColor: `${CATEGORY_COLORS[issue.category]}30`,
                      }}
                      className="text-[10px] font-bold gap-1 px-1.5 py-0"
                    >
                      <CategoryIcon category={issue.category} className="h-3 w-3" />
                      {CATEGORY_LABELS[issue.category]}
                    </Badge>
                    <span className="text-muted-foreground/80 text-[10px] whitespace-nowrap">
                      {relativeTime(issue.created_at)}
                    </span>
                  </div>
                  <p className="text-foreground font-medium truncate">
                    {issue.description}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}