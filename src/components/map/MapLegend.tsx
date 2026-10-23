import { useState } from "react";
import { ChevronDown, Layers } from "lucide-react";
import {
  CATEGORY_FAMILY,
  FAMILY_LABELS,
  type CategoryFamily,
  type Issue,
} from "../../types/issue";
import { cn } from "@/lib/utils";

/**
 * The order the families are listed in. Fixed, so the legend is a stable key
 * rather than something that reorders with the data.
 */
const FAMILY_ORDER: CategoryFamily[] = [
  "security",
  "water",
  "works",
  "environment",
  "pollution",
  "other",
];

const FAMILY_COLOR: Record<CategoryFamily, string> = {
  security: "var(--category-security)",
  water: "var(--category-water)",
  works: "var(--category-works)",
  environment: "var(--category-environment)",
  pollution: "var(--category-pollution)",
  other: "var(--category-other)",
};

/**
 * A key for the pin colours.
 *
 * Colour on the map is only meaningful if there is a key for it, so the
 * legend names every family and counts what is on the map right now. The
 * specific category of a pin is carried by the icon inside it - the colour
 * says which family it belongs to.
 *
 * The counts describe the pins that are actually drawn. Resolved reports are
 * not on the map, so they are not counted here either.
 */
export function MapLegend({ issues }: { issues: Issue[] }) {
  const [open, setOpen] = useState(false);

  const counts = FAMILY_ORDER.reduce<Record<string, number>>((acc, family) => {
    acc[family] = 0;
    return acc;
  }, {});
  for (const issue of issues) {
    const family = CATEGORY_FAMILY[issue.category] ?? "other";
    counts[family] = (counts[family] ?? 0) + 1;
  }
  const total = issues.length;

  return (
    <div className="absolute bottom-3 left-3 z-[1000] w-48">
      <div className="overflow-hidden rounded-xl border border-border bg-card/95 shadow-lifted backdrop-blur-sm">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="flex w-full cursor-pointer items-center gap-1.5 px-3 py-2 text-[11px] font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring"
        >
          <Layers className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
          <span>Legend</span>
          <span className="ml-auto tabular-nums text-muted-foreground">
            {total} shown
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
            aria-hidden="true"
          />
        </button>

        {open && (
          <ul className="space-y-1.5 border-t border-border px-3 pb-2.5 pt-2">
            {FAMILY_ORDER.map((family) => (
              <li
                key={family}
                className="flex items-center gap-2 text-[11px] leading-tight"
              >
                {/* The swatch wears the same ring the pins wear, so the key
                    and the thing it keys look like each other. */}
                <span
                  className="h-3 w-3 shrink-0 rounded-full ring-2 ring-card"
                  style={{ backgroundColor: FAMILY_COLOR[family] }}
                  aria-hidden="true"
                />
                <span className="text-foreground">{FAMILY_LABELS[family]}</span>
                <span className="ml-auto tabular-nums text-muted-foreground">
                  {counts[family] ?? 0}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
