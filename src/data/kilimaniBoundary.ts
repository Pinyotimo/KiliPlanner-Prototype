/**
 * Kilimani Ward boundary (traced via geojson.io).
 */

export type KilimaniBoundaryFeature = GeoJSON.Feature<GeoJSON.Polygon>;

export const kilimaniBoundary: KilimaniBoundaryFeature = {
  type: "Feature",
  properties: {
    name: "Kilimani Ward",
    county: "Nairobi",
    sub_county: "Dagoretti North",
    admin_level: 8,
  },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [36.7725, -1.2858],
        [36.785, -1.281],
        [36.8042, -1.2885],
        [36.799, -1.304],
        [36.7812, -1.2995],
        [36.7725, -1.2858],
      ],
    ],
  },
};

/** Rough center point, used to center the Leaflet map on load. */
export const KILIMANI_CENTER: [number, number] = [-1.2945, 36.7855];
export const KILIMANI_DEFAULT_ZOOM = 15;