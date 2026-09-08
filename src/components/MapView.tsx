import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  CircleMarker,
  useMapEvents,
} from "react-leaflet";
import type { LeafletMouseEvent, Marker as LeafletMarker } from "leaflet";
import {
  kilimaniBoundary,
  KILIMANI_CENTER,
  KILIMANI_DEFAULT_ZOOM,
} from "../data/kilimaniBoundary";
import { isInsideKilimani } from "../lib/boundaryCheck";
import type { Issue } from "../types/issue";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../types/issue";

interface MapViewProps {
  issues: Issue[];
  /** Called with (lat, lng) only when the click lands inside the boundary. */
  onValidClick: (lat: number, lng: number) => void;
}

type LatLngPair = [number, number];

/**
 * Invisible helper component — react-leaflet's useMapEvents hook only works
 * inside a component rendered as a child of MapContainer, so the click
 * handling logic lives here rather than in MapView itself.
 */
function ClickHandler({
  onValidClick,
}: {
  onValidClick: (lat: number, lng: number) => void;
}) {
  const [rejectedPoint, setRejectedPoint] = useState<LatLngPair | null>(
    null
  );
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
      <Popup>Please pick a location inside Kilimani Ward.</Popup>
    </Marker>
  );
}

export default function MapView({ issues, onValidClick }: MapViewProps) {
  return (
    <MapContainer
      center={KILIMANI_CENTER}
      zoom={KILIMANI_DEFAULT_ZOOM}
      className="map-container"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <GeoJSON
        data={kilimaniBoundary}
        style={{
          color: "#111827",
          weight: 2,
          fillColor: "#3b82f6",
          fillOpacity: 0.05,
        }}
      />

      {issues.map((issue) => (
        <CircleMarker
          key={issue.id}
          center={[issue.lat, issue.lng]}
          radius={8}
          pathOptions={{
            color: CATEGORY_COLORS[issue.category],
            fillColor: CATEGORY_COLORS[issue.category],
            fillOpacity: 0.85,
          }}
        >
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">
                {CATEGORY_LABELS[issue.category]}
              </p>
              <p>{issue.description}</p>
              {issue.address && (
                <p className="text-gray-500">{issue.address}</p>
              )}
              <p className="text-gray-400 text-xs">
                {new Date(issue.created_at).toLocaleString()}
              </p>
            </div>
          </Popup>
        </CircleMarker>
      ))}

      <ClickHandler onValidClick={onValidClick} />
    </MapContainer>
  );
}