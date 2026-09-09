import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { Issue, IssueCategory, IssueStatus } from "../types/issue";

export function useIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus | "all">("all");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchIssues = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data, error: supabaseError } = await supabase
      .from("issues")
      .select("*")
      .order("created_at", { ascending: false });

    if (supabaseError) {
      console.error("Error fetching issues:", supabaseError);
      setError(supabaseError.message);
    } else {
      setIssues(data as Issue[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchIssues();

    // Subscribe to live database updates
    const channel = supabase
      .channel("realtime-issues")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "issues" },
        () => {
          fetchIssues();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchIssues]);

  const filteredIssues = issues.filter((issue) => {
    const matchesCategory = selectedCategory === "all" || issue.category === selectedCategory;
    const matchesStatus = selectedStatus === "all" || issue.status === selectedStatus;
    return matchesCategory && matchesStatus;
  });

  return {
    issues: filteredIssues,
    loading,
    error,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    refetch: fetchIssues,
  };
}