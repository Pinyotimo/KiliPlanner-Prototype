import type { IssueCategory } from "../types/issue";
import { getCategoryIcon } from "../lib/categoryIcons";

interface CategoryIconProps {
  category: IssueCategory;
  className?: string;
  /** Optional colour for the glyph, usually the category's identity colour. */
  color?: string;
}

export function CategoryIcon({
  category,
  className = "h-4 w-4",
  color,
}: CategoryIconProps) {
  const IconComponent = getCategoryIcon(category);
  return (
    <IconComponent
      className={className}
      style={color ? { color } : undefined}
      aria-hidden="true"
    />
  );
}
