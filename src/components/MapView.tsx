import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import type {
  LeafletMouseEvent,
  Marker as LeafletMarker,
  LatLngBoundsExpression,
} from "leaflet";
import {
  Locate,
  Loader2,
  Info,
  ShieldAlert,
  MapPin,
  Check,
  X,
} from "lucide-react";
import {
  kilimaniBoundary,
  KILIMANI_CENTER,
  KILIMANI_DEFAULT_ZOOM,
} from "../data/kilimaniBoundary";
import { isInsideKilimani } from "../lib/boundaryCheck";
import { createCategoryDivIcon } from "../lib/leafletIcon";
import { CategoryIcon } from "./CategoryIcon";
import type { Issue } from "../types/issue";
import { CATEGORY_LABELS } from "../types/issue";
import { relativeTime } from "../lib/relativeTime";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { reverseGeocode } from "../lib/reverseGeocode";
import "leaflet/dist/leaflet.css";

interface MapViewProps {
  issues: Issue[];
  onValidClick: (lat: number, lng: number) => void;
  onIssueSelect?: (issue: Issue) => void;
  selectedIssueId?: string;
}

const KILIMANI_BOUNDS: LatLngBoundsExpression = [
  [-1.305, 36.77],
  [-1.275, 36.81],
];

// 1. Interaction Handler (Now ignores map clicks if a draft pin is already open)
function InteractionHandler({
  onMapClick,
  disabled,
}: {
  onMapClick: (lat: number, lng: number) => void;
  disabled: boolean;
}) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      if (disabled) return; // Prevent background clicks while popup is active
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// 2. Draggable Marker with Error Handling and Click Protection
function DraftMarker({
  position,
  onDragEnd,
  onConfirm,
  onCancel,
}: {
  position: [number, number];
  onDragEnd: (lat: number, lng: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [address, setAddress] = useState<string>("Detecting street name...");
  const markerRef = useRef<LeafletMarker | null>(null);

  useEffect(() => {
    let isMounted = true;
    setAddress("Detecting street name...");

    reverseGeocode(position[0], position[1])
      .then((res) => {
        if (isMounted) {
          setAddress(res || "Address not found. You can still confirm.");
        }
      })
      .catch((error) => {
        console.error("Geocoding failed:", error);
        if (isMounted) {
          setAddress("Address not found. You can still confirm.");
        }
      });

    return () => {
      isMounted = false;
    };
  }, [position[0], position[1]]);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [position]);

  const draftIcon = L.divIcon({
    className: "bg-transparent border-none",
    html: `<div class="relative flex items-center justify-center w-8 h-8">
            <div class="absolute w-6 h-6 bg-primary rounded-full animate-ping opacity-75"></div>
            <div class="relative w-4 h-4 bg-primary border-2 border-primary-foreground rounded-full shadow-md"></div>
           </div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });

  return (
    <Marker
      position={position}
      draggable={true}
      icon={draftIcon}
      ref={markerRef}
      eventHandlers={{
        dragend: (e) => {
          const marker = e.target;
          const pos = marker.getLatLng();
          if (isInsideKilimani(pos.lat, pos.lng)) {
            onDragEnd(pos.lat, pos.lng);
          } else {
            alert("Please keep the pin inside Kilimani Ward.");
            onDragEnd(position[0], position[1]);
          }
        },
      }}
    >
      <Popup
        closeButton={false}
        closeOnClick={false}
        autoClose={false}
        className="custom-popup"
      >
        <div className="p-2 min-w-50 space-y-3">
          <div className="text-center space-y-1.5">
            <p className="text-xs font-bold text-foreground flex items-center justify-center gap-1">
              <MapPin className="h-4 w-4 text-primary" /> Adjust Location
            </p>
            <p className="text-[11px] text-muted-foreground font-medium leading-tight">
              {address}
            </p>
            <p className="text-[9px] text-muted-foreground italic bg-muted/50 py-1 rounded">
              Drag the pulsing pin to fine-tune
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="w-1/2 h-8 text-xs"
              onClick={(e) => {
                e.stopPropagation(); // Stops click from hitting the map
                onCancel();
              }}
            >
              <X className="h-3 w-3 mr-1" /> Cancel
            </Button>
            <Button
              size="sm"
              className="w-1/2 h-8 text-xs"
              onClick={(e) => {
                e.stopPropagation(); // Stops click from hitting the map
                onConfirm();
              }}
            >
              <Check className="h-3 w-3 mr-1" /> Confirm
            </Button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}

function LocationButton({
  onLocationFound,
}: {
  onLocationFound: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  function handleLocate() {
    setLocating(true);
    map.locate({
      setView: true,
      maxZoom: 16,
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  }

  useEffect(() => {
    function handleLocationFound(e: any) {
      setLocating(false);
      if (isInsideKilimani(e.latlng.lat, e.latlng.lng)) {
        onLocationFound(e.latlng.lat, e.latlng.lng);
      } else {
        alert("Your current GPS location is outside Kilimani Ward.");
      }
    }

    function handleLocationError(e: any) {
      setLocating(false);
      alert("Unable to retrieve high-accuracy GPS location: " + e.message);
    }

    map.on("locationfound", handleLocationFound);
    map.on("locationerror", handleLocationError);

    return () => {
      map.off("locationfound", handleLocationFound);
      map.off("locationerror", handleLocationError);
    };
  }, [map, onLocationFound]);

  return (
    <div className="leaflet-top leaflet-left top-20!">
      <div className="leaflet-control leaflet-bar border-0 overflow-hidden rounded-md shadow-xs">
        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          title="Find my location"
          className="bg-card hover:bg-accent text-card-foreground p-2 text-xs flex items-center justify-center w-8 h-8 cursor-pointer disabled:opacity-50 transition-colors border border-border rounded-md"
        >
          {locating ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Locate className="h-4 w-4 text-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}

function FocusIssue({ issue }: { issue?: Issue }) {
  const map = useMap();
  useEffect(() => {
    if (issue) {
      map.setView([issue.lat, issue.lng], Math.max(map.getZoom(), 16), {
        animate: true,
      });
    }
  }, [issue, map]);
  return null;
}

function MapSizeObserver() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });
    resizeObserver.observe(container);
    const frame = window.requestAnimationFrame(() =>
      map.invalidateSize({ animate: false }),
    );

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [map]);

  return null;
}

export default function MapView({
  issues,
  onValidClick,
  onIssueSelect,
  selectedIssueId,
}: MapViewProps) {
  const [draftLocation, setDraftLocation] = useState<[number, number] | null>(
    null,
  );

  function handleMapClick(lat: number, lng: number) {
    if (isInsideKilimani(lat, lng)) {
      setDraftLocation([lat, lng]);
    } else {
      alert("Please pick a location inside Kilimani Ward.");
    }
  }

  function handleConfirmDraft() {
    if (draftLocation) {
      onValidClick(draftLocation[0], draftLocation[1]);
      setDraftLocation(null);
    }
  }

  return (
    <div className="flex flex-col gap-3 p-4 rounded-xl border border-border bg-card shadow-sm w-full h-full">
      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border">
        <Info className="h-4 w-4 text-primary shrink-0" />
        <span>
          <strong className="text-foreground">Instructions:</strong> Click or
          tap anywhere inside the highlighted boundary to drop a location pin.
          Drag the pin to adjust, then confirm to report an issue.
        </span>
      </div>

      <div className="relative w-full h-112.5 rounded-lg border border-border overflow-hidden">
        <MapContainer
          center={KILIMANI_CENTER}
          zoom={KILIMANI_DEFAULT_ZOOM}
          minZoom={14}
          maxBounds={KILIMANI_BOUNDS}
          maxBoundsViscosity={1.0}
          className="map-container h-full w-full z-0 bg-background"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <GeoJSON
            data={kilimaniBoundary}
            style={{
              color: "var(--primary)",
              weight: 2,
              fillColor: "var(--primary)",
              fillOpacity: 0.1,
            }}
          />

          {issues.map((issue) => {
            const isSec =
              issue.is_security_alert || issue.category === "security";

            return (
              <Marker
                key={issue.id}
                position={[issue.lat, issue.lng]}
                icon={createCategoryDivIcon(issue.category)}
                eventHandlers={{
                  click: () => onIssueSelect?.(issue),
                }}
              >
                <Popup className="custom-popup">
                  <div className="p-1 space-y-2 max-w-xs text-xs text-card-foreground">
                    {isSec && (
                      <div className="bg-destructive text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded flex items-center justify-between">
                        <span className="flex items-center gap-1">
                          <ShieldAlert className="h-3 w-3" /> SECURITY ALERT
                        </span>
                        {issue.unsafe_time && <span>{issue.unsafe_time}</span>}
                      </div>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="outline"
                        className="flex items-center gap-1 text-[10px] uppercase font-bold border-border bg-muted/50 text-foreground"
                      >
                        <CategoryIcon
                          category={issue.category}
                          className="h-3 w-3 text-primary"
                        />
                        {CATEGORY_LABELS[issue.category] || issue.category}
                      </Badge>
                      <Badge
                        variant={
                          issue.status === "resolved" ? "default" : "secondary"
                        }
                        className="capitalize text-[10px]"
                      >
                        {issue.status}
                      </Badge>
                    </div>

                    <p className="font-medium text-foreground text-xs leading-snug">
                      {issue.description}
                    </p>

                    {issue.photo_base64 && (
                      <img
                        src={issue.photo_base64}
                        alt="Report attachment"
                        className="w-full h-28 object-cover rounded-md border border-border bg-muted"
                      />
                    )}

                    {issue.address && (
                      <p className="text-muted-foreground text-[11px] flex items-center gap-1">
                        <span>📍</span> {issue.address}
                      </p>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <p className="text-muted-foreground text-[10px]">
                        {relativeTime(issue.created_at)}
                      </p>
                      <button
                        type="button"
                        className="text-xs font-semibold text-primary hover:underline cursor-pointer"
                        onClick={() => {
                          window.location.href = `/planner/issues/${issue.id}`;
                        }}
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

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
            />
          )}

          <FocusIssue
            issue={issues.find((issue) => issue.id === selectedIssueId)}
          />
          <MapSizeObserver />
          <LocationButton onLocationFound={handleMapClick} />
        </MapContainer>
      </div>
    </div>
  );
}
