/**
 * Reverse-geocodes lat/lng into a building/landmark-aware location string.
 * Uses Nominatim for street/suburb data and Overpass API for nearby named buildings & POIs.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    // Step 1: Query Nominatim for street & area metadata
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&extratags=1&namedetails=1`;
    const response = await fetch(nomUrl, {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "KiliPlanner-CivicApp/1.0 (kiliplan@kilimani.org)",
      },
    });

    let road = "";
    let area = "Kilimani";
    let landmark = "";

    if (response.ok) {
      const data = await response.json();
      const addr = data.address || {};

      landmark =
        addr.amenity ||
        addr.building ||
        addr.shop ||
        addr.office ||
        addr.tourism ||
        addr.leisure ||
        "";
      road = addr.road || addr.pedestrian || addr.path || "";
      area = addr.suburb || addr.neighbourhood || addr.residential || "Kilimani";
    }

    // Step 2: If Nominatim didn't identify a building name, query Overpass API within 40m
    if (!landmark) {
      landmark = await fetchNearbyLandmark(lat, lng);
    }

    // Step 3: Format building and street output
    if (landmark && road) return `Near ${landmark}, ${road}, ${area}`;
    if (landmark) return `Near ${landmark}, ${area}`;
    if (road) return `${road}, ${area}`;
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (err) {
    console.warn("Reverse geocoding failed, falling back to raw coordinates:", err);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

/**
 * Queries OpenStreetMap Overpass API for named buildings, plazas, shops, or places within 40m.
 */
async function fetchNearbyLandmark(lat: number, lng: number): Promise<string> {
  try {
    const query = `[out:json][timeout:4];(node(around:40,${lat},${lng})["name"];way(around:40,${lat},${lng})["name"];);out body center 3;`;
    const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;

    const response = await fetch(url);
    if (!response.ok) return "";

    const data = await response.json();
    if (data.elements && data.elements.length > 0) {
      // Find the nearest feature with a name that is NOT a road/highway
      const namedEntity = data.elements.find(
        (el: any) => el.tags && el.tags.name && !el.tags.highway
      );
      return namedEntity ? namedEntity.tags.name : "";
    }
    return "";
  } catch {
    return "";
  }
}