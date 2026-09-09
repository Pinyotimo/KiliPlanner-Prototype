import L from "leaflet";
import { renderToString } from "react-dom/server";
import type { IssueCategory } from "../types/issue";
import { CATEGORY_COLORS } from "../types/issue";
import { getCategoryIcon } from "./categoryIcons";

export function createCategoryDivIcon(category: IssueCategory) {
  const Icon = getCategoryIcon(category);
  const color = CATEGORY_COLORS[category] || "#3b82f6";

  const iconSvg = renderToString(
    <Icon className="w-4 h-4 text-white stroke-[2.5]" />
  );

  const html = `
    <div style="
      background-color: ${color};
      width: 32px;
      height: 32px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid white;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
    ">
      <div style="transform: rotate(45deg); display: flex; align-items: center; justify-content: center;">
        ${iconSvg}
      </div>
    </div>
  `;

  return L.divIcon({
    className: "custom-category-pin",
    html,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
}