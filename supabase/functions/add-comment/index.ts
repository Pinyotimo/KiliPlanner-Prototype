import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
function reply(body: Record<string, unknown>, status = 200) { return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } }); }

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return reply({ error: "Method not allowed" }, 405);
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization");
  if (!url || !key || !authorization?.startsWith("Bearer ")) return reply({ error: "Authentication required." }, 401);
  const admin = createClient(url, key);
  const client = createClient(url, key, { global: { headers: { Authorization: authorization } } });
  const { data: userData } = await client.auth.getUser();
  if (!userData.user) return reply({ error: "Authentication required." }, 401);
  const { issueId, content, authorName } = await request.json() as { issueId?: string; content?: string; authorName?: string };
  const cleanContent = content?.trim() ?? "";
  if (!issueId || cleanContent.length < 1 || cleanContent.length > 1000) return reply({ error: "Comment is invalid." }, 400);
  const { data: resident } = await admin.from("resident_identities").select("id, verification_status, suspended_until").eq("user_id", userData.user.id).maybeSingle();
  if (!resident || resident.verification_status !== "verified") return reply({ error: "Phone verification is required to comment." }, 403);
  if (resident.suspended_until && new Date(resident.suspended_until).getTime() > Date.now()) return reply({ error: "Resident account is suspended." }, 403);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin.from("trust_action_events").select("id", { count: "exact", head: true }).eq("resident_id", resident.id).eq("action_type", "COMMENT").neq("outcome", "rejected").gte("created_at", since);
  if ((count ?? 0) >= 20) return reply({ error: "Daily comment quota exceeded." }, 429);
  const { data: comment, error } = await admin.from("comments").insert({ issue_id: issueId, resident_id: resident.id, user_id: userData.user.id, author_name: authorName?.trim().slice(0, 100) || null, content: cleanContent }).select("id, issue_id, author_name, content, created_at, is_official").single();
  if (error) return reply({ error: "Unable to add comment." }, 400);
  await admin.from("trust_action_events").insert({ resident_id: resident.id, action_type: "COMMENT", outcome: "accepted", reference_id: comment.id });
  return reply({ comment }, 201);
});