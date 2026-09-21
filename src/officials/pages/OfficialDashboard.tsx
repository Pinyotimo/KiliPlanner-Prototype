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
  Filter
} from "lucide-react";
import { OfficialIssue, IssueStatus } from "../types/official";
import { getAssignedIssues } from "../lib/officialQueries";
import { updateOfficialIssueStatus } from "../lib/updateIssueStatus";
import { IssueStatusCard } from "../components/IssueStatusCard";
import { supabase } from "../../lib/supabaseClient";
import NotificationList from "../../components/NotificationList";
import type { Issue } from "../../types/issue";
import {
  getOfficialNotificationIds,
  setOfficialNotificationIds,
} from "../../lib/notificationStorage";

interface OfficialDashboardProps {
  officialId: string;
}

export const OfficialDashboard: React.FC<OfficialDashboardProps> = ({
  officialId,
}) => {
  const [issues, setIssues] = useState<OfficialIssue[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<"issues" | "notifications">("issues");
  const [newIssueNotifications, setNewIssueNotifications] = useState<OfficialIssue[]>([]);

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
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-6 pb-24">
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl shadow-sm border border-border">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Official Workstation
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Manage, triage, and resolve infrastructure reports assigned to your department.
            </p>
          </div>
        </div>

        {/* View Toggle Tabs */}
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-xl border border-border/60">
          <button
            type="button"
            onClick={() => setActiveView("issues")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeView === "issues"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Issues ({issues.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView("notifications")}
            className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold transition-all cursor-pointer relative ${
              activeView === "notifications"
                ? "bg-background text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bell className="h-4 w-4" />
            <span>Notifications</span>
            {newIssueNotifications.length > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-bold text-destructive-foreground animate-pulse">
                {newIssueNotifications.length > 9 ? "9+" : newIssueNotifications.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeView === "notifications" ? (
        <div className="bg-card rounded-2xl border border-border p-5 shadow-sm">
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
          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="p-4 bg-card border border-border/80 rounded-xl shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-wider">Total Assigned</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{issues.length}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                <Layers className="h-4 w-4" />
              </div>
            </div>

            <div className="p-4 bg-destructive/5 border border-destructive/30 rounded-xl shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] text-destructive font-bold uppercase tracking-wider">Security Alerts</p>
                <p className="text-xl sm:text-2xl font-bold text-destructive mt-1">{countSecurity}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-destructive/10 flex items-center justify-center text-destructive animate-pulse">
                <ShieldAlert className="h-4 w-4" />
              </div>
            </div>

            <div className="p-4 bg-card border border-border/80 rounded-xl shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] text-amber-500 font-semibold uppercase tracking-wider">Open Reports</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{countByStatus("open")}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Clock3 className="h-4 w-4" />
              </div>
            </div>

            <div className="p-4 bg-card border border-border/80 rounded-xl shadow-xs flex items-center justify-between">
              <div>
                <p className="text-[11px] text-blue-500 font-semibold uppercase tracking-wider">In Progress</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{countByStatus("in_progress")}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                <AlertCircle className="h-4 w-4" />
              </div>
            </div>

            <div className="p-4 bg-card border border-border/80 rounded-xl shadow-xs flex items-center justify-between col-span-2 sm:col-span-1">
              <div>
                <p className="text-[11px] text-emerald-500 font-semibold uppercase tracking-wider">Resolved</p>
                <p className="text-xl sm:text-2xl font-bold text-foreground mt-1">{countByStatus("resolved")}</p>
              </div>
              <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
          </div>

          {/* Filter Bar Pills */}
          <div className="bg-card border border-border rounded-2xl p-3 shadow-xs flex items-center gap-2 overflow-x-auto scrollbar-none">
            <div className="flex items-center gap-1.5 text-muted-foreground font-semibold text-xs px-2 shrink-0">
              <Filter className="h-3.5 w-3.5" />
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
                  onClick={() => setFilter(statusKey)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-full capitalize transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? isSecTab
                        ? "bg-destructive text-destructive-foreground shadow-sm scale-105"
                        : "bg-primary text-primary-foreground shadow-sm scale-105"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {isSecTab ? "🚨 Security Only" : statusKey.replace("_", " ")}
                </button>
              );
            })}
          </div>

          {/* Main Issue Cards Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-border">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mb-3" />
              <p className="text-sm text-muted-foreground font-medium">Loading assigned issues...</p>
            </div>
          ) : sortedAndFilteredIssues.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-20 px-6 bg-card rounded-2xl border border-dashed border-border/80">
              <div className="p-4 rounded-full bg-muted text-muted-foreground mb-3">
                <Inbox className="h-8 w-8" />
              </div>
              <h3 className="font-semibold text-base mb-1">No matching reports found</h3>
              <p className="text-xs text-muted-foreground">There are no reports matching your selected filter parameters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
  );
};