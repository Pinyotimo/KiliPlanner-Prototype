import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function reply(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...headers, "Content-Type": "application/json" } });
}

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

  const { issueId, captchaToken } = await request.json() as { issueId?: string; captchaToken?: string | null };
  if (!issueId) return reply({ error: "Issue is required." }, 400);
  const { data: resident } = await admin.from("resident_identities").select("id, verification_status, suspended_until").eq("user_id", userData.user.id).maybeSingle();
  if (!resident || resident.verification_status !== "verified") return reply({ error: "Phone verification is required to endorse reports." }, 403);
  if (resident.suspended_until && new Date(resident.suspended_until).getTime() > Date.now()) return reply({ error: "Resident account is suspended." }, 403);

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin.from("trust_action_events").select("id", { count: "exact", head: true }).eq("resident_id", resident.id).eq("action_type", "ENDORSEMENT").neq("outcome", "rejected").gte("created_at", since);
  if ((count ?? 0) >= 20) return reply({ error: "Daily endorsement quota exceeded." }, 429);

  const burstSince = new Date(Date.now() - 30 * 1000).toISOString();
  const { count: burstCount } = await admin
    .from("trust_action_events")
    .select("id", { count: "exact", head: true })
    .eq("action_type", "ENDORSEMENT")
    .eq("reference_id", issueId)
    .neq("outcome", "rejected")
    .gte("created_at", burstSince);
  const endorsementBurst = (burstCount ?? 0) >= 5;

  const { error: voteError } = await admin.from("issue_upvotes").insert({ issue_id: issueId, resident_id: resident.id });
  if (voteError) return reply({ error: voteError.code === "23505" ? "You have already endorsed this report." : "Unable to endorse report." }, 409);
  const { count: endorsements } = await admin.from("issue_upvotes").select("id", { count: "exact", head: true }).eq("issue_id", issueId);
  await admin.from("trust_action_events").insert({ resident_id: resident.id, action_type: "ENDORSEMENT", outcome: endorsementBurst ? "flagged" : "accepted", reference_id: issueId });
  if (endorsementBurst) {
    await admin.from("trust_risk_flags").insert({ resident_id: resident.id, action_type: "ENDORSEMENT", flag_type: "COORDINATION_RISK", risk_score: 75, metadata: { issueId, burstCount: (burstCount ?? 0) + 1, window: "30s" } });
    await admin.from("anomaly_events").insert({ resident_id: resident.id, action_type: "ENDORSEMENT", anomaly_type: "ENDORSEMENT_BURST", risk_score: 75, metadata: { issueId, burstCount: (burstCount ?? 0) + 1, window: "30s" } });
  }
  return reply({ endorsements: endorsements ?? 0 });
});