import {
  Droplets,
  Waves,
  Trash2,
  Wind,
  Construction,
  ShieldAlert,
  HelpCircle,
  CircleHelp,
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

  encroachment: Navigation,
  other: CircleHelp,

};

export function getCategoryIcon(category: IssueCategory): LucideIcon {
  return CATEGORY_ICONS[category] || HelpCircle;
}