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
import MarkerClusterGroup from "react-leaflet-cluster";
import type { LeafletMouseEvent, Marker as LeafletMarker, LatLngBoundsExpression } from "leaflet";
import { Locate, Loader2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import "leaflet/dist/leaflet.css";

interface MapViewProps {
  issues: Issue[];
  onValidClick: (lat: number, lng: number) => void;
}

type LatLngPair = [number, number];

const KILIMANI_BOUNDS: LatLngBoundsExpression = [
  [-1.3050, 36.7700],
  [-1.2750, 36.8100],
];

function ClickHandler({
  onValidClick,
}: {
  onValidClick: (lat: number, lng: number) => void;
}) {
  const [rejectedPoint, setRejectedPoint] = useState<LatLngPair | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  useMapEvents({
    click(e: LeafletMouseEvent) {
      const { lat, lng } = e.latlng;

      if (isInsideKilimani(lat, lng)) {
        setRejectedPoint(null);
        onValidClick(lat, lng);
      } else {
        setRejectedPoint([lat, lng]);
      }
    },
  });

  useEffect(() => {
    if (rejectedPoint && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [rejectedPoint]);

  if (!rejectedPoint) return null;

  return (
    <Marker position={rejectedPoint} ref={markerRef}>
      <Popup className="custom-popup">
        <div className="p-1 text-xs text-foreground font-medium">
          Please pick a location inside Kilimani Ward.
        </div>
      </Popup>
    </Marker>
  );
}

function LocationButton() {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  function handleLocate() {
    setLocating(true);
    map.locate({ setView: true, maxZoom: 16 });
  }

  useEffect(() => {
    function onLocationFound(e: any) {
      setLocating(false);
      if (!isInsideKilimani(e.latlng.lat, e.latlng.lng)) {
        alert("Your current location is outside Kilimani Ward.");
      }
    }

    function onLocationError(e: any) {
      setLocating(false);
      alert("Unable to retrieve your location: " + e.message);
    }

    map.on("locationfound", onLocationFound);
    map.on("locationerror", onLocationError);

    return () => {
      map.off("locationfound", onLocationFound);
      map.off("locationerror", onLocationError);
    };
  }, [map]);

  return (
    <div className="leaflet-top leaflet-left !top-20">
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

export default function MapView({ issues, onValidClick }: MapViewProps) {
  return (
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

      <MarkerClusterGroup chunkedLoading>
        {issues.map((issue) => (
          <Marker
            key={issue.id}
            position={[issue.lat, issue.lng]}
            icon={createCategoryDivIcon(issue.category)}
          >
            <Popup className="custom-popup">
              <div className="p-1 space-y-2 max-w-xs text-xs text-card-foreground">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 text-[10px] uppercase font-bold border-border bg-muted/50 text-foreground"
                  >
                    <CategoryIcon category={issue.category} className="h-3 w-3 text-primary" />
                    {CATEGORY_LABELS[issue.category]}
                  </Badge>
                  <Badge
                    variant={issue.status === "resolved" ? "default" : "secondary"}
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

                <p className="text-muted-foreground text-[10px]">
                  {relativeTime(issue.created_at)}
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MarkerClusterGroup>

      <ClickHandler onValidClick={onValidClick} />
      <LocationButton />
    </MapContainer>
  );
}