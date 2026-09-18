import React, { useEffect, useState, useMemo } from "react";
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
  const [activeView, setActiveView] = useState<"issues" | "notifications">(
    "issues",
  );
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

  // Filter and sort issues so security alerts are ALWAYS prioritized at the top
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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Official Workstation
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage and resolve issues assigned to your department.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveView("issues")}
            className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
              activeView === "issues"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            Issues
          </button>
          <button
            type="button"
            onClick={() => setActiveView("notifications")}
            className={`relative rounded-md px-3 py-2 text-xs font-semibold transition-colors ${
              activeView === "notifications"
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            Notifications
            {newIssueNotifications.length > 0 && (
              <span className="ml-2 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                {newIssueNotifications.length > 9
                  ? "9+"
                  : newIssueNotifications.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeView === "notifications" ? (
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
      ) : (
        <>
          {/* Metrics Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="p-4 bg-card border rounded-lg shadow-sm">
              <p className="text-xs text-muted-foreground font-medium">
                Total Assigned
              </p>
              <p className="text-2xl font-semibold text-foreground">
                {issues.length}
              </p>
            </div>
            <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg shadow-sm">
              <p className="text-xs text-destructive font-bold uppercase tracking-wider">
                🚨 Security Priority
              </p>
              <p className="text-2xl font-bold text-destructive">
                {countSecurity}
              </p>
            </div>
            <div className="p-4 bg-card border rounded-lg shadow-sm">
              <p className="text-xs text-accent-foreground font-medium">Open</p>
              <p className="text-2xl font-semibold text-accent-foreground">
                {countByStatus("open")}
              </p>
            </div>
            <div className="p-4 bg-card border rounded-lg shadow-sm">
              <p className="text-xs text-primary font-medium">In Progress</p>
              <p className="text-2xl font-semibold text-primary">
                {countByStatus("in_progress")}
              </p>
            </div>
            <div className="p-4 bg-card border rounded-lg shadow-sm">
              <p className="text-xs text-primary font-medium">Resolved</p>
              <p className="text-2xl font-semibold text-primary">
                {countByStatus("resolved")}
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-2 border-b border-border pb-2">
            {[
              "all",
              "security",
              "open",
              "in_progress",
              "resolved",
              "closed",
            ].map((statusKey) => (
              <button
                key={statusKey}
                onClick={() => setFilter(statusKey)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                  filter === statusKey
                    ? statusKey === "security"
                      ? "bg-destructive text-primary-foreground"
                      : "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {statusKey === "security"
                  ? "🚨 Security Only"
                  : statusKey.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Main Issue Cards Grid */}
          {loading ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              Loading assigned issues...
            </div>
          ) : sortedAndFilteredIssues.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              No issues found matching this filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
