import { NYAYO_GATES } from "../data/nyayoLandmarks";

export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

/**
 * Bounding box for Nyayo Estate, Embakasi (min_lon, min_lat, max_lon, max_lat)
 */
const NYAYO_VIEWBOX = "36.8950,-1.3220,36.9250,-1.3000";

/**
 * Forward-geocodes text queries to coordinates, bounded strictly to Nyayo Estate.
 */
export async function forwardGeocode(query: string): Promise<GeocodeResult[]> {
  if (!query || query.trim().length < 2) return [];

  const cleanQuery = query.trim().toLowerCase();
  const results: GeocodeResult[] = [];

  // 1. Instant local search match against known Nyayo Estate Gates
  for (const gate of NYAYO_GATES) {
    if (
      gate.name.toLowerCase().includes(cleanQuery) ||
      gate.description.toLowerCase().includes(cleanQuery) ||
      gate.phasesServed.toLowerCase().includes(cleanQuery)
    ) {
      results.push({
        lat: gate.position[0],
        lng: gate.position[1],
        displayName: `${gate.name} (${gate.phasesServed}) — Nyayo Estate`,
      });
    }
  }

  // 2. Fetch from Nominatim bounded to Nyayo Estate viewbox
  try {
    const searchSuffix = cleanQuery.includes("nyayo")
      ? ", Embakasi, Nairobi"
      : ", Nyayo Estate, Embakasi, Nairobi";

    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      query + searchSuffix
    )}&viewbox=${NYAYO_VIEWBOX}&bounded=1&limit=5`;

    const response = await fetch(url, {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "NyayoCommunityApp/1.0 (contact@nyayoestate.co.ke)",
      },
    });

    if (response.ok) {
      const data = await response.json();

      const apiResults: GeocodeResult[] = data.map((item: any) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        displayName: item.display_name,
      }));

      results.push(...apiResults);
    }
  } catch (err) {
    console.warn("Nyayo forward geocoding search failed:", err);
  }

  // Deduplicate results by coordinate proximity
  return results.filter(
    (res, index, self) =>
      index ===
      self.findIndex(
        (r) =>
          Math.abs(r.lat - res.lat) < 0.0001 &&
          Math.abs(r.lng - res.lng) < 0.0001
      )
  );
}