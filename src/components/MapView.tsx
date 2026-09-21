import { useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  LayersControl,
} from "react-leaflet";
import L from "leaflet";
import type { LatLngBoundsExpression } from "leaflet";
import { Info, MapPin } from "lucide-react";

import { nyayoEstateBoundary, NYAYO_CENTER, NYAYO_DEFAULT_ZOOM } from "../data/nyayoEstateBoundary";
import { NYAYO_GATES } from "../data/nyayoLandmarks";
import { isInsideNyayoEstate } from "../lib/boundaryCheck";
import type { Issue } from "../types/issue";
import { Badge } from "./ui/badge";

import { InteractionHandler } from "./map/InteractionHandler";
import { DraftMarker } from "./map/DraftMarker";
import { LocationButton } from "./map/LocationButton";
import { FocusIssue, MapSizeObserver } from "./map/MapHelpers";
import { IssueMarker } from "./map/IssueMarker";

import "leaflet/dist/leaflet.css";

interface MapViewProps {
  issues: Issue[];
  onValidClick: (lat: number, lng: number) => void;
  onIssueSelect?: (issue: Issue) => void;
  selectedIssueId?: string;
}

const NYAYO_BOUNDS: LatLngBoundsExpression = [
  [-1.322, 36.895],
  [-1.300, 36.925],
];

export default function MapView({
  issues,
  onValidClick,
  onIssueSelect,
  selectedIssueId,
}: MapViewProps) {
  const [draftLocation, setDraftLocation] = useState<[number, number] | null>(null);

  function handleMapClick(lat: number, lng: number) {
    if (isInsideNyayoEstate(lat, lng)) {
      setDraftLocation([lat, lng]);
    } else {
      alert("Please pick a location inside Nyayo Estate.");
    }
  }

  function handleConfirmDraft() {
    if (draftLocation) {
      onValidClick(draftLocation[0], draftLocation[1]);
      setDraftLocation(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl border border-border/80 bg-card shadow-sm w-full h-full text-card-foreground">
      {/* Banner */}
      <div className="flex items-center gap-2.5 text-xs text-muted-foreground bg-muted/50 p-3 rounded-xl border border-border/60">
        <Info className="h-4 w-4 text-primary shrink-0" />
        <span>
          <strong className="text-foreground">Instructions:</strong> Click or tap anywhere inside the boundary to drop a pin. Access gates help orient your position.
        </span>
      </div>

      {/* Map Container */}
      <div className="relative w-full h-[450px] rounded-xl border border-border/80 overflow-hidden shadow-inner">
        <MapContainer
          center={NYAYO_CENTER}
          zoom={NYAYO_DEFAULT_ZOOM}
          minZoom={14}
          maxBounds={NYAYO_BOUNDS}
          maxBoundsViscosity={1.0}
          className="h-full w-full z-0 bg-background"
        >
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Street Map">
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
            </LayersControl.BaseLayer>

            <LayersControl.BaseLayer name="Satellite">
              <TileLayer
                attribution="Tiles &copy; Esri"
                url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                maxNativeZoom={19}
                maxZoom={19}
              />
            </LayersControl.BaseLayer>
          </LayersControl>

          {/* Nyayo Estate Boundary with CSS Variables */}
          <GeoJSON
            data={nyayoEstateBoundary}
            style={{
              color: "var(--primary)",
              weight: 2,
              fillColor: "var(--primary)",
              fillOpacity: 0.12,
            }}
          />

          {/* Gate Access Markers */}
          {NYAYO_GATES.map((gate) => (
            <Marker
              key={gate.id}
              position={gate.position}
              icon={L.divIcon({
                className: "bg-transparent border-none",
                html: `
                  <div class="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] px-2 py-0.5 rounded-md shadow-md border border-background whitespace-nowrap cursor-pointer transition-transform hover:scale-105">
                    🚪 <span>${gate.name}</span>
                  </div>
                `,
                iconSize: [85, 22],
                iconAnchor: [42, 11],
              })}
            >
              <Popup className="custom-popup">
                <div className="p-1 text-xs space-y-1.5 min-w-[180px] bg-card text-card-foreground">
                  <div className="flex items-center justify-between border-b border-border pb-1">
                    <p className="font-bold text-foreground">🚪 {gate.name}</p>
                    <Badge variant="outline" className="text-[9px] bg-amber-500/10 text-amber-600 border-amber-300">
                      Access Gate
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">{gate.description}</p>
                  <span className="inline-block bg-muted px-1.5 py-0.5 text-[10px] rounded font-medium text-foreground">
                    <strong>Serves:</strong> {gate.phasesServed}
                  </span>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Active Community Issues */}
          {issues
            .filter((i) => i.status.toLowerCase() !== "resolved" && i.status.toLowerCase() !== "closed")
            .map((issue) => (
              <IssueMarker key={issue.id} issue={issue} onIssueSelect={onIssueSelect} />
            ))}

          <InteractionHandler onMapClick={handleMapClick} disabled={draftLocation !== null} />

          {draftLocation && (
            <DraftMarker
              position={draftLocation}
              onDragEnd={(lat, lng) => setDraftLocation([lat, lng])}
              onConfirm={handleConfirmDraft}
              onCancel={() => setDraftLocation(null)}
            />
          )}

          <FocusIssue issue={issues.find((i) => i.id === selectedIssueId)} />
          <MapSizeObserver />
          <LocationButton onLocationFound={handleMapClick} />
        </MapContainer>
      </div>
    </div>
  );
}