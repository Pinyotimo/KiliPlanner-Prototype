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
  | "green_project"
  | "other";

export type IssueStatus =
  | "UNVERIFIED"
  | "UNDER_REVIEW"
  | "CORROBORATED"
  | "REJECTED"
  | "VERIFIED"
  | "RESOLVED";

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
  photo_base64_second?: string | null;
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
  drainage: "Drainage",
  road_damage: "Road Damage",
  construction: "Construction",
  green_project: "Green Pin: Propose a Project",
  sewage: "Sewage",
  waste: "Waste",
  land_planning: "Land/Planning",
  encroachment: "Encroachment on Infrastructure",
  pollution: "Environmental Pollution",
  other: "Other",
};

/**
 * A report that is still on the map.
 *
 * Resolved and closed reports drop off the map, so the map - and the legend
 * that counts it - has to use the same rule. Both read this, so a count can
 * never describe a pin that is not there.
 */
export function isShownOnMap(issue: Issue): boolean {
  const status = issue.status.toLowerCase();
  return status !== "resolved" && status !== "closed";
}

/** Compact labels for chart axes, where the full name will not fit. */
export const CATEGORY_SHORT_LABELS: Record<IssueCategory, string> = {
  security: "Security",
  water: "Water",
  drainage: "Drainage",
  road_damage: "Roads",
  construction: "Works",
  green_project: "Green Pin",
  sewage: "Sewage",
  waste: "Waste",
  land_planning: "Land",
  encroachment: "Encroach.",
  pollution: "Pollution",
  other: "Other",
};

/**
 * The service families the categories fold into.
 *
 * The map is an all-pairs form - any two pins can sit side by side - so the
 * category hues have to clear the colourblind and normal-vision floors for
 * every pair, not just neighbouring ones. Nine per-category hues could not:
 * red/orange and aqua/pink collapsed into each other. So the categories fold
 * into five families, each with one hue, and the specific category is carried
 * by its icon and its label.
 *
 * The values were computed and validated rather than eyeballed - see
 * tools/category-palette.mjs.
 */
export type CategoryFamily =
  | "security"
  | "water"
  | "works"
  | "environment"
  | "pollution"
  | "other";

export const CATEGORY_FAMILY: Record<IssueCategory, CategoryFamily> = {
  security: "security",
  water: "water",
  drainage: "water",
  sewage: "water",
  waste: "environment",
  green_project: "environment",
  pollution: "pollution",
  road_damage: "works",
  construction: "works",
  land_planning: "works",
  encroachment: "works",
  other: "other",
};

export const FAMILY_LABELS: Record<CategoryFamily, string> = {
  security: "Security",
  water: "Water & sewerage",
  works: "Roads, works & land",
  environment: "Waste & green space",
  pollution: "Pollution",
  other: "Other",
};

/**
 * Category identity colours.
 *
 * Hues follow Kenyan utility-map convention: potable water is blue, road
 * works orange, waste and greening green, security red. Categories inside one
 * family share a hue deliberately - the icon and the label carry the finer
 * distinction.
 *
 * Every value is a CSS token so the palette swaps with the light/dark mode.
 */
export const CATEGORY_COLORS: Record<IssueCategory, string> = {
  security: "var(--category-security)",
  water: "var(--category-water)",
  drainage: "var(--category-water)",
  sewage: "var(--category-water)",
  waste: "var(--category-environment)",
  green_project: "var(--category-environment)",
  pollution: "var(--category-pollution)",
  road_damage: "var(--category-works)",
  construction: "var(--category-works)",
  encroachment: "var(--category-works)",
  land_planning: "var(--category-works)",
  other: "var(--category-other)",
};

/** Ink that stays legible when drawn on top of a category colour. */
export const CATEGORY_INK: Record<IssueCategory, string> = {
  security: "var(--category-security-ink)",
  water: "var(--category-water-ink)",
  drainage: "var(--category-water-ink)",
  sewage: "var(--category-water-ink)",
  waste: "var(--category-environment-ink)",
  green_project: "var(--category-environment-ink)",
  pollution: "var(--category-pollution-ink)",
  road_damage: "var(--category-works-ink)",
  construction: "var(--category-works-ink)",
  encroachment: "var(--category-works-ink)",
  land_planning: "var(--category-works-ink)",
  other: "var(--category-other-ink)",
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
