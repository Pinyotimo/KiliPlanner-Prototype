import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import { getAdminIssues } from "../admin/lib/adminQueries";
import type { Issue, IssueCategory, IssueStatus } from "../types/issue";

export function useIssues({ realtimeEnabled = true }: { realtimeEnabled?: boolean } = {}) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus | "all">("open");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const [realtimeVersion, setRealtimeVersion] = useState(0);
  const [newIssue, setNewIssue] = useState<Issue | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadIssues() {
      setLoading(true);
      const { data, error } = await getAdminIssues();

      if (error) {
        console.error("Failed to load issues:", error);
        if (isMounted) setError("We could not load infrastructure reports. Please check your connection and try again.");
      } else if (isMounted && data) {
        setIssues(data as Issue[]);
        setError(null);
        setLastUpdatedAt(new Date().toISOString());
      }
      if (isMounted) setLoading(false);
    }

    loadIssues();

    function handleLocalIssueUpdate(event: Event) {
      const detail = (event as CustomEvent<{ id: string; status: IssueStatus }>).detail;
      setIssues((current) => current.map((issue) => issue.id === detail.id ? { ...issue, status: detail.status } : issue));
      setLastUpdatedAt(new Date().toISOString());
      setRealtimeVersion((value) => value + 1);
    }
    window.addEventListener("planner-issue-updated", handleLocalIssueUpdate);

    if (!realtimeEnabled) {
      setRealtimeStatus("offline");
      return () => { isMounted = false; window.removeEventListener("planner-issue-updated", handleLocalIssueUpdate); };
    }

    const channel = supabase
      .channel("issues-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "issues" },
        (payload) => {
          const issue = payload.new as Issue;
          setIssues((current) => [issue, ...current]);
          setNewIssue(issue);
          setRealtimeVersion((value) => value + 1);
          setLastUpdatedAt(new Date().toISOString());
        }
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "issues" }, (payload) => {
        const issue = payload.new as Issue;
        setIssues((current) => current.map((item) => item.id === issue.id ? issue : item));
        setRealtimeVersion((value) => value + 1);
        setLastUpdatedAt(new Date().toISOString());
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setRealtimeStatus("live");
        else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") setRealtimeStatus("offline");
      });

    return () => {
      isMounted = false;
      window.removeEventListener("planner-issue-updated", handleLocalIssueUpdate);
      supabase.removeChannel(channel);
    };
  }, [realtimeEnabled, refreshVersion]);

  // Compute filtered issues list based on current selection
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchesCategory =
        selectedCategory === "all" || issue.category === selectedCategory;
      const matchesStatus =
        selectedStatus === "all" || issue.status === selectedStatus;
      return matchesCategory && matchesStatus;
    });
  }, [issues, selectedCategory, selectedStatus]);

  return {
    issues: filteredIssues,
    allIssues: issues,
    loading,
    error,
    realtimeStatus,
    realtimeVersion,
    newIssue,
    lastUpdatedAt,
    refreshing,
    refresh: () => {
      setRefreshing(true);
      setRefreshVersion((value) => value + 1);
      window.setTimeout(() => setRefreshing(false), 500);
    },
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
  };
}