export type IssueCategory =
  | "water"
  | "sewage"
  | "waste"
  | "pollution"
  | "road_damage"
  | "encroachment"
  | "other";

export type IssueStatus = "open" | "resolved";

/** Mirrors the `issues` table in sql/schema.sql — keep these in sync. */
export interface Issue {
  id: string;
  category: IssueCategory;
  description: string;
  status: IssueStatus;
  lat: number;
  lng: number;
  address: string | null;
  accuracy_meters: number | null;
  sub_detail: string | null;
  reporter_name: string | null;
  reporter_email: string | null;
  photo_base64: string | null;
  created_at: string;
}

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  water: "Water",
  sewage: "Sewage",
  waste: "Waste",
  pollution: "Environmental Pollution",
  road_damage: "Road Damage",
  encroachment: "Encroachment on Infrastructure",
  other: "Other",
};

export const CATEGORY_COLORS: Record<IssueCategory, string> = {
  water: "#2563eb", // blue
  sewage: "#78350f", // brown
  waste: "#6b7280", // grey
  pollution: "#065f46", // dark green
  road_damage: "#ea580c", // orange
  encroachment: "#7e22ce", // purple
  other: "#111827", // near-black
};
