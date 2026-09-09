import { useEffect, useRef, useState } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  Marker,
  Popup,
  CircleMarker,
  useMapEvents,
  useMap,
} from "react-leaflet";
import type { LeafletMouseEvent, Marker as LeafletMarker, LatLngBoundsExpression } from "leaflet";
import {
  kilimaniBoundary,
  KILIMANI_CENTER,
  KILIMANI_DEFAULT_ZOOM,
} from "../data/kilimaniBoundary";
import { isInsideKilimani } from "../lib/boundaryCheck";
import type { Issue } from "../types/issue";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../types/issue";
import { navigateToPlanner } from "../admin/lib/plannerAccess";

interface MapViewProps {
  issues: Issue[];
  onValidClick: (lat: number, lng: number) => void;
  onIssueSelect?: (issue: Issue) => void;
  selectedIssueId?: string;
}

type LatLngPair = [number, number];

// Tight bounding box roughly around Kilimani Ward coordinates
const KILIMANI_BOUNDS: LatLngBoundsExpression = [
  [-1.3050, 36.7700], // Southwest coordinate
  [-1.2750, 36.8100], // Northeast coordinate
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
      <Popup>Please pick a location inside Kilimani Ward.</Popup>
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
      <div className="leaflet-control leaflet-bar">
        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          title="Find my location"
          className="bg-white hover:bg-gray-100 text-gray-800 font-bold p-2 text-xs flex items-center justify-center w-8 h-8 cursor-pointer disabled:opacity-50"
        >
          {locating ? "⌛" : "📍"}
        </button>
      </div>
    </div>
  );
}

function FocusIssue({ issue }: { issue?: Issue }) {
  const map = useMap();
  useEffect(() => {
    if (issue) map.setView([issue.lat, issue.lng], Math.max(map.getZoom(), 16), { animate: true });
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
    const frame = window.requestAnimationFrame(() => map.invalidateSize({ animate: false }));

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [map]);

  return null;
}

export default function MapView({ issues, onValidClick, onIssueSelect, selectedIssueId }: MapViewProps) {
  return (
    <MapContainer
      center={KILIMANI_CENTER}
      zoom={KILIMANI_DEFAULT_ZOOM}
      minZoom={14}
      maxBounds={KILIMANI_BOUNDS}
      maxBoundsViscosity={1.0}
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
          fillOpacity: 0.08,
        }}
      />

      <>
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
            eventHandlers={{ click: () => onIssueSelect?.(issue) }}
          >
            <Popup>
              <div className="text-sm max-w-xs">
                <p className="font-semibold">{issue.description}</p>
                <p className="mb-2 text-xs">{CATEGORY_LABELS[issue.category]} · {issue.status}</p>
                {issue.photo_base64 && (
                  <img
                    src={issue.photo_base64}
                    alt="Report attachments"
                    className="w-full h-32 object-cover rounded-md mb-2 border border-gray-200"
                  />
                )}
                {issue.address && <p className="text-gray-500 text-xs">{issue.address}</p>}
                <p className="text-gray-400 text-[10px]">
                  {new Date(issue.created_at).toLocaleString()}
                </p>
                <button type="button" className="mt-2 text-xs font-semibold text-blue-600" onClick={() => navigateToPlanner(`/planner/issues/${issue.id}`)}>View Details</button>
              </div>  
            </Popup>
          </CircleMarker>
        ))}
      </>

      <ClickHandler onValidClick={onValidClick} />
      <FocusIssue issue={issues.find((issue) => issue.id === selectedIssueId)} />
      <MapSizeObserver />
      <LocationButton />
    </MapContainer>
  );
}