import { supabase } from "../../../lib/supabaseClient";

export async function deleteIssue(issueId: string) {
  const { error } = await supabase.from("issues").delete().eq("id", issueId);

  if (error) throw error;
}