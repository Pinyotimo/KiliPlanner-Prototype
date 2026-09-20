import { Feature, Polygon } from "geojson";

export type NyayoEstateBoundaryFeature = Feature<Polygon>;

export const NYAYO_CENTER: [number, number] = [-1.3105, 36.91];
export const NYAYO_DEFAULT_ZOOM = 15;

export const nyayoEstateBoundary: NyayoEstateBoundaryFeature = {
  type: "Feature",
  properties: {
    name: "Nyayo Estate",
    county: "Nairobi",
    sub_county: "Embakasi East",
    admin_level: 9,
  },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [36.9015, -1.3055],
        [36.9145, -1.3055],
        [36.9185, -1.3140],
        [36.9060, -1.3175],
        [36.9015, -1.3055],
      ],
    ],
  },
};