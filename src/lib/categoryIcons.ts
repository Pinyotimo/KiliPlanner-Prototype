import {
  Droplets,
  Waves,
  Trash2,
  AlertTriangle,
  Construction,
  Navigation,
  HelpCircle,
  CircleHelp,
  type LucideIcon,
} from "lucide-react";
import type { IssueCategory } from "../types/issue";


export const CATEGORY_ICONS: Record<IssueCategory, LucideIcon> = {
  water: Droplets,
  sewage: Waves,
  waste: Trash2,
  pollution: AlertTriangle,
  road_damage: Construction,
  encroachment: Navigation,
  other: CircleHelp,
};

export function getCategoryIcon(category: IssueCategory): LucideIcon {
  return CATEGORY_ICONS[category] || HelpCircle;
}