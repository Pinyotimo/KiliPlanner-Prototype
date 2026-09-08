/**
 * Reverse-geocodes a lat/lng into a human-readable address using Nominatim
 * (OpenStreetMap's free geocoder — no API key required).
 *
 * Nominatim's usage policy asks for max 1 request/second and a descriptive
 * User-Agent/Referer — fine at hackathon-demo volume, but don't hammer it
 * in a loop.
 *
 * Returns null on any failure so a geocoding hiccup never blocks a report
 * from being submitted — address is a nice-to-have, not a required field.
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return typeof data.display_name === "string" ? data.display_name : null;
  } catch (err) {
    console.warn("Reverse geocoding failed, continuing without address:", err);
    return null;
  }
}