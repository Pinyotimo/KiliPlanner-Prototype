import {
  Droplets,
  Waves,
  Trash2,
  Wind,
  Construction,
  ShieldAlert,
  Sprout,
  CircleHelp,
  Navigation as NavigationIcon,
  type LucideIcon,
} from "lucide-react";
import type { IssueCategory } from "../types/issue";

export const CATEGORY_ICONS: Record<IssueCategory, LucideIcon> = {
  security: ShieldAlert,
  water: Droplets,
  sewage: Waves,
  waste: Trash2,
  pollution: Wind,
  road_damage: Construction,
  encroachment: NavigationIcon,
  green_project: Sprout,
  other: CircleHelp,
};

export function getCategoryIcon(category: IssueCategory): LucideIcon {
  return CATEGORY_ICONS[category] || CircleHelp;
}
