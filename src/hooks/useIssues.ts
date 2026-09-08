import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Issue, IssueCategory, IssueStatus } from "../types/issue";

export function useIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | "all">("all");
  const [selectedStatus, setSelectedStatus] = useState<IssueStatus | "all">("open");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function loadIssues() {
      setLoading(true);
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load issues:", error.message);
      } else if (isMounted && data) {
        setIssues(data as Issue[]);
      }
      if (isMounted) setLoading(false);
    }

    loadIssues();

    const channel = supabase
      .channel("issues-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "issues" },
        (payload) => {
          setIssues((current) => [payload.new as Issue, ...current]);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

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
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
  };
}