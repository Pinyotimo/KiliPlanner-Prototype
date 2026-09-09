import { useEffect, useState } from "react";
import type { Issue } from "../../types/issue";
import { getAdminIssuesPage, type AdminIssuePageQuery } from "./adminQueries";

export function usePlannerIssues(query: AdminIssuePageQuery) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const { data, count, error } = await getAdminIssuesPage(query);
      if (error) {
        console.error("Failed to load planner issues:", error.message);
        if (active) setError("We could not load the issue list. Please check your connection and try again.");
      } else if (active) {
        setError(null);
      }
      if (active) {
        setIssues((data as Issue[] | null) ?? []);
        setTotal(count ?? 0);
        setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [query.searchTerm, query.category, query.status, query.dateRange, query.sort, query.page, query.pageSize, query.refreshKey]);

  return { issues, total, loading, error };
}