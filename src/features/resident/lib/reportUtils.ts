export function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export async function dispatchEmailToAuthority(
  issueData: any,
  lat: number,
  lng: number,
) {
  const EMAIL_GATEWAY_URL = "https://formspree.io/f/mzezzbav";

  try {
    await fetch(EMAIL_GATEWAY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subject: `🚨 KiliPlanner Alert: New ${issueData.category.toUpperCase()} Report`,
        category: issueData.category,
        urgency: issueData.is_security_alert
          ? "HIGH - Security Risk"
          : "Standard",
        description: issueData.description,
        location_details: issueData.address || "Address not provided",
        exact_coordinates: `${lat}, ${lng}`,
        google_maps_link: `https://maps.google.com/?q=${lat},${lng}`,
        reporter: issueData.reporter_name || "Anonymous Resident",
        action_required:
          "Please log into the KiliPlanner Official Dashboard to acknowledge and update the status of this ticket.",
      }),
    });
  } catch (error) {
    console.error("Failed to send automated email:", error);
  }
}