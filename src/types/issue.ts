export type IssueCategory =
  | "security"
  | "water"
  | "sewage"
  | "waste"
  | "pollution"
  | "road_damage"
  | "encroachment"
  | "other";

export type IssueStatus = "open" | "in_progress" | "resolved" | "closed";

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
  assigned_to?: string | null;
  official_notes?: string | null;
  updated_at?: string | null;
  is_security_alert?: boolean;
  unsafe_time?: string | null;
}

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  security: "Security & Safety",
  water: "Water",
  sewage: "Sewage",
  waste: "Waste",
  pollution: "Environmental Pollution",
  road_damage: "Road Damage",
  encroachment: "Encroachment on Infrastructure",
  other: "Other",
};

export const CATEGORY_COLORS: Record<IssueCategory, string> = {
  security: "var(--category-security)",
  water: "var(--category-water)",
  sewage: "var(--category-sewage)",
  waste: "var(--category-waste)",
  pollution: "var(--category-pollution)",
  road_damage: "var(--category-road)",
  encroachment: "var(--category-encroachment)",
  other: "var(--category-other)",
};

export interface Comment {
  id: string;
  issue_id: string;
  author_name?: string | null;
  content: string;
  user_id?: string | null;
  created_at: string;
  is_official?: boolean;
}
