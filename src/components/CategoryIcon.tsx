import type { IssueCategory } from "../types/issue";
import { getCategoryIcon } from "../lib/categoryIcons";

interface CategoryIconProps {
  category: IssueCategory;
  className?: string;
}

export function CategoryIcon({
  category,
  className = "h-4 w-4",
}: CategoryIconProps) {
  const IconComponent = getCategoryIcon(category);
  return <IconComponent className={className} />;
}