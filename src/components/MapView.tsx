import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
} from "react-leaflet";
import L from "leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import { Info, MapPin, MousePointerClick } from "lucide-react";

import { nyayoEstateBoundary, NYAYO_CENTER, NYAYO_DEFAULT_ZOOM } from "../data/nyayoEstateBoundary";
import { NYAYO_GATES } from "../data/nyayoLandmarks";
import { isInsideNyayoEstate } from "../lib/boundaryCheck";
import { isShownOnMap, type Issue } from "../types/issue";
import { useTheme } from "@/theme/ThemeProvider";
import { cn } from "@/lib/utils";
import { Badge } from "./ui/badge";

import { InteractionHandler } from "./map/InteractionHandler";
import { DraftMarker } from "./map/DraftMarker";
import { LocationButton } from "./map/LocationButton";
import { FocusIssue, MapSizeObserver } from "./map/MapHelpers";
import { IssueMarker } from "./map/IssueMarker";
import { MapLegend } from "./map/MapLegend";
import { MapBasemapSwitch, BASEMAPS, type BasemapId } from "./map/MapBasemapSwitch";
import { MapNotice } from "./map/MapNotice";
import { MapScale } from "./map/MapScale";

interface MapViewProps {
  issues: Issue[];
  onValidClick: (lat: number, lng: number) => void;
  onIssueSelect?: (issue: Issue) => void;
  selectedIssueId?: string;
  /**
   * What the viewer is doing here. The hint bar has to tell the truth about
   * the surface: a read-only console map must not tell the viewer to drop a
   * pin.
   */
  mode?: "report" | "monitor";
  /** Draw the card chrome around the map. Off when the map sits in a panel. */
  framed?: boolean;
  /** What the pin popup's action does on this surface. */
  actionLabel?: string;
  className?: string;
}

const NYAYO_BOUNDS: LatLngBoundsExpression = [
  [-1.322, 36.895],
  [-1.3, 36.925],
];

