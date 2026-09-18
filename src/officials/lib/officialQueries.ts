import { supabase } from "@/lib/supabaseClient";
import type { Issue } from "@/types/issue";
import type { IssueStatus } from "@/types/issue";

// Fetch issues assigned to a specific official or department
export async function getAssignedIssues(officialId?: string) {
  let query = supabase
    .from("issues")
    .select("*")
    .order("created_at", { ascending: false });

  if (officialId) {
    // query = query.eq("assigned_to", officialId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching assigned issues:", error);
    throw error;
  }

  return data as Issue[];
}

// Update status and optional official notes for an issue
export async function updateIssueStatus(
  issueId: string | number,
  status: IssueStatus | "open" | "in_progress" | "resolved" | "closed",
  officialNotes?: string,
) {
  const { data: issue, error: issueLookupError } = await supabase
    .from("issues")
    .select("category")
    .eq("id", issueId)
    .single();

  if (issueLookupError) throw issueLookupError;

  if (issue?.category === "green_project") {
    throw new Error(
      "Green Pin project statuses cannot be changed by officials.",
    );
  }

  const { data, error } = await supabase
    .from("issues")
    .update({
      status,
      official_notes: officialNotes ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", issueId)
    .select()
    .single();

  if (error) {
    console.error("Error updating issue status:", error.message, error.details);
    throw error;
  }

  return data as Issue | null;
}

// Add an official update comment to the issue
export async function addOfficialComment(
  issueId: string | number,
  authorId: string,
  commentText: string,
) {
  const { data, error } = await supabase
    .from("comments")
    .insert([
      {
        issue_id: issueId,
        user_id: authorId,
        content: commentText,
        is_official: true,
        created_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    console.error(
      "Error adding official comment:",
      error.message,
      error.details,
    );
    throw error;
  }

  return data;
}