import { supabase } from "./supabaseClient";
import type { Issue } from "../types/issue";

const DEVICE_ID_KEY = "kili_device_id";

function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

export async function publishDevicePing(
  position: GeolocationPosition,
  notificationsEnabled: boolean,
) {
  const { error } = await supabase.from("device_pings").upsert(
    {
      device_id: getDeviceId(),
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      notifications_enabled: notificationsEnabled,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "device_id" },
  );

  if (error) throw error;
}

export function subscribeToNearbyAlerts(onAlert: (issue: Issue) => void) {
  const deviceId = getDeviceId();
  const channel = supabase
    .channel(`geo-alerts-${deviceId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "geo_alert_notifications",
        filter: `device_id=eq.${deviceId}`,
      },
      async (payload) => {
        const notification = payload.new as { id: string; issue_id: string };
        const { data, error } = await supabase
          .from("issues")
          .select("*")
          .eq("id", notification.issue_id)
          .single();

        if (!error && data) {
          onAlert(data as Issue);
          await supabase
            .from("geo_alert_notifications")
            .update({ delivered_at: new Date().toISOString() })
            .eq("id", notification.id);
        }
      },
    )
    .subscribe();

  return () => {
    void supabase.removeChannel(channel);
  };
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) return Promise.resolve("denied");
  return Notification.requestPermission();
}

export function showSecurityAlertNotification(issue: Issue) {
  if (!("Notification" in window) || Notification.permission !== "granted") {
    return;
  }

  new Notification("Security alert nearby", {
    body: `${issue.description}${issue.address ? ` Near ${issue.address}.` : "."}`,
    tag: `security-alert-${issue.id}`,
  });
}
