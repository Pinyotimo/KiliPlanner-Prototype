import { NYAYO_GATES } from "../data/nyayoLandmarks";

type Candidate = {
  name: string;
  distance: number;
  type: string;
  isGate: boolean;
};

const AREA_TYPES = [
  "pitch",
  "park",
  "field",
  "garden",
  "playground",
  "school",
  "grounds",
  "court",
  "residential",
];

const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
];

/**
 * Calculates straight-line distance (in meters) between two coordinate points.
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

/**
 * Races a promise against a wall-clock timeout so a stuck connection
 * can never hang the caller past `ms`.
 */
function withHardTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), ms);
    promise.then(
      (result) => {
        clearTimeout(timer);
        resolve(result);
      },
      () => {
        clearTimeout(timer);
        resolve(null);
      }
    );
  });
}

/**
 * Local fast-path lookup for known Nyayo Estate Gates & Landmarks.
 * Guarantees zero network latency and exact accuracy when near estate entrances.
 */
function findNearestStaticGate(lat: number, lng: number): Candidate | null {
  let closest: Candidate | null = null;
  let minDistance = Infinity;

  for (const gate of NYAYO_GATES) {
    const dist = haversineDistance(
      lat,
      lng,
      gate.position[0],
      gate.position[1]
    );

    // If within 75 meters of a known Nyayo gate
    if (dist <= 75 && dist < minDistance) {
      minDistance = dist;
      closest = {
        name: gate.name,
        distance: dist,
        type: "gate",
        isGate: true,
      };
    }
  }

  return closest;
}

/**
 * Reverse-geocodes lat/lng into a precise, human-readable landmark string
 * formatted specifically for Nyayo Estate (Courts, Gates, Phases, Roads).
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    // 1. Instant check against local static gate dataset
    const staticGate = findNearestStaticGate(lat, lng);

    // 2. Fetch Nominatim context (Road name & Area)
    const { road, area, nomLandmark } = await fetchNominatimContext(lat, lng);

    // 3. Fetch nearest OSM court / building / POI candidate via Overpass
    const osmCandidate = await withHardTimeout(fetchNearestCandidate(lat, lng), 4000);

    // Prioritize static gate if close by, otherwise use nearest OSM candidate
    const bestCandidate = staticGate || osmCandidate;

    let locationString: string;

    if (bestCandidate) {
      const positionPhrase = phraseFor(bestCandidate);
      locationString = road
        ? `${positionPhrase}, along ${road}`
        : `${positionPhrase}, ${area}`;
    } else if (nomLandmark) {
      locationString = road
        ? `near ${nomLandmark}, along ${road}`
        : `near ${nomLandmark}, ${area}`;
    } else if (road) {
      locationString = `along ${road}, ${area}`;
    } else {
      locationString = `${area}, Nyayo Estate`;
    }

    return sanitizeLocationString(locationString);
  } catch {
    return "Nyayo Estate, Embakasi";
  }
}

function phraseFor(c: Candidate): string {
  const roundedDist = Math.max(5, Math.round(c.distance / 5) * 5);

  if (c.isGate) {
    return c.distance <= 15
      ? `at ${c.name}`
      : `${roundedDist}m from ${c.name}`;
  }
  if (
    AREA_TYPES.some((t) => c.type.includes(t)) &&
    c.distance <= 35
  ) {
    return `inside ${c.name}`;
  }
  if (c.distance <= 10) {
    return `at ${c.name}`;
  }
  return `${roundedDist}m from ${c.name}`;
}

async function fetchNominatimContext(
  lat: number,
  lng: number
): Promise<{ road: string; area: string; nomLandmark: string }> {
  let road = "";
  let area = "Nyayo Estate";
  let nomLandmark = "";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&extratags=1&namedetails=1`;
    const res = await fetch(url, {
      headers: {
        "Accept-Language": "en",
        "User-Agent": "NyayoCommunityApp/1.0 (contact@nyayoestate.co.ke)",
      },
      signal: controller.signal,
    });

    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      nomLandmark =
        addr.amenity ||
        addr.building ||
        addr.shop ||
        addr.office ||
        addr.tourism ||
        addr.leisure ||
        addr.school ||
        "";
      road = addr.road || addr.pedestrian || addr.path || "";
      area =
        addr.residential ||
        addr.suburb ||
        addr.neighbourhood ||
        "Nyayo Estate";
    }
  } catch {
    // fall through with defaults
  } finally {
    clearTimeout(timeout);
  }

  return { road, area, nomLandmark };
}

/**
 * Finds the nearest identifiable court, gate, or building in OpenStreetMap
 */
async function fetchNearestCandidate(
  lat: number,
  lng: number
): Promise<Candidate | null> {
  const query = `[out:json][timeout:4];(
    nwr(around:200,${lat},${lng})["name"];
    node(around:200,${lat},${lng})["barrier"="gate"];
    node(around:200,${lat},${lng})["entrance"];
  );out body center;`;
  const encodedQuery = encodeURIComponent(query);

  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    try {
      const response = await fetch(`${endpoint}?data=${encodedQuery}`, {
        signal: controller.signal,
      });
      if (!response.ok) continue;

      const data = await response.json();
      if (!data.elements?.length) continue;

      const named: Candidate[] = [];
      const gates: {
        lat: number;
        lng: number;
        distance: number;
        ownName: string;
      }[] = [];

      for (const el of data.elements) {
        const tags = el.tags || {};
        const elLat = el.lat ?? el.center?.lat;
        const elLng = el.lon ?? el.center?.lon;
        if (elLat === undefined || elLng === undefined) continue;

        const dist = haversineDistance(lat, lng, elLat, elLng);
        const isGateTag = tags.barrier === "gate" || !!tags.entrance;

        if (isGateTag) {
          gates.push({
            lat: elLat,
            lng: elLng,
            distance: dist,
            ownName: tags.name || "",
          });
          if (!tags.name) continue;
        }

        if (
          !tags.name ||
          ["residential", "service", "tertiary", "unclassified"].includes(
            tags.highway
          )
        ) {
          continue;
        }

        const typeTag =
          tags.leisure ||
          tags.amenity ||
          tags.barrier ||
          tags.building ||
          tags.shop ||
          tags.office ||
          "court";

        named.push({
          name: tags.name,
          distance: dist,
          type: String(typeTag).toLowerCase(),
          isGate: isGateTag,
        });
      }

      // Pair unnamed gates with the nearest named Court or Phase compound
      for (const gate of gates) {
        if (gate.ownName) continue;
        let nearestNamed: { name: string; d: number } | null = null;
        for (const cand of named) {
          const d = cand.distance;
          if (!nearestNamed || d < nearestNamed.d)
            nearestNamed = { name: cand.name, d };
        }
        if (nearestNamed && nearestNamed.d <= 80) {
          named.push({
            name: `${nearestNamed.name} Gate`,
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
 * Guarantees a clean, readable location text output without raw coordinates or default text.
 */
function sanitizeLocationString(str: string): string {
  const cleanStr = str
    .replace(/-?\d+\.\d+[\s,]* -?\d+\.\d+/g, "")
    .replace(/-?\d+\.\d+/g, "")
    .replace(/Kilimani Ward/gi, "Nyayo Estate")
    .replace(/Kilimani/gi, "Nyayo Estate")
    .trim();

  return !cleanStr || cleanStr.length < 3
    ? "Nyayo Estate, Embakasi"
    : cleanStr;
}