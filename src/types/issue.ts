export type IssueCategory =
  | "water"
  | "sewage"
  | "waste"
  | "pollution"
  | "road_damage"
  | "encroachment"
  | "other";

export type IssueStatus = "open" | "resolved";

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
  upvotes?: number;
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
  water: "#2563eb",
  sewage: "#78350f",
  waste: "#6b7280",
  pollution: "#065f46",
  road_damage: "#ea580c",
  encroachment: "#7e22ce",
  other: "#111827",
};

export interface Comment {
  id: string;
  issue_id: string;
  author_name?: string | null;
  content: string;
  user_id?: string | null;
  created_at: string;
}