export default function MapView({
  issues,
  onValidClick,
  onIssueSelect,
  selectedIssueId,
  mode = "report",
  framed = true,
  actionLabel,
  className,
}: MapViewProps) {
  const { resolvedMode } = useTheme();
  const [draftLocation, setDraftLocation] = useState<[number, number] | null>(null);
  const [notice, setNotice] = useState<{
    tone: "info" | "warning" | "danger";
    title: string;
    description?: string;
  } | null>(null);

  // The base map follows the app's mode until the viewer picks one, so a
  // dark-mode app never opens onto a bright white map.
  const [basemap, setBasemap] = useState<BasemapId>(
    resolvedMode === "dark" ? "dark" : "street",
  );
  const basemapChosenByUser = useRef(false);

  useEffect(() => {
    if (basemapChosenByUser.current) return;
    setBasemap(resolvedMode === "dark" ? "dark" : "street");
  }, [resolvedMode]);

  const active = useMemo(
    () => BASEMAPS.find((map) => map.id === basemap) ?? BASEMAPS[0],
    [basemap],
  );

  // Only the reports that are actually drawn as pins. The legend counts
  // these, so a count never describes a pin that is not on the map.
  const shown = useMemo(() => issues.filter(isShownOnMap), [issues]);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (isInsideNyayoEstate(lat, lng)) {
        setNotice(null);
        setDraftLocation([lat, lng]);
      } else {
        setNotice({
          tone: "warning",
          title: "That point is outside the estate",
          description:
            "Reports are only accepted inside the Nyayo Estate boundary. Pick a spot inside the outlined area.",
        });
      }
    },
    [],
  );

  const handleConfirmDraft = useCallback(() => {
    if (draftLocation) {
      onValidClick(draftLocation[0], draftLocation[1]);
      setDraftLocation(null);
    }
  }, [draftLocation, onValidClick]);

  const handleBasemapChange = useCallback((id: BasemapId) => {
    basemapChosenByUser.current = true;
    setBasemap(id);
  }, []);

  const hint =
    mode === "report"
      ? "Click inside the outlined estate boundary to drop a pin, then drag it to fine-tune."
      : "Select a pin to read the report. Use the controls to zoom or switch the base map.";

  const body = (
    <>
      <div className="relative min-h-[22rem] flex-1 overflow-hidden rounded-xl border border-border shadow-soft">
        <MapContainer
          center={NYAYO_CENTER}
          zoom={NYAYO_DEFAULT_ZOOM}
          minZoom={14}
          maxBounds={NYAYO_BOUNDS}
          maxBoundsViscosity={1.0}
          className="z-0 h-full w-full bg-background"
        >
          <TileLayer
            key={active.id}
            url={active.url}
            attribution={active.attribution}
            maxNativeZoom={active.maxNativeZoom}
            maxZoom={active.maxZoom}
          />

          {/* The estate boundary, labelled - a reader should never have to
              guess which area the map is showing them. */}
          <GeoJSON
            data={nyayoEstateBoundary}
            style={{
              color: "var(--primary)",
              weight: 2,
              fillColor: "var(--primary)",
              fillOpacity: 0.1,
            }}
            onEachFeature={(feature, layer) => {
              layer.bindTooltip("Nyayo Estate", {
                permanent: true,
                direction: "center",
                className: "map-boundary-label",
              });
            }}
          />

          {/* Access gate markers */}
          {NYAYO_GATES.map((gate) => (
            <Marker
              key={gate.id}
              position={gate.position}
              icon={L.divIcon({
                className: "bg-transparent border-none",
                html: `
                  <div class="flex items-center gap-1 rounded-md border border-black/30 bg-[#b45309] px-2 py-0.5 text-[10px] font-bold text-white shadow-md whitespace-nowrap cursor-pointer transition-transform hover:scale-105 hover:bg-[#92400e]">
                    🚪 <span>${gate.name}</span>
                  </div>
                `,
                iconSize: [85, 22],
                iconAnchor: [42, 11],
              })}
            >
              <Popup className="custom-popup">
                <div className="min-w-[180px] space-y-1.5 bg-card p-1 text-xs text-card-foreground">
                  <div className="flex items-center justify-between border-b border-border pb-1">
                    <p className="font-bold text-foreground">🚪 {gate.name}</p>
                    <Badge
                      variant="outline"
                      className="border-amber-600/40 bg-amber-600/10 text-[9px] text-amber-700 dark:text-amber-400"
                    >
                      Access Gate
                    </Badge>
                  </div>
                  <p className="text-[11px] leading-snug text-muted-foreground">
                    {gate.description}
                  </p>
                  <span className="inline-block rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-foreground">
                    <strong>Serves:</strong> {gate.phasesServed}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Active community issues */}
          {shown.map((issue) => (
            <IssueMarker
              key={issue.id}
              issue={issue}
              onIssueSelect={onIssueSelect}
              actionLabel={actionLabel}
            />
          ))}

          <InteractionHandler
            onMapClick={handleMapClick}
            disabled={draftLocation !== null}
          />

          {draftLocation && (
            <DraftMarker
              position={draftLocation}
              onDragEnd={(lat, lng) => setDraftLocation([lat, lng])}
              onConfirm={handleConfirmDraft}
              onCancel={() => setDraftLocation(null)}
              onError={(message) =>
                setNotice({ tone: "warning", title: "Pin left the boundary", description: message })
              }
            />
          )}

          <FocusIssue issue={issues.find((i) => i.id === selectedIssueId)} />
          <MapSizeObserver />
          <MapScale />

          <div className="leaflet-top leaflet-right z-[1000] !mt-3 !mr-3 flex flex-col items-end gap-2">
            <LocationButton
              onLocationFound={handleMapClick}
              onError={(message) =>
                setNotice({
                  tone: "danger",
                  title: "Location unavailable",
                  description: message,
                })
              }
            />
            <MapBasemapSwitch value={basemap} onChange={handleBasemapChange} />
          </div>
        </MapContainer>

        {notice && (
          <MapNotice
            tone={notice.tone}
            title={notice.title}
            description={notice.description}
            onDismiss={() => setNotice(null)}
          />
        )}

        <MapLegend issues={shown} />
      </div>
    </>
  );

  if (!framed) return <div className={cn("flex h-full w-full flex-col", className)}>{body}</div>;

  return (
    <div
      className={cn(
        "flex h-full w-full flex-col gap-3 rounded-2xl border border-border bg-card p-4 text-card-foreground shadow-soft",
        className,
      )}
    >
      {/* Hint bar */}
      <div className="flex items-center gap-2.5 rounded-xl border border-border bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
        {mode === "report" ? (
          <MousePointerClick className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        ) : (
          <Info className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        )}
        <span>
          {mode === "report" ? (
            <>
              <strong className="text-foreground">To report: </strong>
              {hint}
            </>
          ) : (
            hint
          )}
        </span>
      </div>
      {body}
    </div>
  );
}
