import React, { useEffect, useState, useMemo } from "react";
import {
  ShieldAlert,
  Layers,
  Clock3,
  CheckCircle2,
  AlertCircle,
  Bell,
  Inbox,
  ShieldCheck,
  Filter,
  Menu,
} from "lucide-react";
import { OfficialIssue, IssueStatus } from "../types/official";
import { getAssignedIssues } from "../lib/officialQueries";
import { updateOfficialIssueStatus } from "../lib/updateIssueStatus";
import { IssueStatusCard } from "../components/IssueStatusCard";
import OfficialSidebar from "../components/OfficialSidebar";
import { supabase } from "../../lib/supabaseClient";
import NotificationList from "../../components/NotificationList";
import type { Issue } from "../../types/issue";
import {
  getOfficialNotificationIds,
  setOfficialNotificationIds,
} from "../../lib/notificationStorage";
import { cn } from "@/lib/utils";
import { ThemeSwitcher } from "../../theme/ThemeSwitcher";

interface OfficialDashboardProps {
  officialId: string;
}

export const OfficialDashboard: React.FC<OfficialDashboardProps> = ({
  officialId,
}) => {
  const [issues, setIssues] = useState<OfficialIssue[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<"issues" | "notifications">(
    "issues",
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [newIssueNotifications, setNewIssueNotifications] = useState<
    OfficialIssue[]
  >([]);

  useEffect(() => {
    const storedIds = new Set(getOfficialNotificationIds());
    if (storedIds.size === 0) return;
    setNewIssueNotifications((current) =>
      issues.filter((issue) => storedIds.has(String(issue.id))),
    );
  }, [issues]);

  const fetchIssues = async () => {
    setLoading(true);
    try {
      const data = await getAssignedIssues(officialId);
      if (data && data.length > 0) {
        setIssues(data as OfficialIssue[]);
      } else {
        const { data: allData, error } = await supabase
          .from("issues")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && allData) {
          setIssues(allData as OfficialIssue[]);
        }
      }
    } catch (err) {
      console.error("Failed to load issues:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIssues();

    const handleLocalUpdate = (event: Event) => {
      const detail = (
        event as CustomEvent<{ id: string; status: OfficialIssue["status"] }>
      ).detail;
      setIssues((prev) =>
        prev.map((item) =>
          String(item.id) === String(detail.id)
            ? ({ ...item, status: detail.status } as OfficialIssue)
            : item,
        ),
      );
    };

    window.addEventListener("planner-issue-updated", handleLocalUpdate);

    const channel = supabase
      .channel("official-dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "issues" },
        (payload) => {
          const inserted = payload.new as OfficialIssue;
          setIssues((prev) =>
            prev.some((item) => String(item.id) === String(inserted.id))
              ? prev
              : [inserted, ...prev],
          );
          setNewIssueNotifications((prev) => {
            const next = prev.some(
              (item) => String(item.id) === String(inserted.id),
            )
              ? prev
              : [inserted, ...prev].slice(0, 20);
            setOfficialNotificationIds(next.map((item) => String(item.id)));
            return next;
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "issues" },
        (payload) => {
          const updated = payload.new as OfficialIssue;
          setIssues((prev) =>
            prev.map((item) =>
              String(item.id) === String(updated.id)
                ? {
                    ...item,
                    ...updated,
                    photo_base64: updated.photo_base64 ?? item.photo_base64,
                    photo_url:
                      (updated as any).photo_url ?? (item as any).photo_url,
                  }
                : item,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      window.removeEventListener("planner-issue-updated", handleLocalUpdate);
      supabase.removeChannel(channel);
    };
  }, [officialId]);

  const handleStatusUpdate = async (
    issueId: string,
    status: IssueStatus,
    notes: string,
  ) => {
    const issue = issues.find((item) => String(item.id) === String(issueId));
    if (issue?.category === "green_project") {
      return;
    }

    try {
      await updateOfficialIssueStatus(issueId, status, notes);

      setIssues((prevIssues) =>
        prevIssues.map((item) =>
          String(item.id) === String(issueId)
            ? ({ ...item, status, official_notes: notes } as OfficialIssue)
            : item,
        ),
      );

      window.dispatchEvent(
        new CustomEvent("planner-issue-updated", {
          detail: { id: issueId, status },
        }),
      );
    } catch (err) {
      console.error("Failed to update issue:", err);
      alert(
        "Failed to update status in database. Please verify RLS permissions.",
      );
    }
  };

  const sortedAndFilteredIssues = useMemo(() => {
    const filtered = issues.filter((issue) => {
      if (filter === "all") return true;
      if (filter === "security") {
        return issue.is_security_alert || issue.category === "security";
      }
      return issue.status === filter;
    });

    return [...filtered].sort((a, b) => {
      const aIsSec = a.is_security_alert || a.category === "security";
      const bIsSec = b.is_security_alert || b.category === "security";
      if (aIsSec && !bIsSec) return -1;
      if (!aIsSec && bIsSec) return 1;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [issues, filter]);

  const countByStatus = (status: string) =>
    issues.filter((i) => i.status === status).length;

  const countSecurity = issues.filter(
    (i) => i.is_security_alert || i.category === "security",
  ).length;

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <OfficialSidebar
        activeView={activeView}
        onSelectView={setActiveView}
        issueCount={issues.length}
        unreadCount={newIssueNotifications.length}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <div
        id="officials-content"
        tabIndex={-1}
        className="min-w-0 flex-1 focus:outline-none"
      >
        <div className="mx-auto max-w-6xl space-y-6 p-4 pb-24 sm:p-6">
        {/* Executive header */}
        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5 shadow-soft md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="cursor-pointer rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:hidden"
              aria-label="Open official navigation"
              title="Open official navigation"
            >
              <Menu className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
              <ShieldCheck className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Official Workstation
              </h1>
              <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
                Manage, triage, and resolve infrastructure reports assigned to
                your department.
              </p>
            </div>
          </div>

          {/* View toggle */}
          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex items-center gap-1 rounded-xl border border-border bg-muted/60 p-1"
              role="tablist"
              aria-label="Dashboard view"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeView === "issues"}
                onClick={() => setActiveView("issues")}
                className={cn(
                  "relative flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all",
                  activeView === "issues"
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Layers className="h-4 w-4" aria-hidden="true" />
                <span>Issues ({issues.length})</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeView === "notifications"}
                onClick={() => setActiveView("notifications")}
                className={cn(
                  "relative flex cursor-pointer items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all",
                  activeView === "notifications"
                    ? "bg-card text-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Bell className="h-4 w-4" aria-hidden="true" />
                <span>Notifications</span>
                {newIssueNotifications.length > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground">
                    {newIssueNotifications.length > 9
                      ? "9+"
                      : newIssueNotifications.length}
                  </span>
                )}
              </button>
            </div>
            <ThemeSwitcher />
          </div>
        </div>

        {activeView === "notifications" ? (
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <NotificationList
              issues={issues as unknown as Issue[]}
              unreadIssueIds={newIssueNotifications.map((issue) => issue.id)}
              onIssueSelect={(issueId) => {
                setNewIssueNotifications((current) => {
                  const next = current.filter(
                    (issue) => String(issue.id) !== String(issueId),
                  );
                  setOfficialNotificationIds(next.map((issue) => String(issue.id)));
                  return next;
                });
                setActiveView("issues");
              }}
              onMarkAllRead={() => {
                setNewIssueNotifications([]);
                setOfficialNotificationIds([]);
              }}
              emptyMessage="No infrastructure reports have been submitted yet."
            />
          </div>
        ) : (
          <>
            {/* Metrics row. Every tile names its state, so the tone colour is
                a supporting cue rather than the only signal. */}
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
              <MetricTile
                label="Total Assigned"
                value={issues.length}
                icon={<Layers className="h-4 w-4" aria-hidden="true" />}
                tone="neutral"
              />
              <MetricTile
                label="Security Alerts"
                value={countSecurity}
                icon={<ShieldAlert className="h-4 w-4" aria-hidden="true" />}
                tone="danger"
              />
              <MetricTile
                label="Open Reports"
                value={countByStatus("open")}
                icon={<Clock3 className="h-4 w-4" aria-hidden="true" />}
                tone="warning"
              />
              <MetricTile
                label="In Progress"
                value={countByStatus("in_progress")}
                icon={<AlertCircle className="h-4 w-4" aria-hidden="true" />}
                tone="primary"
              />
              <MetricTile
                label="Resolved"
                value={countByStatus("resolved")}
                icon={<CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                tone="success"
                className="col-span-2 sm:col-span-1"
              />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-2 overflow-x-auto rounded-xl border border-border bg-card p-3 shadow-soft scrollbar-none">
              <div className="flex shrink-0 items-center gap-1.5 px-2 text-xs font-semibold text-muted-foreground">
                <Filter className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Filter Status:</span>
              </div>
              {[
                "all",
                "security",
                "open",
                "in_progress",
                "resolved",
                "closed",
              ].map((statusKey) => {
                const isSelected = filter === statusKey;
                const isSecTab = statusKey === "security";
                return (
                  <button
                    key={statusKey}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setFilter(statusKey)}
                    className={cn(
                      "shrink-0 cursor-pointer whitespace-nowrap rounded-full px-3.5 py-1.5 text-xs font-semibold capitalize transition-all",
                      isSelected
                        ? isSecTab
                          ? "bg-destructive text-destructive-foreground shadow-soft"
                          : "bg-primary text-primary-foreground shadow-soft"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {isSecTab ? "Security Only" : statusKey.replace("_", " ")}
                  </button>
                );
              })}
            </div>

            {/* Issue cards */}
            {loading ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card py-20">
                <div className="mb-3 h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                <p className="text-sm font-medium text-muted-foreground">
                  Loading assigned issues...
                </p>
              </div>
            ) : sortedAndFilteredIssues.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-20 text-center">
                <div className="mb-3 rounded-full bg-muted p-4 text-muted-foreground">
                  <Inbox className="h-8 w-8" aria-hidden="true" />
                </div>
                <h3 className="mb-1 text-base font-semibold text-foreground">
                  No matching reports found
                </h3>
                <p className="text-xs text-muted-foreground">
                  There are no reports matching your selected filter parameters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {sortedAndFilteredIssues.map((issue) => (
                  <IssueStatusCard
                    key={issue.id}
                    issue={issue}
                    onUpdateStatus={handleStatusUpdate}
                  />
                ))}
              </div>
            )}
          </>
        )}
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------------ metric tile

type MetricTone = "neutral" | "primary" | "success" | "warning" | "danger";

const metricToneClasses: Record<MetricTone, string> = {
  neutral: "bg-muted text-foreground",
  primary: "bg-primary text-primary-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  danger: "bg-destructive text-destructive-foreground",
};

const metricSurfaceClasses: Record<MetricTone, string> = {
  neutral: "border-border bg-card",
  primary: "border-border bg-card",
  success: "border-border bg-card",
  warning: "border-border bg-card",
  danger: "border-destructive/30 bg-destructive/5",
};

function MetricTile({
  label,
  value,
  icon,
  tone,
  className,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: MetricTone;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-xl border p-4 shadow-soft",
        metricSurfaceClasses[tone],
        className,
      )}
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-1 text-xl font-bold tabular-nums text-foreground sm:text-2xl">
          {value}
        </p>
      </div>
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          metricToneClasses[tone],
        )}
        aria-hidden="true"
      >
        {icon}
      </div>
    </div>
  );
}
