// Calculates distance between two (lat, lng) points in meters
export function getDistanceInMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
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
// Auto Reverse Geocoding helper
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`,
      {
        headers: {
          "User-Agent": "KilimaniWardApp/1.0",
        },
      }
    );

    if (!response.ok) return "";

    const data = await response.json();
    const addr = data.address;

    if (!addr) return data.display_name || "";

    const road = addr.road || addr.pedestrian || addr.footway || "";
    const suburb = addr.suburb || addr.neighbourhood || addr.quarter || "Kilimani";

    if (road && suburb) {
      return `${road}, ${suburb}`;
    }
    return road || suburb || data.display_name || "";
  } catch (error) {
    console.error("Failed to fetch address:", error);
    return "";
  }
}