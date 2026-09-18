import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const KILIMANI_BOUNDARY: [number, number][] = [
  [36.7725, -1.2858],
  [36.785, -1.281],
  [36.8042, -1.2885],
  [36.799, -1.304],
  [36.7812, -1.2995],
  [36.7725, -1.2858],
];

type ReportRequest = {
  category: string;
  description: string;
  subDetail?: string | null;
  address?: string | null;
  lat: number;
  lng: number;
  accuracyMeters?: number | null;
  evidence?: string | null;
  evidenceMimeType?: string | null;
  evidenceCaptureMode?: "camera" | "gallery" | null;
  evidenceCapturedAt?: string | null;
  evidenceCaptureLatitude?: number | null;
  evidenceCaptureLongitude?: number | null;
  evidenceLocationAccuracy?: number | null;
  userLat: number;
  userLng: number;
  userLocationAccuracy?: number | null;
  userLocationTimestamp?: string | null;
  deviceRiskSignal?: string | null;
  captchaToken?: string | null;
};

function reply(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isInsideBoundary(lat: number, lng: number): boolean {
  let inside = false;
  for (
    let index = 0, previous = KILIMANI_BOUNDARY.length - 1;
    index < KILIMANI_BOUNDARY.length;
    previous = index++
  ) {
    const [currentLng, currentLat] = KILIMANI_BOUNDARY[index];
    const [previousLng, previousLat] = KILIMANI_BOUNDARY[previous];
    const intersects =
      currentLat > lat !== previousLat > lat &&
      lng <
        ((previousLng - currentLng) * (lat - currentLat)) /
          (previousLat - currentLat) +
          currentLng;
    if (intersects) inside = !inside;
  }
  return inside;
}

function distanceInMeters(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const earthRadius = 6371000;
  const latitudeDelta = ((toLat - fromLat) * Math.PI) / 180;
  const longitudeDelta = ((toLng - fromLng) * Math.PI) / 180;
  const fromLatitude = (fromLat * Math.PI) / 180;
  const toLatitude = (toLat * Math.PI) / 180;
  const value =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function normalizeDescription(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function descriptionTokens(value: string): string[] {
  return normalizeDescription(value)
    .split(" ")
    .filter((token) => token.length >= 4);
}

function tokenSimilarity(left: string, right: string): number {
  const leftTokens = new Set(descriptionTokens(left));
  const rightTokens = new Set(descriptionTokens(right));
  if (leftTokens.size === 0 || rightTokens.size === 0) return 0;
  const intersection = [...leftTokens].filter((token) =>
    rightTokens.has(token),
  ).length;
  return intersection / new Set([...leftTokens, ...rightTokens]).size;
}

function repeatedKeywordCount(value: string): number {
  const counts = new Map<string, number>();
  for (const token of descriptionTokens(value))
    counts.set(token, (counts.get(token) ?? 0) + 1);
  return [...counts.values()].filter((count) => count >= 3).length;
}

function decodeEvidence(value: string): {
  bytes: Uint8Array;
  mimeType: string;
} {
  const match = value.match(
    /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/,
  );
  if (!match)
    throw new Error("Evidence must be a JPEG, PNG, or WebP data URL.");
  const binary = atob(match[2]);
  if (binary.length === 0 || binary.length > 10485760)
    throw new Error("Evidence exceeds the 10 MB limit.");
  return {
    bytes: Uint8Array.from(binary, (character) => character.charCodeAt(0)),
    mimeType: match[1],
  };
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

async function hashRiskSignal(value: string, secret: string): Promise<string> {
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

async function verifyCaptcha(
  token: string | null | undefined,
  request: Request,
): Promise<boolean> {
  const endpoint = Deno.env.get("CAPTCHA_VERIFY_URL");
  const secret = Deno.env.get("CAPTCHA_SECRET");
  if (!endpoint || !secret || !token) return false;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      secret,
      response: token,
      remoteip:
        request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "",
    }),
  });
  if (!response.ok) return false;
  const result = (await response.json()) as { success?: boolean };
  return result.success === true;
}

async function recordTrustAction(
  admin: ReturnType<typeof createClient>,
  values: Record<string, unknown>,
) {
  await admin.from("trust_action_events").insert(values);
}

async function recordAttempt(
  admin: ReturnType<typeof createClient>,
  residentId: string,
  outcome: "accepted" | "rejected",
  reason: string,
) {
  await admin
    .from("report_submission_attempts")
    .insert({ resident_id: residentId, outcome, reason });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST")
    return reply({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const signalSecret = Deno.env.get("DEVICE_SIGNAL_SECRET") ?? serviceRoleKey;
  if (!supabaseUrl || !serviceRoleKey)
    return reply({ error: "Server is not configured." }, 500);

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer "))
    return reply({ error: "Resident authentication is required." }, 401);

  const admin = createClient(supabaseUrl, serviceRoleKey);
  const userClient = createClient(supabaseUrl, serviceRoleKey, {
    global: { headers: { Authorization: authorization } },
  });

  try {
    const { data: userData, error: userError } =
      await userClient.auth.getUser();
    if (userError || !userData.user)
      return reply({ error: "Resident authentication is required." }, 401);

    const body = (await request.json()) as ReportRequest;
    if (
      !body.category ||
      body.description.trim().length < 5 ||
      body.description.trim().length > 280
    ) {
      return reply({ error: "Report fields are invalid." }, 400);
    }

    const { data: categoryPolicy } = await admin
      .from("report_categories")
      .select(
        "slug, requires_live_photo, requires_geofence, requires_admin_review, minimum_corrobation, allowed_radius_meters, impact_class",
      )
      .eq("slug", body.category)
      .eq("enabled", true)
      .maybeSingle();
    if (!categoryPolicy)
      return reply({ error: "This report category is unavailable." }, 400);

    const actionType =
      categoryPolicy.impact_class === "HIGH_IMPACT"
        ? "HIGH_IMPACT_REPORT"
        : "NORMAL_REPORT";

    const normalizedDescription = normalizeDescription(body.description);
    const reportLinks =
      body.description.match(/https?:\/\/|www\.|[a-z0-9.-]+\.[a-z]{2,}\b/gi) ??
      [];
    const keywordRepeatCount = repeatedKeywordCount(body.description);
    const { data: recentReports } = await admin
      .from("issues")
      .select("id, category, description, created_at")
      .gte(
        "created_at",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      )
      .order("created_at", { ascending: false })
      .limit(500);
    const duplicateReport = recentReports?.find(
      (report) =>
        normalizeDescription(report.description) === normalizedDescription,
    );
    const similarReport = recentReports?.find(
      (report) => tokenSimilarity(report.description, body.description) >= 0.8,
    );
    const crossCategoryCopy = Boolean(
      similarReport && similarReport.category !== body.category,
    );
    const contentAnomalySignals: string[] = [];
    if (duplicateReport || similarReport)
      contentAnomalySignals.push("CONTENT_DUPLICATE");
    if (keywordRepeatCount > 0) contentAnomalySignals.push("REPEATED_KEYWORDS");
    if (crossCategoryCopy) contentAnomalySignals.push("CROSS_CATEGORY_COPY");
    if (reportLinks.length > 2) contentAnomalySignals.push("EXCESSIVE_LINKS");
    if (
      /(.)\1{7,}|\b(?:buy now|free money|click here|crypto|casino)\b/i.test(
        body.description,
      )
    ) {
      contentAnomalySignals.push("SUSPICIOUS_TEXT");
    }

    if (
      categoryPolicy.requires_geofence &&
      (!Number.isFinite(body.lat) ||
        !Number.isFinite(body.lng) ||
        !isInsideBoundary(body.lat, body.lng))
    ) {
      return reply(
        { error: "The report location must be inside Kilimani Ward." },
        400,
      );
    }
    if (!Number.isFinite(body.userLat) || !Number.isFinite(body.userLng)) {
      return reply(
        { error: "A current resident GPS position is required." },
        400,
      );
    }
    if (
      categoryPolicy.requires_geofence &&
      body.accuracyMeters !== null &&
      body.accuracyMeters !== undefined &&
      (!Number.isFinite(body.accuracyMeters) || body.accuracyMeters > 100)
    ) {
      return reply(
        { error: "GPS accuracy is insufficient for this report." },
        400,
      );
    }
    if (categoryPolicy.requires_live_photo && !body.evidence) {
      return reply(
        { error: "A live photo is required for this report category." },
        400,
      );
    }
    if (
      categoryPolicy.requires_live_photo &&
      body.evidenceCaptureMode !== "camera"
    ) {
      return reply(
        { error: "Live evidence must be captured with the camera." },
        400,
      );
    }
    if (
      categoryPolicy.requires_live_photo &&
      (!body.evidenceCapturedAt ||
        Date.now() - new Date(body.evidenceCapturedAt).getTime() >
          15 * 60 * 1000)
    ) {
      return reply(
        { error: "Camera evidence has expired. Please capture a new photo." },
        400,
      );
    }

    const { data: resident } = await admin
      .from("resident_identities")
      .select("id, suspended_until, risk_level, created_at")
      .eq("user_id", userData.user.id)
      .maybeSingle();
    if (
      resident?.suspended_until &&
      new Date(resident.suspended_until).getTime() > Date.now()
    ) {
      await recordAttempt(admin, resident.id, "rejected", "suspended_resident");
      return reply({ error: "This resident account is suspended." }, 403);
    }

    const normalizedDeviceSignal =
      body.deviceRiskSignal?.trim().slice(0, 256) || null;
    const deviceRiskSignal = normalizedDeviceSignal
      ? await hashRiskSignal(normalizedDeviceSignal, signalSecret)
      : null;
    const networkInput = request.headers
      .get("x-forwarded-for")
      ?.split(",")[0]
      ?.trim();
    const networkRiskSignal = networkInput
      ? await hashRiskSignal(networkInput, signalSecret)
      : null;
    const quotaSince = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const quotaQuery = admin
      .from("trust_action_events")
      .select("id", { count: "exact", head: true })
      .eq("action_type", actionType)
      .neq("outcome", "rejected")
      .gte("created_at", quotaSince);
    const { count: residentActionCount } = resident
      ? await quotaQuery.eq("resident_id", resident.id)
      : { count: 0 };
    const actionLimit = actionType === "HIGH_IMPACT_REPORT" ? 1 : 5;
    if ((residentActionCount ?? 0) >= actionLimit) {
      if (resident) {
        await recordTrustAction(admin, {
          resident_id: resident.id,
          action_type: actionType,
          device_risk_signal: deviceRiskSignal,
          network_risk_signal: networkRiskSignal,
          outcome: "rejected",
        });
        await admin.from("trust_risk_flags").insert({
          resident_id: resident.id,
          action_type: actionType,
          flag_type: "RATE_LIMITED",
          risk_score: 70,
          metadata: { limit: actionLimit, window: "24h" },
        });
      }
      return reply(
        {
          error: `${actionType === "HIGH_IMPACT_REPORT" ? "High-impact" : "Normal"} report quota exceeded.`,
        },
        429,
      );
    }

    const recentSignalsQuery = admin
      .from("trust_action_events")
      .select(
        "id, resident_id, device_risk_signal, network_risk_signal, created_at",
      )
      .eq("action_type", actionType)
      .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());
    const { data: recentSignals } = await recentSignalsQuery;
    const velocityWindowStart = new Date(
      Date.now() - 10 * 60 * 1000,
    ).toISOString();
    const { count: residentVelocityCount } = resident
      ? await admin
          .from("trust_action_events")
          .select("id", { count: "exact", head: true })
          .eq("resident_id", resident.id)
          .eq("action_type", actionType)
          .neq("outcome", "rejected")
          .gte("created_at", velocityWindowStart)
      : { count: 0 };
    const newAccountVelocity = Boolean(
      resident &&
      Date.now() - new Date(resident.created_at).getTime() <= 60 * 60 * 1000,
    );
    const velocitySpike = (residentVelocityCount ?? 0) >= 3;
    const velocitySignals = [
      ...(velocitySpike ? ["VELOCITY_SPIKE"] : []),
      ...(newAccountVelocity ? ["NEW_ACCOUNT_VELOCITY"] : []),
    ];
    const coordinationRisk = Boolean(
      (deviceRiskSignal &&
        recentSignals?.some(
          (event) =>
            event.device_risk_signal === deviceRiskSignal &&
            event.resident_id !== resident?.id,
        )) ||
      (networkRiskSignal &&
        recentSignals?.filter(
          (event) => event.network_risk_signal === networkRiskSignal,
        ).length >= 3),
    );
    const coordinationAnomalySignals: string[] = [];
    if (
      deviceRiskSignal &&
      recentSignals?.some(
        (event) =>
          event.device_risk_signal === deviceRiskSignal &&
          event.resident_id !== resident?.id,
      )
    ) {
      coordinationAnomalySignals.push("SHARED_DEVICE_SIGNAL");
    }
    if (
      networkRiskSignal &&
      recentSignals?.filter(
        (event) =>
          event.network_risk_signal === networkRiskSignal &&
          event.resident_id !== resident?.id,
      ).length >= 3
    ) {
      coordinationAnomalySignals.push("SHARED_NETWORK_SIGNAL");
    }

    const distance = distanceInMeters(
      body.userLat,
      body.userLng,
      body.lat,
      body.lng,
    );
    const gpsAccuracy =
      body.userLocationAccuracy ?? body.accuracyMeters ?? null;
    const suspiciousSignals: string[] = [];
    const locationAnomalySignals: string[] = [];
    const { data: previousLocation } = resident
      ? await admin
          .from("location_verifications")
          .select("user_lat, user_lng, gps_accuracy, created_at")
          .eq("resident_id", resident.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null };
    if (previousLocation && body.userLocationTimestamp) {
      const elapsedSeconds =
        (new Date(body.userLocationTimestamp).getTime() -
          new Date(previousLocation.created_at).getTime()) /
        1000;
      const movement = distanceInMeters(
        previousLocation.user_lat,
        previousLocation.user_lng,
        body.userLat,
        body.userLng,
      );
      const speedMetersPerSecond =
        elapsedSeconds > 0
          ? movement / elapsedSeconds
          : Number.POSITIVE_INFINITY;
      if (speedMetersPerSecond > 55) {
        locationAnomalySignals.push("IMPOSSIBLE_TRAVEL");
        suspiciousSignals.push("IMPOSSIBLE_TRAVEL");
      }
      if (
        previousLocation.gps_accuracy !== null &&
        gpsAccuracy !== null &&
        Math.abs(gpsAccuracy - previousLocation.gps_accuracy) >= 75
      ) {
        locationAnomalySignals.push("GPS_ACCURACY_SHIFT");
        suspiciousSignals.push("GPS_ACCURACY_SHIFT");
      }
    }
    if (gpsAccuracy === null)
      suspiciousSignals.push("LOCATION_ACCURACY_UNAVAILABLE");
    if (
      gpsAccuracy !== null &&
      (!Number.isFinite(gpsAccuracy) || gpsAccuracy > 100)
    )
      suspiciousSignals.push("LOCATION_ACCURACY_ABNORMAL");
    if (body.userLocationTimestamp) {
      const timestampAge =
        Date.now() - new Date(body.userLocationTimestamp).getTime();
      if (
        !Number.isFinite(timestampAge) ||
        timestampAge < -60_000 ||
        timestampAge > 15 * 60_000
      )
        suspiciousSignals.push("LOCATION_TIMESTAMP_INCONSISTENT");
    } else {
      suspiciousSignals.push("LOCATION_TIMESTAMP_UNAVAILABLE");
    }
    if (distance > categoryPolicy.allowed_radius_meters)
      suspiciousSignals.push("OUTSIDE_ALLOWED_RADIUS");
    if (distance > categoryPolicy.allowed_radius_meters * 0.75) {
      locationAnomalySignals.push("REPORT_LOCATION_FAR");
      suspiciousSignals.push("REPORT_LOCATION_FAR");
    }

    const { data: repeatedLocations } = resident
      ? await admin
          .from("location_verifications")
          .select("report_lat, report_lng")
          .eq("resident_id", resident.id)
          .gte(
            "created_at",
            new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          )
          .limit(25)
      : { data: [] };
    if (
      repeatedLocations?.some(
        (location) =>
          distanceInMeters(
            location.report_lat,
            location.report_lng,
            body.lat,
            body.lng,
          ) <= 10,
      )
    ) {
      locationAnomalySignals.push("REPEATED_REPORT_LOCATION");
      suspiciousSignals.push("REPEATED_REPORT_LOCATION");
    }
    const { data: nearbyReports } = await admin
      .from("issues")
      .select("id, lat, lng")
      .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .neq("id", "00000000-0000-0000-0000-000000000000")
      .limit(100);
    const nearbyReportIds = (nearbyReports ?? [])
      .filter(
        (report) =>
          distanceInMeters(report.lat, report.lng, body.lat, body.lng) <= 25,
      )
      .map((report) => report.id);
    if (nearbyReportIds.length >= 3) {
      const { data: nearbyActions } = await admin
        .from("trust_action_events")
        .select("resident_id")
        .in("reference_id", nearbyReportIds)
        .neq(
          "resident_id",
          resident?.id ?? "00000000-0000-0000-0000-000000000000",
        );
      if (
        new Set(
          (nearbyActions ?? [])
            .map((event) => event.resident_id)
            .filter(Boolean),
        ).size >= 3
      ) {
        coordinationAnomalySignals.push("LOCATION_TARGETING_CLUSTER");
      }
    }
    if (crossCategoryCopy && similarReport) {
      const { data: wordingActions } = await admin
        .from("trust_action_events")
        .select("resident_id")
        .eq("reference_id", similarReport.id)
        .neq(
          "resident_id",
          resident?.id ?? "00000000-0000-0000-0000-000000000000",
        );
      if ((wordingActions ?? []).some((event) => event.resident_id))
        coordinationAnomalySignals.push("IDENTICAL_CROSS_ACCOUNT_WORDING");
    }

    const locationVerification = !categoryPolicy.requires_geofence
      ? "verified"
      : distance > categoryPolicy.allowed_radius_meters
        ? "failed"
        : gpsAccuracy !== null &&
            gpsAccuracy <=
              Math.min(100, categoryPolicy.allowed_radius_meters) &&
            suspiciousSignals.length === 0
          ? "verified"
          : "uncertain";
    if (categoryPolicy.requires_geofence && locationVerification === "failed") {
      return reply(
        { error: "Resident GPS is outside the allowed reporting radius." },
        400,
      );
    }
    const velocityScore = Math.min(
      100,
      velocitySignals.length * 35 + (residentVelocityCount ?? 0) * 10,
    );
    const locationScore = Math.min(
      100,
      locationAnomalySignals.length * 25 +
        suspiciousSignals.filter(
          (signal) =>
            signal.startsWith("LOCATION_") ||
            signal === "REPORT_LOCATION_FAR" ||
            signal === "OUTSIDE_ALLOWED_RADIUS",
        ).length *
          10 +
        (locationVerification === "uncertain" ? 20 : 0),
    );
    const contentScore = Math.min(100, contentAnomalySignals.length * 20);
    const evidenceScore = Math.min(
      100,
      (evidenceRecord?.evidenceAnomalySignals.length ?? 0) * 25 +
        (!body.evidence ? 15 : 0),
    );
    const coordinationScore = Math.min(
      100,
      (coordinationRisk ? 35 : 0) +
        (networkRiskSignal ? 5 : 0) +
        coordinationAnomalySignals.length * 20,
    );
    const behaviorRiskScore = Math.round(
      (velocityScore +
        locationScore +
        contentScore +
        evidenceScore +
        coordinationScore) /
        5,
    );
    const riskScore = Math.min(
      100,
      Math.round(
        (velocityScore +
          locationScore +
          contentScore +
          evidenceScore +
          coordinationScore) /
          5,
      ),
    );
    const riskAction =
      riskScore >= 85
        ? "TEMPORARY_SUSPENSION_RECOMMENDED"
        : riskScore >= 70
          ? "CAPTCHA_MANUAL_REVIEW"
          : riskScore >= 40
            ? "MONITOR"
            : "NORMAL";
    const captchaRequired = riskScore >= 70 || coordinationRisk;
    const captchaVerified = captchaRequired
      ? await verifyCaptcha(body.captchaToken, request)
      : false;
    if (captchaRequired && !captchaVerified) {
      if (resident) {
        await recordTrustAction(admin, {
          resident_id: resident.id,
          action_type: actionType,
          device_risk_signal: deviceRiskSignal,
          network_risk_signal: networkRiskSignal,
          behavior_risk_score: riskScore,
          velocity_score: velocityScore,
          location_score: locationScore,
          content_score: contentScore,
          evidence_score: evidenceScore,
          coordination_score: coordinationScore,
          risk_action: riskAction,
          captcha_required: true,
          captcha_verified: false,
          outcome: "rejected",
        });
        await admin.from("trust_risk_flags").insert({
          resident_id: resident.id,
          action_type: actionType,
          flag_type: "CAPTCHA_REQUIRED",
          risk_score: riskScore,
          metadata: { coordinationRisk, suspiciousSignals },
        });
        if (riskAction === "TEMPORARY_SUSPENSION_RECOMMENDED") {
          await admin.from("trust_risk_flags").insert({
            resident_id: resident.id,
            action_type: actionType,
            flag_type: "TEMPORARY_SUSPENSION_RECOMMENDED",
            risk_score: riskScore,
            metadata: {
              velocityScore,
              locationScore,
              contentScore,
              evidenceScore,
              coordinationScore,
            },
          });
        }
        for (const anomalyType of velocitySignals) {
          await admin.from("anomaly_events").insert({
            resident_id: resident.id,
            action_type: actionType,
            anomaly_type: anomalyType,
            risk_score: riskScore,
            metadata: { residentVelocityCount, velocityWindow: "10m" },
          });
        }
        for (const anomalyType of locationAnomalySignals) {
          await admin.from("anomaly_events").insert({
            resident_id: resident.id,
            action_type: actionType,
            anomaly_type: anomalyType,
            risk_score: riskScore,
            metadata: { distance, gpsAccuracy, suspiciousSignals },
          });
        }
        for (const anomalyType of contentAnomalySignals) {
          await admin.from("anomaly_events").insert({
            resident_id: resident.id,
            action_type: actionType,
            anomaly_type: anomalyType,
            risk_score: riskScore,
            metadata: {
              duplicateReportId: duplicateReport?.id,
              similarReportId: similarReport?.id,
              reportLinks: reportLinks.length,
            },
          });
        }
        for (const anomalyType of coordinationAnomalySignals) {
          await admin.from("anomaly_events").insert({
            resident_id: resident.id,
            action_type: actionType,
            anomaly_type: anomalyType,
            risk_score: riskScore,
            metadata: { recentSignalCount: recentSignals?.length ?? 0 },
          });
        }
        for (const anomalyType of evidenceRecord?.evidenceAnomalySignals ??
          []) {
          await admin.from("anomaly_events").insert({
            resident_id: resident.id,
            action_type: actionType,
            anomaly_type: anomalyType,
            risk_score: riskScore,
            metadata: {
              evidenceDistance: evidenceRecord.evidenceDistance,
              fileHash: evidenceRecord.fileHash,
            },
          });
        }
      }
      return reply(
        {
          error:
            "Additional verification is required before submitting this report.",
          captchaRequired: true,
        },
        403,
      );
    }
    if (coordinationRisk && resident) {
      await admin.from("trust_risk_flags").insert({
        resident_id: resident.id,
        action_type: actionType,
        flag_type: "COORDINATION_RISK",
        risk_score: riskScore,
        metadata: { deviceRiskSignal, networkRiskSignal },
      });
    }
    if (coordinationAnomalySignals.length > 0 && resident) {
      await admin.from("trust_risk_flags").insert({
        resident_id: resident.id,
        action_type: actionType,
        flag_type: "COORDINATION_RISK",
        risk_score: riskScore,
        metadata: { coordinationAnomalySignals },
      });
      for (const anomalyType of coordinationAnomalySignals) {
        await admin.from("anomaly_events").insert({
          resident_id: resident.id,
          action_type: actionType,
          anomaly_type: anomalyType,
          risk_score: riskScore,
          metadata: { recentSignalCount: recentSignals?.length ?? 0 },
        });
      }
    }
    if (velocitySignals.length > 0 && resident) {
      for (const anomalyType of velocitySignals) {
        await admin.from("anomaly_events").insert({
          resident_id: resident.id,
          action_type: actionType,
          anomaly_type: anomalyType,
          risk_score: riskScore,
          metadata: { residentVelocityCount, velocityWindow: "10m" },
        });
      }
    }
    if (locationAnomalySignals.length > 0 && resident) {
      for (const anomalyType of locationAnomalySignals) {
        await admin.from("anomaly_events").insert({
          resident_id: resident.id,
          action_type: actionType,
          anomaly_type: anomalyType,
          risk_score: riskScore,
          metadata: { distance, gpsAccuracy, suspiciousSignals },
        });
      }
    }
    if (contentAnomalySignals.length > 0 && resident) {
      for (const anomalyType of contentAnomalySignals) {
        await admin.from("anomaly_events").insert({
          resident_id: resident.id,
          action_type: actionType,
          anomaly_type: anomalyType,
          risk_score: riskScore,
          metadata: {
            duplicateReportId: duplicateReport?.id,
            similarReportId: similarReport?.id,
            reportLinks: reportLinks.length,
          },
        });
      }
    }
    if (evidenceRecord?.evidenceAnomalySignals.length && resident) {
      for (const anomalyType of evidenceRecord.evidenceAnomalySignals) {
        await admin.from("anomaly_events").insert({
          resident_id: resident.id,
          action_type: actionType,
          anomaly_type: anomalyType,
          risk_score: riskScore,
          metadata: {
            evidenceDistance: evidenceRecord.evidenceDistance,
            fileHash: evidenceRecord.fileHash,
          },
        });
      }
    }
    const issueId = crypto.randomUUID();
    let evidenceRecord: {
      storagePath: string;
      mimeType: string;
      byteSize: number;
      fileHash: string;
      duplicateEvidence: boolean;
      evidenceAnomalySignals: string[];
      evidenceDistance: number;
    } | null = null;

    if (body.evidence) {
      const evidence = decodeEvidence(body.evidence);
      const fileHash = await sha256(evidence.bytes);
      const { data: duplicateEvidence } = await admin
        .from("report_evidence")
        .select("id, issue_id, resident_id, created_at")
        .eq("file_hash", fileHash)
        .limit(1)
        .maybeSingle();
      const evidenceAnomalySignals: string[] = [];
      if (duplicateEvidence) evidenceAnomalySignals.push("DUPLICATE_EVIDENCE");
      if (
        duplicateEvidence?.resident_id &&
        duplicateEvidence.resident_id !== resident?.id
      ) {
        evidenceAnomalySignals.push("CROSS_RESIDENT_EVIDENCE");
      }
      const evidenceCapturedAt = body.evidenceCapturedAt
        ? new Date(body.evidenceCapturedAt).getTime()
        : NaN;
      if (
        !Number.isFinite(evidenceCapturedAt) ||
        Math.abs(Date.now() - evidenceCapturedAt) > 15 * 60 * 1000
      ) {
        evidenceAnomalySignals.push("EVIDENCE_TIMESTAMP_MISMATCH");
      }
      const evidenceDistance = distanceInMeters(
        body.evidenceCaptureLatitude ?? body.lat,
        body.evidenceCaptureLongitude ?? body.lng,
        body.lat,
        body.lng,
      );
      if (evidenceDistance > categoryPolicy.allowed_radius_meters) {
        evidenceAnomalySignals.push("EVIDENCE_LOCATION_FAR");
      }
      const storagePath = `${resident?.id ?? userData.user.id}/${issueId}.${evidence.mimeType.split("/")[1]}`;
      const { error: uploadError } = await admin.storage
        .from("report-evidence")
        .upload(storagePath, evidence.bytes, {
          contentType: evidence.mimeType,
          upsert: false,
        });
      if (uploadError) throw new Error("Unable to upload evidence.");
      evidenceRecord = {
        storagePath,
        mimeType: evidence.mimeType,
        byteSize: evidence.bytes.byteLength,
        fileHash,
        duplicateEvidence: Boolean(duplicateEvidence),
        evidenceAnomalySignals,
        evidenceDistance,
      };
    }

    const { data: issue, error: issueError } = await admin
      .from("issues")
      .insert({
        id: issueId,
        category: body.category,
        description: body.description.trim(),
        sub_detail: body.subDetail?.trim() || null,
        lat: body.lat,
        lng: body.lng,
        address: body.address?.trim() || null,
        accuracy_meters: body.accuracyMeters ?? null,
        status: "UNVERIFIED",
        is_verified_resident: true,
      })
      .select("id, status, created_at, is_verified_resident")
      .single();
    if (issueError || !issue) {
      if (evidenceRecord)
        await admin.storage
          .from("report-evidence")
          .remove([evidenceRecord.storagePath]);
      throw new Error("Unable to create report.");
    }

    if (evidenceRecord) {
      const { error: evidenceError } = await admin
        .from("report_evidence")
        .insert({
          issue_id: issue.id,
          storage_path: evidenceRecord.storagePath,
          captured_at: body.evidenceCapturedAt ?? new Date().toISOString(),
          capture_latitude: body.evidenceCaptureLatitude ?? body.lat,
          capture_longitude: body.evidenceCaptureLongitude ?? body.lng,
          location_accuracy:
            body.evidenceLocationAccuracy ?? body.accuracyMeters ?? null,
          mime_type: evidenceRecord.mimeType,
          byte_size: evidenceRecord.byteSize,
          file_hash: evidenceRecord.fileHash,
        });
      if (evidenceError) throw new Error("Unable to record evidence.");
    }

    await admin.from("location_verifications").insert({
      report_id: issue.id,
      resident_id: resident?.id ?? null,
      user_lat: body.userLat,
      user_lng: body.userLng,
      report_lat: body.lat,
      report_lng: body.lng,
      distance,
      gps_accuracy: gpsAccuracy,
      allowed_radius: categoryPolicy.allowed_radius_meters,
      location_verification: locationVerification,
      suspicious_signals: suspiciousSignals,
    });

    await recordTrustAction(admin, {
      resident_id: resident?.id ?? null,
      action_type: actionType,
      device_risk_signal: deviceRiskSignal,
      network_risk_signal: networkRiskSignal,
      behavior_risk_score: riskScore,
      velocity_score: velocityScore,
      location_score: locationScore,
      content_score: contentScore,
      evidence_score: evidenceScore,
      coordination_score: coordinationScore,
      risk_action: riskAction,
      captcha_required: captchaRequired,
      captcha_verified: captchaVerified,
      outcome: coordinationRisk ? "flagged" : "accepted",
      reference_id: issue.id,
    });
    await admin.from("report_audit_events").insert({
      issue_id: issue.id,
      resident_id: resident?.id ?? null,
      event_type: "report_created",
      risk_score: riskScore,
      metadata: {
        status: "UNVERIFIED",
        evidenceUploaded: Boolean(body.evidence),
        requiresAdminReview: categoryPolicy.requires_admin_review,
        minimumCorrobation: categoryPolicy.minimum_corrobation,
        evidenceFlags: evidenceRecord?.duplicateEvidence
          ? ["DUPLICATE_EVIDENCE"]
          : [],
        locationVerification,
        distance,
        suspiciousSignals,
        velocitySignals,
        contentAnomalySignals,
        evidenceAnomalySignals: evidenceRecord?.evidenceAnomalySignals ?? [],
        coordinationAnomalySignals,
        riskScore,
        riskAction,
        riskComponents: {
          velocityScore,
          locationScore,
          contentScore,
          evidenceScore,
          coordinationScore,
        },
      },
    });

    if (evidenceRecord?.duplicateEvidence) {
      await admin.from("report_audit_events").insert({
        issue_id: issue.id,
        resident_id: resident?.id ?? null,
        event_type: "DUPLICATE_EVIDENCE",
        risk_score: Math.min(100, riskScore + 25),
        metadata: { fileHash: evidenceRecord.fileHash },
      });
    }

    return reply({ report: issue, status: "UNVERIFIED" }, 201);
  } catch (error) {
    console.error("Report submission failed", error);
    return reply(
      {
        error:
          error instanceof Error ? error.message : "Report submission failed.",
      },
      400,
    );
  }
});
