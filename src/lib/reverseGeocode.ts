type Candidate = {
  name: string;
  distance: number;
  type: string;
  isGate: boolean;
};

const AREA_TYPES = ["pitch", "park", "field", "garden", "playground", "school", "grounds"];
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

/**
 * Calculates straight-line distance (in meters) between two coordinate points.
 */
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/**
 * Races a promise against a wall-clock timeout so a stuck connection (below
 * the AbortController layer) can never hang the caller past `ms`.
 */
function withHardTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise.then(
      (result) => { clearTimeout(timer); resolve(result); },
      () => { clearTimeout(timer); resolve(null); },
    );
  });
}

/**
 * Reverse-geocodes lat/lng into a precise, human-readable landmark string.
 * Never returns raw coordinates — always a named place, gate, or road reference.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const { road, area, nomLandmark } = await fetchNominatimContext(lat, lng);
    const best = await withHardTimeout(fetchNearestCandidate(lat, lng), 5000);

    let locationString: string;

    if (best) {
      const positionPhrase = phraseFor(best);
      locationString = road ? `along ${road}, ${positionPhrase}` : `${positionPhrase}, ${area}`;
    } else if (nomLandmark) {
      locationString = road ? `along ${road}, near ${nomLandmark}` : `near ${nomLandmark}, ${area}`;
    } else if (road) {
      locationString = `along ${road}, ${area}`;
    } else {
      locationString = `${area} Ward`;
    }

    return sanitizeLocationString(locationString);
  } catch {
    return "Kilimani Ward";
  }
}

function phraseFor(c: Candidate): string {
  const roundedDist = Math.max(5, Math.round(c.distance / 5) * 5);

  if (c.isGate) {
    return c.distance <= 20 ? `at the ${c.name}` : `${roundedDist}m from the ${c.name}`;
  }
  if (AREA_TYPES.some((t) => c.type.includes(t)) && c.distance <= 40) {
    return `inside ${c.name}`;
  }
  if (c.distance <= 15) {
    return `at ${c.name}`;
  }
  return `${roundedDist}m from ${c.name}`;
}

async function fetchNominatimContext(
  lat: number,
  lng: number,
): Promise<{ road: string; area: string; nomLandmark: string }> {
  let road = "";
  let area = "Kilimani";
  let nomLandmark = "";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3500);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&extratags=1&namedetails=1`;
    const res = await fetch(url, {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "KiliPlanner-CivicApp/1.0 (kiliplan@kilimani.org)",
      },
      signal: controller.signal,
    });

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      nomLandmark =
        addr.amenity || addr.building || addr.shop || addr.office || addr.tourism || addr.leisure || addr.school || addr.hospital || "";
      road = addr.road || addr.pedestrian || addr.path || "";
      area = addr.suburb || addr.neighbourhood || addr.residential || "Kilimani";
    }
  } catch {
    // fall through with defaults
  } finally {
    clearTimeout(timeout);
  }

  return { road, area, nomLandmark };
}

/**
 * Finds the nearest identifiable feature to the point — a named POI/building,
 * or a gate/entrance (paired with the nearest named compound it belongs to).
 */
async function fetchNearestCandidate(lat: number, lng: number): Promise<Candidate | null> {
  // Pull named features AND gate/entrance nodes in one query.
  const query = `[out:json][timeout:4];(
    nwr(around:220,${lat},${lng})["name"];
    node(around:220,${lat},${lng})["barrier"="gate"];
    node(around:220,${lat},${lng})["entrance"];
  );out body center;`;
  const encodedQuery = encodeURIComponent(query);

  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      const response = await fetch(`${endpoint}?data=${encodedQuery}`, { signal: controller.signal });
      if (!response.ok) continue;

      const data = await response.json();
      if (!data.elements?.length) continue;

      const named: Candidate[] = [];
      const gates: { lat: number; lng: number; distance: number; ownName: string }[] = [];

      for (const el of data.elements) {
        const tags = el.tags || {};
        const elLat = el.lat ?? el.center?.lat;
        const elLng = el.lon ?? el.center?.lon;
        if (elLat === undefined || elLng === undefined) continue;

        const dist = haversineDistance(lat, lng, elLat, elLng);
        const isGateTag = tags.barrier === "gate" || !!tags.entrance;

        if (isGateTag) {
          gates.push({ lat: elLat, lng: elLng, distance: dist, ownName: tags.name || "" });
          if (!tags.name) continue; // unnamed gate handled via pairing below
        }

        if (
          !tags.name ||
          ["residential", "service", "tertiary", "unclassified"].includes(tags.highway)
        ) {
          continue;
        }

        const typeTag =
          tags.leisure || tags.amenity || tags.barrier || tags.building || tags.shop || tags.office || "poi";

        named.push({
          name: tags.name,
          distance: dist,
          type: String(typeTag).toLowerCase(),
          isGate: isGateTag,
        });
      }

      // Pair unnamed gates with the nearest named compound they likely belong to.
      for (const gate of gates) {
        if (gate.ownName) continue; // already added as a named candidate above
        let nearestNamed: { name: string; d: number } | null = null;
        for (const cand of named) {
          const d = cand.distance; // approximation: reuse computed distances-from-user as proxy ranking
          if (!nearestNamed || d < nearestNamed.d) nearestNamed = { name: cand.name, d };
        }
        if (nearestNamed && nearestNamed.d <= 80) {
          named.push({
            name: `${nearestNamed.name} gate`,
            distance: gate.distance,
            type: "gate",
            isGate: true,
          });
        }
      }

      if (named.length > 0) {
        named.sort((a, b) => a.distance - b.distance);
        return named[0];
      }
    } catch {
      continue;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return null;
}

/**
 * Strips any raw numeric coordinates and guarantees a readable text output.
 */
function sanitizeLocationString(str: string): string {
  const cleanStr = str
    .replace(/-?\d+\.\d+[\s,]* -?\d+\.\d+/g, "")
    .replace(/-?\d+\.\d+/g, "")
    .trim();
  return !cleanStr || cleanStr.length < 3 ? "Kilimani Ward" : cleanStr;
}