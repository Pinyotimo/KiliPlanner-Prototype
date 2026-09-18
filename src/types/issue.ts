export type IssueCategory =
  | "security"
  | "water"
  | "sewage"
  | "waste"
  | "pollution"
  | "road_damage"
  | "construction"
  | "land_planning"
  | "drainage"
  | "encroachment"
  | "other";

export type IssueStatus = "UNVERIFIED" | "UNDER_REVIEW" | "CORROBORATED" | "REJECTED" | "VERIFIED" | "RESOLVED";

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
  device_id?: string | null;
  user_id?: string | null;
  is_verified_resident?: boolean;
}

export const CATEGORY_LABELS: Record<IssueCategory, string> = {
  security: "Security & Safety",
  water: "Water",
  sewage: "Sewage",
  waste: "Waste",
  pollution: "Environmental Pollution",
  road_damage: "Road Damage",
  construction: "Construction",
  land_planning: "Land/Planning",
  drainage: "Drainage",
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
  construction: "var(--category-road)",
  land_planning: "var(--category-encroachment)",
  drainage: "var(--category-water)",
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