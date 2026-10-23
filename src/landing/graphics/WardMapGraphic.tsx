import { motion, useReducedMotion } from "framer-motion";
import {
  CATEGORY_FAMILY,
  CATEGORY_LABELS,
  FAMILY_LABELS,
  type CategoryFamily,
  type IssueCategory,
} from "../../types/issue";

/**
 * The family tokens the map draws with.
 *
 * The map is an all-pairs form - any two pins can sit side by side - so the
 * categories fold into five service families, each with one hue that clears
 * the colourblind and normal-vision floors against every other family.
 */
const FAMILY_TOKEN: Record<CategoryFamily, string> = {
  security: "var(--category-security, var(--destructive))",
  water: "var(--category-water, var(--primary))",
  works: "var(--category-works, var(--warning))",
  environment: "var(--category-environment, var(--success))",
  pollution: "var(--category-pollution, var(--category-other, var(--primary)))",
  other: "var(--category-other, var(--muted-foreground))",
};

/**
 * A stylised map of the ward.
 *
 * The streets, the boundary and the pins are drawn in the app's own visual
 * language: the boundary is the primary colour, and each pin wears its
 * service-family colour. Nothing here is a stock image - if the accent or the
 * mode changes, the drawing changes with it.
 */
export function WardMapGraphic({ className }: { className?: string }) {
  const reduced = useReducedMotion();

  // Each pin: position and the category it stands for. The colour comes from
  // the family the category folds into, never from a hand-picked hue.
  const pins: { x: number; y: number; category: IssueCategory }[] = [
    { x: 148, y: 176, category: "water" },
    { x: 246, y: 120, category: "security" },
    { x: 352, y: 208, category: "road_damage" },
    { x: 424, y: 128, category: "waste" },
    { x: 196, y: 288, category: "pollution" },
    { x: 318, y: 322, category: "sewage" },
  ];

  return (
    <svg
      viewBox="0 0 560 420"
      className={className}
      role="img"
      aria-label="A stylised map of Kilimani Ward with reports pinned to the streets and the ward boundary outlined."
    >
      <defs>
        <linearGradient id="lp-ward-fill" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.16" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.04" />
        </linearGradient>
        <radialGradient id="lp-vignette" cx="50%" cy="45%" r="70%">
          <stop offset="60%" stopColor="var(--background)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--background)" stopOpacity="0.9" />
        </radialGradient>
      </defs>

      {/* City blocks */}
      <g fill="var(--muted)" opacity="0.75">
        <rect x="54" y="58" width="104" height="66" rx="10" />
        <rect x="186" y="44" width="96" height="58" rx="10" />
        <rect x="330" y="52" width="88" height="70" rx="10" />
        <rect x="440" y="66" width="72" height="52" rx="10" />
        <rect x="42" y="228" width="86" height="72" rx="10" />
        <rect x="152" y="212" width="72" height="58" rx="10" />
        <rect x="252" y="228" width="78" height="66" rx="10" />
        <rect x="366" y="236" width="70" height="60" rx="10" />
        <rect x="452" y="216" width="66" height="74" rx="10" />
        <rect x="96" y="330" width="92" height="56" rx="10" />
        <rect x="228" y="344" width="86" height="48" rx="10" />
        <rect x="356" y="332" width="98" height="58" rx="10" />
      </g>

      {/* Streets */}
      <g
        stroke="var(--border-strong)"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      >
        <path d="M20 200 H540" strokeWidth="9" />
        <path d="M268 20 V400" strokeWidth="9" />
        <path d="M20 150 H540" strokeWidth="4" />
        <path d="M20 306 H540" strokeWidth="4" />
        <path d="M132 20 V400" strokeWidth="4" />
        <path d="M400 20 V400" strokeWidth="4" />
        <path d="M20 40 H540" strokeWidth="3" />
      </g>

      {/* The ward boundary */}
      <motion.path
        d="M62 36 L470 30 L524 118 L508 300 L420 392 L128 388 L46 296 L40 128 Z"
        fill="url(#lp-ward-fill)"
        stroke="var(--primary)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeDasharray="10 7"
        initial={reduced ? undefined : { pathLength: 0, opacity: 0 }}
        whileInView={
          reduced ? undefined : { pathLength: 1, opacity: 1 }
        }
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 1.6, ease: "easeInOut" }}
      />

      {/* Pins */}
      {pins.map((pin, index) => {
        const family = CATEGORY_FAMILY[pin.category];
        const color = FAMILY_TOKEN[family];

        return (
          <g key={`${pin.x}-${pin.y}`}>
            <title>
              {CATEGORY_LABELS[pin.category]} - {FAMILY_LABELS[family]}
            </title>
            <motion.circle
              cx={pin.x}
              cy={pin.y}
              r="9"
              fill={color}
              initial={reduced ? undefined : { scale: 0, opacity: 0 }}
              whileInView={reduced ? undefined : { scale: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.45,
                delay: 0.5 + index * 0.12,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              style={{ transformOrigin: `${pin.x}px ${pin.y}px` }}
            />
            <circle
              cx={pin.x}
              cy={pin.y}
              r="9"
              fill="none"
              stroke="var(--card)"
              strokeWidth="2.5"
            />
            <circle
              cx={pin.x}
              cy={pin.y}
              r="9"
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              opacity="0.5"
              className="lp-ping"
              style={{ transformOrigin: `${pin.x}px ${pin.y}px` }}
            />
          </g>
        );
      })}

      {/* Fade the edges so the drawing sits inside its card */}
      <rect
        x="0"
        y="0"
        width="560"
        height="420"
        fill="url(#lp-vignette)"
        pointerEvents="none"
      />
    </svg>
  );
}
