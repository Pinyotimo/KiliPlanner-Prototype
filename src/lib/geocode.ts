export interface GeocodeResult {
  lat: number;
  lng: number;
  displayName: string;
}

/**
 * Forward-geocodes text queries to coordinates, bounded to the Kilimani Ward bounding box.
 */
export async function forwardGeocode(query: string): Promise<GeocodeResult[]> {
  if (!query || query.trim().length < 3) return [];

  try {
    // Bounding box for Kilimani Ward (min_lon, min_lat, max_lon, max_lat)
    const viewbox = "36.7621,-1.3025,36.8054,-1.2801";
    const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
      query + ", Kilimani, Nairobi"
    )}&viewbox=${viewbox}&bounded=1&limit=5`;

    const response = await fetch(url, {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "KiliPlanner-CivicApp/1.0 (kiliplan@kilimani.org)",
      },
    });

    if (!response.ok) return [];

    const data = await response.json();

    return data.map((item: any) => ({
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      displayName: item.display_name,
    }));
  } catch (err) {
    console.warn("Forward geocoding search failed:", err);
    return [];
  }
}