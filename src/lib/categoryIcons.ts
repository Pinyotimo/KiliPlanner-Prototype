import {
  Droplets,
  Waves,
  Trash2,
  Wind,
  Construction,
  ShieldAlert,
  HelpCircle,
  type LucideIcon,
} from "lucide-react";
import type { IssueCategory } from "../types/issue";

export const CATEGORY_ICONS: Record<IssueCategory, LucideIcon> = {
  water: Droplets,
  sewage: Waves,
  waste: Trash2,
  pollution: Wind,
  road_damage: Construction,
  encroachment: ShieldAlert,
  other: HelpCircle,
};

export function getCategoryIcon(category: IssueCategory): LucideIcon {
  return CATEGORY_ICONS[category] || HelpCircle;
}