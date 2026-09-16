import { supabase } from "../../../lib/supabaseClient";

export async function upvoteIssue(issueId: string, userIdentifier: string) {
  const { error } = await supabase
    .from("issue_upvotes")
    .insert({ issue_id: issueId, user_identifier: userIdentifier });

  if (error) throw error;

  const { data } = await supabase
    .from("issues")
    .select("upvotes")
    .eq("id", issueId)
    .single();

  await supabase
    .from("issues")
    .update({ upvotes: (data?.upvotes ?? 0) + 1 })
    .eq("id", issueId);
}