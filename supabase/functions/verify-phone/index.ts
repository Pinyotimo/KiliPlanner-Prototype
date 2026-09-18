import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type RequestBody = {
  action: "request" | "verify";
  phone: string;
  token?: string;
  deviceIdentifier?: string;
  deviceType?: "web" | "ios" | "android" | "unknown";
};

type ResidentVerificationStatus = "pending" | "verified" | "suspended" | "revoked";

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function normalizePhone(phone: string): string {
  const normalized = phone.trim().replace(/[\s().-]/g, "");
  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    throw new Error("Phone must be an E.164 number.");
  }
  return normalized;
}

async function hmac(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return response({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const phoneHashSecret = Deno.env.get("PHONE_HASH_SECRET");
  if (!supabaseUrl || !serviceRoleKey || !phoneHashSecret) {
    return response({ error: "Server is not configured for phone verification." }, 500);
  }

  try {
    const body = (await request.json()) as RequestBody;
    const normalizedPhone = normalizePhone(body.phone);
    const authClient = createClient(supabaseUrl, serviceRoleKey);

    if (body.action === "request") {
      const { error } = await authClient.auth.signInWithOtp({
        phone: normalizedPhone,
      });
      if (error) return response({ error: "Unable to request verification code." }, 400);
      return response({ ok: true, authState: "OTP_PENDING" });
    }

    if (body.action !== "verify" || !body.token || !/^\d{4,8}$/.test(body.token)) {
      return response({ error: "A valid verification code is required." }, 400);
    }

    const { data: authData, error: verifyError } = await authClient.auth.verifyOtp({
      phone: normalizedPhone,
      token: body.token,
      type: "sms",
    });
    if (verifyError || !authData.user) {
      return response({ error: "The verification code is invalid or expired." }, 400);
    }

    const phoneHash = await hmac(`phone:${normalizedPhone}`, phoneHashSecret);
    const { data: existingResident } = await authClient
      .from("resident_identities")
      .select("verification_status, suspended_until")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    const existingStatus = existingResident?.verification_status as ResidentVerificationStatus | undefined;
    const isSuspended = existingStatus === "suspended" && existingResident?.suspended_until
      ? new Date(existingResident.suspended_until).getTime() > Date.now()
      : existingStatus === "suspended";
    if (isSuspended) {
      return response({
        authState: "SUSPENDED",
        error: "This resident account is suspended.",
      }, 403);
    }

    const { data: resident, error: residentError } = await authClient
      .from("resident_identities")
      .upsert(
        {
          user_id: authData.user.id,
          phone_hash: phoneHash,
          verification_status: "verified",
          last_verified_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )
      .select("id, verification_status, risk_level, suspended_until")
      .single();
    if (residentError || !resident) {
      return response({ error: "Unable to create resident identity." }, 500);
    }

    if (body.deviceIdentifier) {
      if (body.deviceIdentifier.length > 256) {
        return response({ error: "Device identifier is too long." }, 400);
      }
      const deviceIdentifier = await hmac(
        `device:${body.deviceIdentifier}`,
        phoneHashSecret,
      );
      await authClient.from("resident_devices").upsert(
        {
          resident_id: resident.id,
          device_identifier: deviceIdentifier,
          device_type: body.deviceType ?? "unknown",
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "resident_id,device_identifier" },
      );
    }

    return response({
      resident: {
        verificationStatus: resident.verification_status,
        riskLevel: resident.risk_level,
        suspendedUntil: resident.suspended_until,
      },
      authState: "VERIFIED_RESIDENT",
      publicIdentity: "anonymous",
      session: authData.session,
    });
  } catch (error) {
    console.error("Phone verification failed", error);
    return response({ error: "Invalid phone verification request." }, 400);
  }
});