export interface EstateGate {
  id: string;
  name: string;
  description: string;
  phasesServed: string;
  position: [number, number]; // [Latitude, Longitude] for Leaflet
}

export interface EstateZone {
  id: string;
  name: string;
  courts: string;
  coordinates: [number, number][]; // Polygon array [Lng, Lat] for GeoJSON
}

// 1. Access Gates Data
export const NYAYO_GATES: EstateGate[] = [
  {
    id: "gate-a",
    name: "Gate A",
    description: "Off Fedha Rd / Fahari Rd junction, opposite police quarters",
    phasesServed: "Phases 1 & 2 (Courts 1–288)",
    position: [-1.3055, 36.9020],
  },
  {
    id: "gate-b",
    name: "Gate B",
    description: "Residential connection toward Outering Rd / Fedha side",
    phasesServed: "Phases 1 & 2",
    position: [-1.3063, 36.9034],
  },
  {
    id: "gate-c",
    name: "Gate C",
    description: "Intermediate access boundary gate",
    phasesServed: "Central Estate Area",
    position: [-1.308333, 36.909167],
  },
  {
    id: "gate-d",
    name: "Gate D (Main Gate)",
    description: "Along North Airport Rd near Seasons Airport Hotel",
    phasesServed: "Phases 3, 4 & 5 (Courts 289–719)",
    position: [-1.3160, 36.9085],
  },
];

// 2. Section / Zone Polygons
export const NYAYO_ZONES: EstateZone[] = [
  {
    id: "phase-1-2",
    name: "Western Hub (Phases 1 & 2)",
    courts: "Courts 1 – 288",
    coordinates: [
      [36.9015, -1.3055],
      [36.9070, -1.3055],
      [36.9070, -1.3110],
      [36.9015, -1.3110],
      [36.9015, -1.3055],
    ],
  },
  {
    id: "phase-3-4-5",
    name: "Eastern Hub (Phases 3, 4 & 5)",
    courts: "Courts 289 – 719",
    coordinates: [
      [36.9070, -1.3055],
      [36.9185, -1.3055],
      [36.9185, -1.3140],
      [36.9070, -1.3140],
      [36.9070, -1.3055],
    ],
  },
];