import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  PieChart,
  Pie,
} from "recharts";
import {
  ShieldAlert,
  Clock,
  CheckCircle2,
  TrendingUp,
  ArrowRight,
  PieChart as PieIcon,
  BarChart3,
  Layers,
} from "lucide-react";
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
const RECENT_FEED_LIMIT = 8;

interface StatsPanelProps {
  issues: Issue[];
  onNavigateToFeed?: (issueId: string) => void;
}

export default function StatsPanel({ issues, onNavigateToFeed }: StatsPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | "all">("all");

  // 24-Hour Activity Calculation
  const last24hCount = useMemo(() => {
    const cutoff = Date.now() - TWENTY_FOUR_HOURS_MS;
    return issues.filter(
      (issue) => new Date(issue.created_at).getTime() >= cutoff
    ).length;
  }, [issues]);

  // Overall Status Metrics
  const statusMetrics = useMemo(() => {
    let open = 0;
    let inProgress = 0;
    let resolved = 0;

    for (const issue of issues) {
      if (issue.status === "open") open++;
      else if (issue.status === "in_progress") inProgress++;
      else if (issue.status === "resolved" || (issue.status as string) === "closed") resolved++;
    }

    const total = issues.length;
    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    return { open, inProgress, resolved, total, resolutionRate };
  }, [issues]);

  // Comprehensive Category Analytics Breakdown
  const categoryAnalytics = useMemo(() => {
    const totalIssues = issues.length;

    return CATEGORY_ORDER.map((cat) => {
      const catIssues = issues.filter((i) => i.category === cat);
      const count = catIssues.length;
      const open = catIssues.filter((i) => i.status === "open").length;
      const inProgress = catIssues.filter((i) => i.status === "in_progress").length;
      const resolved = catIssues.filter(
        (i) => i.status === "resolved" || (i.status as string) === "closed"
      ).length;

      const resolutionRate = count > 0 ? Math.round((resolved / count) * 100) : 0;
      const sharePercentage = totalIssues > 0 ? Math.round((count / totalIssues) * 100) : 0;

      return {
        category: cat,
        name: CATEGORY_LABELS[cat],
        count,
        open,
        inProgress,
        resolved,
        resolutionRate,
        sharePercentage,
        fill: CATEGORY_COLORS[cat],
      };
    });
  }, [issues]);

  // Filtered Issues for Recent Feed
  const recentIssues = useMemo(() => {
    const filtered = selectedCategory === "all"
      ? issues
      : issues.filter((i) => i.category === selectedCategory);
    return filtered.slice(0, RECENT_FEED_LIMIT);
  }, [issues, selectedCategory]);

  const handleDetailClick = (issueId: string) => {
    if (onNavigateToFeed) {
      onNavigateToFeed(issueId);
      return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set("issue", issueId);
    url.searchParams.set("tab", "feed");
    window.location.href = url.toString();
  };

  return (
    <div className="w-full flex-1 space-y-6 text-slate-100">
      {/* Top Status KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-sm">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              24h New Reports
              <Clock className="h-4 w-4 text-blue-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-extrabold text-blue-400">{last24hCount}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">submitted today</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-sm">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              Open Issues
              <ShieldAlert className="h-4 w-4 text-amber-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-extrabold text-amber-400">{statusMetrics.open}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">awaiting action</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-sm">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              In Progress
              <TrendingUp className="h-4 w-4 text-blue-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-extrabold text-blue-400">{statusMetrics.inProgress}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">being addressed</p>
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-sm">
          <CardHeader className="p-4 pb-1">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              Resolved ({statusMetrics.resolutionRate}%)
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1">
            <div className="text-2xl font-extrabold text-emerald-400">{statusMetrics.resolved}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">total issues fixed</p>
          </CardContent>
        </Card>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 pr-2">
          <Layers className="h-4 w-4 text-blue-400" />
          Filter:
        </span>
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
            selectedCategory === "all"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200"
          }`}
        >
          All Categories ({issues.length})
        </button>
        {categoryAnalytics.map((cat) => (
          <button
            key={cat.category}
            type="button"
            onClick={() => setSelectedCategory(cat.category)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat.category
                ? "bg-slate-800 text-slate-100 ring-1 ring-slate-700 shadow-sm"
                : "bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-slate-200"
            }`}
          >
            <CategoryIcon category={cat.category} className="h-3.5 w-3.5" style={{ color: cat.fill }} />
            {cat.name} ({cat.count})
          </button>
        ))}
      </div>

      {/* Category Analytics Dashboard Charts */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Reports volume Bar Chart */}
        <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-sm xl:col-span-2">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-300 flex items-center justify-between">
              <span>Category Volume & Distribution</span>
              <BarChart3 className="h-4 w-4 text-slate-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={categoryAnalytics}
                  margin={{ top: 15, right: 15, left: -20, bottom: 35 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    tickLine={false}
                    axisLine={{ stroke: "#334155" }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={{ stroke: "#334155" }}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-slate-800 bg-slate-950/95 backdrop-blur-md p-3 text-xs text-slate-100 shadow-xl space-y-1">
                            <div className="flex items-center gap-2 font-semibold">
                              <CategoryIcon category={data.category} className="h-4 w-4" style={{ color: data.fill }} />
                              <span>{data.name}</span>
                            </div>
                            <p className="text-slate-400">
                              Total Reports: <span className="text-blue-400 font-bold">{data.count}</span> ({data.sharePercentage}% share)
                            </p>
                            <p className="text-slate-400">
                              Resolution Rate: <span className="text-emerald-400 font-bold">{data.resolutionRate}%</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={44}>
                    {categoryAnalytics.map((entry) => (
                      <Cell
                        key={entry.category}
                        fill={entry.fill}
                        opacity={selectedCategory === "all" || selectedCategory === entry.category ? 1 : 0.3}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Share Donut Chart */}
        <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-sm xl:col-span-1">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-300 flex items-center justify-between">
              <span>Category Share</span>
              <PieIcon className="h-4 w-4 text-slate-500" />
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 pt-2 flex flex-col items-center justify-center">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryAnalytics}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="count"
                  >
                    {categoryAnalytics.map((entry) => (
                      <Cell
                        key={entry.category}
                        fill={entry.fill}
                        stroke="#0f172a"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs text-slate-100 shadow-lg">
                            <span className="font-semibold">{data.name}:</span> {data.count} ({data.sharePercentage}%)
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] pt-2 border-t border-slate-800/80">
              {categoryAnalytics.slice(0, 6).map((cat) => (
                <div key={cat.category} className="flex items-center gap-1.5 truncate text-slate-400">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: cat.fill }} />
                  <span className="truncate">{cat.name}</span>
                  <span className="text-slate-200 font-semibold ml-auto">{cat.sharePercentage}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Performance Matrix Grid */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Category Performance Matrix
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categoryAnalytics.map((cat) => {
            const isSelected = selectedCategory === cat.category;
            return (
              <Card
                key={cat.category}
                onClick={() => setSelectedCategory(isSelected ? "all" : cat.category)}
                className={`border text-slate-100 transition-all cursor-pointer ${
                  isSelected
                    ? "border-blue-500 bg-slate-850 ring-1 ring-blue-500/50 shadow-lg"
                    : "border-slate-800 bg-slate-900 hover:border-slate-700"
                }`}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="p-1.5 rounded-md"
                        style={{ backgroundColor: `${cat.fill}20`, color: cat.fill }}
                      >
                        <CategoryIcon category={cat.category} className="h-4 w-4" />
                      </div>
                      <CardTitle className="text-xs font-bold text-slate-200">
                        {cat.name}
                      </CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className="border-slate-700 bg-slate-950 text-slate-300 text-[10px] px-1.5 py-0.5"
                    >
                      {cat.count} total
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-4 pt-1 space-y-3">
                  {/* Resolution Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-400">Resolution Rate</span>
                      <span className="font-bold text-emerald-400">{cat.resolutionRate}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${cat.resolutionRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Status Pills Breakdown */}
                  <div className="grid grid-cols-3 gap-1 pt-1 text-[10px] text-center">
                    <div className="rounded bg-amber-500/10 border border-amber-500/20 py-1 text-amber-400">
                      <div className="font-bold">{cat.open}</div>
                      <div className="text-[9px] text-slate-400">Open</div>
                    </div>
                    <div className="rounded bg-blue-500/10 border border-blue-500/20 py-1 text-blue-400">
                      <div className="font-bold">{cat.inProgress}</div>
                      <div className="text-[9px] text-slate-400">Progress</div>
                    </div>
                    <div className="rounded bg-emerald-500/10 border border-emerald-500/20 py-1 text-emerald-400">
                      <div className="font-bold">{cat.resolved}</div>
                      <div className="text-[9px] text-slate-400">Fixed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Category Feed Section */}
      <Card className="border-slate-800 bg-slate-900 text-slate-100 shadow-sm">
        <CardHeader className="p-5 pb-3 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-blue-300 flex items-center gap-2">
              <span>
                {selectedCategory === "all"
                  ? "Recent Category Reports"
                  : `${CATEGORY_LABELS[selectedCategory]} Reports`}
              </span>
            </CardTitle>
            <span className="text-xs text-slate-400 font-normal">
              Showing {recentIssues.length} items
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {recentIssues.length === 0 ? (
            <p className="text-xs text-slate-400 italic text-center py-6">
              No reports found for this category filter.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {recentIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="rounded-lg border border-slate-800 bg-slate-950/60 p-3.5 space-y-2 flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[issue.category]}15`,
                          color: CATEGORY_COLORS[issue.category],
                          borderColor: `${CATEGORY_COLORS[issue.category]}35`,
                        }}
                        className="text-[9px] font-bold gap-1 px-1.5 py-0.2"
                      >
                        <CategoryIcon category={issue.category} className="h-2.5 w-2.5" />
                        {CATEGORY_LABELS[issue.category]}
                      </Badge>
                      <span className="text-[10px] text-slate-500">
                        {relativeTime(issue.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 font-medium line-clamp-2 leading-snug">
                      {issue.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-[11px]">
                    <span className="capitalize text-slate-400 text-[10px]">
                      {issue.status.replace("_", " ")}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDetailClick(issue.id)}
                      className="inline-flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300 transition-colors cursor-pointer group"
                    >
                      Details
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}