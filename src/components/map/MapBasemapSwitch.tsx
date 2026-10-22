import { cn } from "@/lib/utils";

export type BasemapId = "street" | "satellite" | "dark";

export interface Basemap {
  id: BasemapId;
  label: string;
  /** A short description of the layer, for screen readers. */
  description: string;
  url: string;
  attribution: string;
  maxNativeZoom?: number;
  maxZoom?: number;
}

/**
 * The base maps.
 *
 * "Dark" is not a filter on the street map - it is a different tile set,
 * chosen so the map reads as part of the app in dark mode instead of a
 * bright rectangle punched into it.
 */
export const BASEMAPS: Basemap[] = [
  {
    id: "street",
    label: "Street",
    description: "Standard street map",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  {
    id: "satellite",
    label: "Satellite",
    description: "Aerial imagery",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: "Tiles &copy; Esri",
    maxNativeZoom: 19,
    maxZoom: 19,
  },
  {
    id: "dark",
    label: "Dark",
    description: "Dark street map",
    url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
  },
];

interface MapBasemapSwitchProps {
  value: BasemapId;
  onChange: (id: BasemapId) => void;
}

/**
 * The base-map switcher.
 *
 * Leaflet's own layers widget is a plain list of radio buttons in a white
 * box. This is a segmented control in the app's own chrome, so it reads as
 * part of the map toolbar rather than as an OS dialog.
 */
export function MapBasemapSwitch({ value, onChange }: MapBasemapSwitchProps) {
  return (
    <div
      role="group"
      aria-label="Base map"
      className="leaflet-control flex overflow-hidden rounded-lg border border-border bg-card/95 shadow-lifted backdrop-blur-sm"
    >
      {BASEMAPS.map((map) => (
        <button
          key={map.id}
          type="button"
          onClick={() => onChange(map.id)}
          aria-pressed={value === map.id}
          title={map.description}
          className={cn(
            "cursor-pointer px-2.5 py-1.5 text-[11px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring",
            value === map.id
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
        >
          {map.label}
        </button>
      ))}
    </div>
  );
}
