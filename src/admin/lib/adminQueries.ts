import { supabase } from "../../lib/supabaseClient";
import type { Issue, IssueCategory, IssueStatus } from "../../types/issue";

export type AdminIssuePageQuery = {
  searchTerm: string;
  category: IssueCategory | "all";
  status: IssueStatus | "all";
  dateRange: "all" | "today" | "7d" | "30d";
  sort: "newest" | "oldest";
  page: number;
  pageSize: number;
  refreshKey?: number;
};

export async function getAdminIssues(): Promise<{ data: Issue[] | null; error: string | null }> {
  const { data, error } = await supabase.from("issues").select("*").order("created_at", { ascending: false });
  return { data: data as Issue[] | null, error: error?.message ?? null };
}

export async function getAdminIssueById(id: string): Promise<{ data: Issue | null; error: string | null }> {
  const { data, error } = await supabase.from("issues").select("*").eq("id", id).maybeSingle();
  return { data: data as Issue | null, error: error?.message ?? null };
}

export async function getAdminIssuesPage(query: AdminIssuePageQuery) {
  let request = supabase.from("issues").select("*", { count: "exact" });
  if (query.category !== "all") request = request.eq("category", query.category);
  if (query.status !== "all") request = request.eq("status", query.status);
  if (query.dateRange !== "all") {
    const start = query.dateRange === "today" ? new Date(new Date().setHours(0, 0, 0, 0)) : new Date(Date.now() - (query.dateRange === "7d" ? 7 : 30) * 86400000);
    request = request.gte("created_at", start.toISOString());
  }
  const search = query.searchTerm.trim().replace(/[,%()]/g, " ");
  if (search) request = request.or(`id.ilike.%${search}%,category.ilike.%${search}%,description.ilike.%${search}%,address.ilike.%${search}%,reporter_name.ilike.%${search}%,reporter_email.ilike.%${search}%`);
  return request.order("created_at", { ascending: query.sort === "oldest" }).range((query.page - 1) * query.pageSize, query.page * query.pageSize - 1);
}

export async function updateAdminIssueStatus(id: string, status: IssueStatus) {
  return supabase.from("issues").update({ status }).eq("id", id);
}

export function getAdminStats(issues: Issue[]) {
  return { total: issues.length, open: issues.filter((issue) => issue.status === "open").length, resolved: issues.filter((issue) => issue.status === "resolved").length };
}
