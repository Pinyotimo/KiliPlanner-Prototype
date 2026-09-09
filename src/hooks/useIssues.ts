import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Issue, IssueCategory, IssueStatus } from "../types/issue";

interface UseIssuesOptions {
  realtimeEnabled?: boolean;
}

export function useIssues({ realtimeEnabled = true }: UseIssuesOptions = {}) {
  // State variables
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus | "all">("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [realtimeStatus, setRealtimeStatus] = useState<"connecting" | "live" | "offline">("connecting");
  const [realtimeVersion, setRealtimeVersion] = useState<number>(0);
  const [newIssue, setNewIssue] = useState<Issue | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [refreshVersion, setRefreshVersion] = useState<number>(0);

  // Initial fetch function
  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: supabaseError } = await supabase
      .from("issues")
      .select("*")
      .order("created_at", { ascending: false });

    if (supabaseError) {
      console.error("Error fetching issues:", supabaseError);
      setError("We could not load infrastructure reports. Please check your connection and try again.");
    } else if (data) {
      setIssues(data as Issue[]);
      setLastUpdatedAt(new Date().toISOString());
    }

    setLoading(false);
  }, []);

  // Fetch issues on mount and on explicit refresh trigger
  useEffect(() => {
    fetchIssues();
  }, [fetchIssues, refreshVersion]);

  // Handle local custom events and Supabase Realtime subscriptions
  useEffect(() => {
    function handleLocalIssueUpdate(event: Event) {
      const detail = (event as CustomEvent<{ id: string; status: IssueStatus }>).detail;
      setIssues((current) =>
        current.map((issue) => (issue.id === detail.id ? { ...issue, status: detail.status } : issue))
      );
      setLastUpdatedAt(new Date().toISOString());
      setRealtimeVersion((v) => v + 1);
    }

    window.addEventListener("planner-issue-updated", handleLocalIssueUpdate);

    if (!realtimeEnabled) {
      setRealtimeStatus("offline");
      return () => {
        window.removeEventListener("planner-issue-updated", handleLocalIssueUpdate);
      };
    }

    setRealtimeStatus("connecting");

    const channel = supabase
      .channel("realtime-issues")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "issues" },
        (payload) => {
          const inserted = payload.new as Issue;
          setIssues((current) => [inserted, ...current]);
          setNewIssue(inserted);
          setRealtimeVersion((v) => v + 1);
          setLastUpdatedAt(new Date().toISOString());
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "issues" },
        (payload) => {
          const updated = payload.new as Issue;
          setIssues((current) =>
            current.map((item) => (item.id === updated.id ? updated : item))
          );
          setRealtimeVersion((v) => v + 1);
          setLastUpdatedAt(new Date().toISOString());
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "issues" },
        (payload) => {
          const deleted = payload.old as { id: string };
          setIssues((current) => current.filter((item) => item.id !== deleted.id));
          setRealtimeVersion((v) => v + 1);
          setLastUpdatedAt(new Date().toISOString());
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setRealtimeStatus("live");
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setRealtimeStatus("offline");
        }
      });

    return () => {
      window.removeEventListener("planner-issue-updated", handleLocalIssueUpdate);
      supabase.removeChannel(channel);
    };
  }, [realtimeEnabled]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    setRefreshVersion((v) => v + 1);
    window.setTimeout(() => setRefreshing(false), 500);
  }, []);

  const filteredIssues = issues.filter((issue) => {
    const matchesCategory = selectedCategory === "all" || issue.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || issue.status === selectedStatus;
    return matchesCategory && matchesStatus;
  });

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
    refresh,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    refetch: fetchIssues,
  };
}