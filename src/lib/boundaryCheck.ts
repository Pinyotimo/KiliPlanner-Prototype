import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point } from "@turf/helpers";
import { kilimaniBoundary } from "../data/kilimaniBoundary";

/**
 * Returns true if (lat, lng) falls inside the Kilimani Ward boundary.
 *
 * Implements FR-3.2 from the SRS: this check runs entirely client-side
 * (no server round-trip) so a rejected click is instant. Turf/GeoJSON
 * expect [longitude, latitude] order — Leaflet gives you (lat, lng), so
 * this function does the reordering for you; callers should always pass
 * (lat, lng) as named.
 */
export function isInsideKilimani(lat: number, lng: number): boolean {
  const clickedPoint = point([lng, lat]);
  return booleanPointInPolygon(clickedPoint, kilimaniBoundary);
}
