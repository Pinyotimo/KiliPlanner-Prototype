import { supabase } from "../../../lib/supabaseClient";
import type { Issue } from "../../../types/issue";

export async function editIssue(issueId: string, updates: Partial<Issue>) {
  const { error } = await supabase
    .from("issues")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", issueId);

  if (error) throw error;
}
