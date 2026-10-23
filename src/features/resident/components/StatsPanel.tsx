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
  AreaChart,
  Area,
  LabelList,
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
  Activity,
  GitBranch,
} from "lucide-react";
import type { Issue, IssueCategory } from "../../../types/issue";
import {
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_SHORT_LABELS,
} from "../../../types/issue";
import { relativeTime } from "../../../lib/relativeTime";
import {
  getCategoryGroups,
  getCategoryMetrics,
  getDailyTrend,
  getRecentIssues,
  getStatusMetrics,
  getStatusPipeline,
} from "../analytics/analyticsMetrics";
import { CategoryIcon } from "../../../components/CategoryIcon";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { useChartTokens } from "../../../lib/chartTheme";
import { cn } from "@/lib/utils";

interface StatsPanelProps {
  issues: Issue[];
  onNavigateToFeed?: (issueId: string) => void;
}

const TREND_RANGES = [7, 30, 90] as const;

export default function StatsPanel({
  issues,
  onNavigateToFeed,
}: StatsPanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<
    IssueCategory | "all"
  >("all");
  const [trendRange, setTrendRange] = useState<(typeof TREND_RANGES)[number]>(30);
  const tokens = useChartTokens();

  const last24hCount = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    return issues.filter(
      (issue) => new Date(issue.created_at).getTime() >= cutoff,
    ).length;
  }, [issues]);

  const statusMetrics = useMemo(() => getStatusMetrics(issues), [issues]);
  const categoryAnalytics = useMemo(() => getCategoryMetrics(issues), [issues]);
  const categoryGroups = useMemo(() => getCategoryGroups(issues), [issues]);
  // Empty groups are dropped from the ring: a sliver of nothing only makes
  // the part-to-whole harder to read, and the legend has no room for it.
  const chartGroups = useMemo(
    () => categoryGroups.filter((group) => group.count > 0),
    [categoryGroups],
  );
  const otherCount = useMemo(
    () =>
      categoryGroups.find((group) => group.key === "other")?.count ?? 0,
    [categoryGroups],
  );
  const statusPipeline = useMemo(() => getStatusPipeline(issues), [issues]);
  const trend = useMemo(
    () => getDailyTrend(issues, trendRange),
    [issues, trendRange],
  );

  const recentIssues = useMemo(
    () => getRecentIssues(issues, selectedCategory),
    [issues, selectedCategory],
  );

  const trendTotal = useMemo(
    () => trend.reduce((sum, point) => sum + point.count, 0),
    [trend],
  );

  // The largest group, which is the one bar worth labelling directly.
  const maxGroupCount = useMemo(
    () =>
      chartGroups.reduce((max, entry) => Math.max(max, entry.count), 0),
    [chartGroups],
  );

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

  const tooltipCard = "rounded-lg border border-border bg-popover/95 p-3 text-xs text-popover-foreground shadow-floating backdrop-blur-md";

  return (
    <div className="w-full flex-1 space-y-6 text-foreground">
      {/* ------------------------------------------------------------- KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="New in 24h"
          value={last24hCount}
          hint="reports submitted today"
          icon={Clock}
        />
        <StatTile
          label="Open issues"
          value={statusMetrics.open}
          hint="awaiting action"
          icon={ShieldAlert}
        />
        <StatTile
          label="In progress"
          value={statusMetrics.inProgress}
          hint="being addressed"
          icon={TrendingUp}
        />
        <StatTile
          label="Resolved"
          value={statusMetrics.resolved}
          hint={`${statusMetrics.resolutionRate}% of all reports`}
          icon={CheckCircle2}
          tone="success"
        />
      </div>

      {/* --------------------------------------------------- category filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="flex shrink-0 items-center gap-1.5 pr-2 text-xs font-semibold text-muted-foreground">
          <Layers className="h-4 w-4 text-primary" />
          Filter:
        </span>
        <button
          type="button"
          onClick={() => setSelectedCategory("all")}
          className={cn(
            "shrink-0 cursor-pointer whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
            selectedCategory === "all"
              ? "bg-primary text-primary-foreground shadow-soft"
              : "border border-border bg-card text-muted-foreground hover:text-foreground",
          )}
        >
          All Categories ({issues.length})
        </button>
        {categoryAnalytics.map((cat) => (
          <button
            key={cat.category}
            type="button"
            onClick={() => setSelectedCategory(cat.category)}
            className={cn(
              "flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
              selectedCategory === cat.category
                ? "bg-primary text-primary-foreground shadow-soft"
                : "border border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            <span
              style={{ color: cat.fill }}
              className="inline-flex items-center"
              aria-hidden="true"
            >
              <CategoryIcon category={cat.category} className="h-3.5 w-3.5" />
            </span>
            {cat.name} ({cat.count})
          </button>
        ))}
      </div>

      {/* --------------------------------------------------------- charts */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Report volume over time - one series, so no legend box. */}
        <Card className="xl:col-span-2">
          <CardHeader className="p-5 pb-2">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-semibold text-foreground">
                  Reports raised
                </CardTitle>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {trendTotal} report{trendTotal === 1 ? "" : "s"} in the last{" "}
                  {trendRange} days
                </p>
              </div>
              <div className="flex rounded-lg bg-muted p-0.5">
                {TREND_RANGES.map((range) => (
                  <button
                    key={range}
                    type="button"
                    onClick={() => setTrendRange(range)}
                    className={cn(
                      "cursor-pointer rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                      trendRange === range
                        ? "bg-card text-foreground shadow-soft"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {range}d
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-5 pt-3">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={trend}
                  margin={{ top: 8, right: 8, left: -22, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="trend-fill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor={tokens.primary}
                        stopOpacity={0.28}
                      />
                      <stop
                        offset="100%"
                        stopColor={tokens.primary}
                        stopOpacity={0.02}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={tokens.grid}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: tokens.axis }}
                    tickLine={false}
                    axisLine={{ stroke: tokens.grid }}
                    minTickGap={24}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11, fill: tokens.axis }}
                    tickLine={false}
                    axisLine={false}
                    width={38}
                  />
                  <Tooltip
                    cursor={{ stroke: tokens.axis, strokeWidth: 1 }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      return (
                        <div className={cn(tooltipCard, "space-y-0.5")}>
                          <p className="font-semibold">{label}</p>
                          <p className="text-muted-foreground">
                            Reports raised:{" "}
                            <span className="font-bold text-foreground">
                              {payload[0].value}
                            </span>
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke={tokens.primary}
                    strokeWidth={2}
                    fill="url(#trend-fill)"
                    activeDot={{ r: 4, strokeWidth: 2, stroke: tokens.surface }}
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Status pipeline - an ordered scale, so one hue in stepped lightness. */}
        <Card>
          <CardHeader className="p-5 pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-semibold text-foreground">
              <span className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-primary" />
                Status pipeline
              </span>
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Where reports sit in the verification flow
            </p>
          </CardHeader>
          <CardContent className="space-y-2.5 p-5 pt-3">
            {statusPipeline.map((stage) => {
              const max = Math.max(
                ...statusPipeline.map((item) => item.count),
                1,
              );
              return (
                <div key={stage.status} className="space-y-1">
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-muted-foreground">{stage.label}</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {stage.count}
                      <span className="ml-1.5 font-normal text-muted-foreground">
                        {stage.sharePercentage}%
                      </span>
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${(stage.count / max) * 100}%`,
                        backgroundColor: stage.fill,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Category volume - one series, so every bar takes the same hue and
            the axis labels carry identity. The bars are the service groups,
            the same segmentation as the map and the ring below, so a group
            reads the same everywhere. Picking a category above emphasises
            the group it belongs to and lets the rest recede. */}
        <Card className="xl:col-span-2">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-semibold text-foreground">
              <span>Category volume</span>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Reports raised per service group
              {selectedCategory === "all"
                ? " - pick a category to highlight its group"
                : ` - ${CATEGORY_LABELS[selectedCategory]} is highlighted`}
            </p>
          </CardHeader>
          <CardContent className="p-5 pt-3">
            {chartGroups.length === 0 ? (
              <p className="flex h-72 items-center justify-center text-xs italic text-muted-foreground">
                No reports to chart yet.
              </p>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartGroups}
                    margin={{ top: 8, right: 8, left: -22, bottom: 4 }}
                    barCategoryGap="22%"
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={tokens.grid}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10, fill: tokens.axis }}
                      interval={0}
                      angle={-32}
                      textAnchor="end"
                      tickLine={false}
                      axisLine={{ stroke: tokens.grid }}
                      height={62}
                    />
                    <YAxis
                      allowDecimals={false}
                      domain={[0, Math.max(maxGroupCount, 1) * 1.15]}
                      tick={{ fontSize: 11, fill: tokens.axis }}
                      tickLine={false}
                      axisLine={false}
                      width={38}
                    />
                    <Tooltip
                      cursor={{ fill: tokens.cursor }}
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0].payload as {
                          label: string;
                          count: number;
                          sharePercentage: number;
                          categories: IssueCategory[];
                        };
                        return (
                          <div className={cn(tooltipCard, "space-y-1")}>
                            <p className="font-semibold">{data.label}</p>
                            <p className="text-muted-foreground">
                              Reports:{" "}
                              <span className="font-bold text-foreground">
                                {data.count}
                              </span>{" "}
                              ({data.sharePercentage}% of all)
                            </p>
                            <p className="text-muted-foreground">
                              {data.categories
                                .map(
                                  (category: IssueCategory) =>
                                    CATEGORY_SHORT_LABELS[category] ?? category,
                                )
                                .join(", ")}
                            </p>
                          </div>
                        );
                      }}
                    />
                    <Bar
                      dataKey="count"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={40}
                      stroke={tokens.surface}
                      strokeWidth={2}
                      fill={tokens.primary}
                    >
                      {chartGroups.map((entry) => (
                        <Cell
                          key={entry.key}
                          fill={tokens.primary}
                          opacity={
                            selectedCategory === "all" ||
                            entry.categories.includes(selectedCategory)
                              ? 1
                              : 0.3
                          }
                        />
                      ))}
                      {/* One direct label, on the largest bar - a number on
                          every bar would be noise, and the axis already
                          names each group. */}
                      <LabelList
                        dataKey="count"
                        content={(props) => {
                          const { x, y, width, value } = props as {
                            x?: number;
                            y?: number;
                            width?: number;
                            value?: number | string;
                          };
                          if (
                            maxGroupCount === 0 ||
                            Number(value) !== maxGroupCount
                          ) {
                            return null;
                          }
                          return (
                            <text
                              x={Number(x ?? 0) + Number(width ?? 0) / 2}
                              y={Number(y ?? 0) - 7}
                              textAnchor="middle"
                              fontSize={11}
                              fontWeight={600}
                              fill={tokens.ink}
                            >
                              {value}
                            </text>
                          );
                        }}
                      />
                    </Bar>
                </BarChart>
              </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category share - part to whole. Every segment carries a label and
            a legend entry, so no meaning rests on colour alone. */}
        <Card>
          <CardHeader className="p-5 pb-2">
            <CardTitle className="flex items-center justify-between text-sm font-semibold text-foreground">
              <span>Category share</span>
              <PieIcon className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Share of all reports by service group
              {otherCount > 0
                ? ` - ${otherCount} other report${otherCount === 1 ? "" : "s"} counted separately`
                : ""}
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center p-5 pt-2">
            {chartGroups.length === 0 ? (
              <p className="flex h-56 items-center justify-center text-xs italic text-muted-foreground">
                No reports to chart yet.
              </p>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartGroups}
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={82}
                      paddingAngle={2}
                      dataKey="count"
                      stroke={tokens.surface}
                      strokeWidth={2}
                    >
                      {chartGroups.map((entry) => (
                        <Cell
                          key={entry.key}
                          fill={entry.fill}
                          /* The residual "other" segment is a surface tone, not
                             a sixth hue - it has to read as a segment rather
                             than as a gap in the ring, so it gets an edge. */
                          stroke={
                            entry.key === "other"
                              ? tokens.border
                              : tokens.surface
                          }
                          strokeWidth={entry.key === "other" ? 1.5 : 2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.length) return null;
                        const data = payload[0].payload;
                        return (
                          <div className={cn(tooltipCard, "space-y-0.5")}>
                            <p className="font-semibold">{data.label}</p>
                            <p className="text-muted-foreground">
                              {data.count} reports ({data.sharePercentage}%)
                            </p>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="grid w-full grid-cols-2 gap-x-3 gap-y-1.5 border-t border-border pt-3 text-[11px]">
              {chartGroups.map((group) => (
                <div
                  key={group.key}
                  className="flex min-w-0 items-center gap-1.5"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm ring-1 ring-inset ring-border-strong/60"
                    style={{ backgroundColor: group.fill }}
                    aria-hidden="true"
                  />
                  <span className="truncate text-muted-foreground">
                    {group.label}
                  </span>
                  <span className="ml-auto font-semibold tabular-nums text-foreground">
                    {group.sharePercentage}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ------------------------------------------- category performance */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Category performance
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categoryAnalytics.map((cat) => {
            const isSelected = selectedCategory === cat.category;
            return (
              <Card
                key={cat.category}
                onClick={() =>
                  setSelectedCategory(isSelected ? "all" : cat.category)
                }
                className={cn(
                  "cursor-pointer transition-all",
                  isSelected
                    ? "border-primary ring-1 ring-primary/30 shadow-lifted"
                    : "hover:border-border-strong hover:shadow-lifted",
                )}
              >
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: `color-mix(in oklab, ${cat.fill} 16%, transparent)`,
                          color: cat.fill,
                        }}
                        aria-hidden="true"
                      >
                        <CategoryIcon
                          category={cat.category}
                          className="h-3.5 w-3.5"
                        />
                      </span>
                      <CardTitle className="truncate text-xs font-semibold text-foreground">
                        {cat.name}
                      </CardTitle>
                    </div>
                    <Badge
                      variant="outline"
                      className="shrink-0 border-border bg-muted/60 text-[10px] text-muted-foreground"
                    >
                      {cat.count}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 p-4 pt-1">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground">
                        Resolution rate
                      </span>
                      <span className="font-semibold tabular-nums text-foreground">
                        {cat.resolutionRate}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${cat.resolutionRate}%`,
                          backgroundColor: cat.fill,
                        }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-1 border-t border-border pt-2 text-center text-[10px]">
                    <div className="rounded-md bg-muted px-1 py-1">
                      <div className="font-semibold tabular-nums text-foreground">
                        {cat.open}
                      </div>
                      <div className="text-muted-foreground">Open</div>
                    </div>
                    <div className="rounded-md bg-muted px-1 py-1">
                      <div className="font-semibold tabular-nums text-foreground">
                        {cat.inProgress}
                      </div>
                      <div className="text-muted-foreground">Progress</div>
                    </div>
                    <div className="rounded-md bg-muted px-1 py-1">
                      <div className="font-semibold tabular-nums text-foreground">
                        {cat.resolved}
                      </div>
                      <div className="text-muted-foreground">Fixed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ---------------------------------------------- recent reports grid */}
      <Card>
        <CardHeader className="border-b border-border p-5 pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              {selectedCategory === "all"
                ? "Recent reports"
                : `${CATEGORY_LABELS[selectedCategory]} reports`}
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              Showing {recentIssues.length} of{" "}
              {selectedCategory === "all"
                ? issues.length
                : categoryAnalytics.find((c) => c.category === selectedCategory)
                    ?.count ?? 0}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {recentIssues.length === 0 ? (
            <p className="py-6 text-center text-xs italic text-muted-foreground">
              No reports found for this category filter.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {recentIssues.map((issue) => (
                <div
                  key={issue.id}
                  className="flex flex-col justify-between space-y-2 rounded-lg border border-border bg-surface-raised/50 p-3.5 transition-colors hover:border-border-strong"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-semibold"
                        style={{
                          backgroundColor: `color-mix(in oklab, ${CATEGORY_COLORS[issue.category]} 14%, transparent)`,
                          color: CATEGORY_COLORS[issue.category],
                        }}
                      >
                        <CategoryIcon
                          category={issue.category}
                          className="h-2.5 w-2.5"
                        />
                        {CATEGORY_SHORT_LABELS[issue.category]}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {relativeTime(issue.created_at)}
                      </span>
                    </div>
                    <p className="line-clamp-2 text-xs font-medium leading-snug text-foreground">
                      {issue.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-2 text-[11px]">
                    <span className="text-[10px] capitalize text-muted-foreground">
                      {issue.status.replace("_", " ")}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDetailClick(issue.id)}
                      className="group inline-flex cursor-pointer items-center gap-1 font-semibold text-primary hover:underline"
                    >
                      Details
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
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

// ------------------------------------------------------------------ stat tile

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  hint: string;
  icon: typeof Activity;
  tone?: "default" | "success";
}) {
  return (
    <Card className="gap-0 py-4 transition-shadow hover:shadow-lifted">
      <CardHeader className="p-4 pb-1">
        <CardTitle className="flex items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          <span className="truncate">{label}</span>
          <span
            className={cn(
              "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
              tone === "success"
                ? "bg-success/10 text-success"
                : "bg-primary/10 text-primary",
            )}
            aria-hidden="true"
          >
            <Icon className="h-4 w-4" />
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-1">
        <div className="text-3xl font-bold tracking-tight tabular-nums text-foreground">
          {value}
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}
