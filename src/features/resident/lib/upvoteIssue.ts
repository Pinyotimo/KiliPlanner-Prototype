import { supabase } from "../../../lib/supabaseClient";

export async function upvoteIssue(issueId: string) {
  const { error } = await supabase.functions.invoke("endorse-issue", {
    body: { issueId },
  });
  if (error) throw error;
}