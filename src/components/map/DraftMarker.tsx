import { useState, useEffect, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import type { Marker as LeafletMarker } from "leaflet";
import { MapPin, Check, X } from "lucide-react";
import { reverseGeocode } from "../../lib/reverseGeocode";
import { isInsideNyayoEstate } from "../../lib/boundaryCheck";
import { Button } from "../ui/button";

interface DraftMarkerProps {
  position: [number, number];
  onDragEnd: (lat: number, lng: number) => void;
  onConfirm: () => void;
  onCancel: () => void;
  /** Reported in the map, not in a native alert. */
  onError: (message: string) => void;
}

export function DraftMarker({
  position,
  onDragEnd,
  onConfirm,
  onCancel,
  onError,
}: DraftMarkerProps) {
  const [address, setAddress] = useState<string | null>(null);
  const markerRef = useRef<LeafletMarker | null>(null);

  useEffect(() => {
    let isMounted = true;
    setAddress(null);

    reverseGeocode(position[0], position[1])
      .then((res) => {
        if (isMounted) setAddress(res || "No landmark found for this point");
      })
      .catch(() => {
        if (isMounted) setAddress("No landmark found for this point");
      });

    return () => {
      isMounted = false;
    };
  }, [position]);

  useEffect(() => {
    if (markerRef.current) markerRef.current.openPopup();
  }, [position]);

  const draftIcon = L.divIcon({
    className: "bg-transparent border-none",
    html: `<div class="relative flex h-8 w-8 items-center justify-center">
            <div class="absolute h-6 w-6 animate-ping rounded-full" style="background-color: color-mix(in oklab, var(--primary) 75%, transparent)"></div>
            <div class="relative h-4 w-4 rounded-full border-2" style="background-color: var(--primary); border-color: var(--background)"></div>
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
          const pos = e.target.getLatLng();
          if (isInsideNyayoEstate(pos.lat, pos.lng)) {
            onDragEnd(pos.lat, pos.lng);
          } else {
            onError(
              "That point is outside the Nyayo Estate boundary. The pin has been put back - move it inside the outlined area.",
            );
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
        <div className="min-w-[220px] space-y-3 rounded-xl bg-card p-3 text-card-foreground">
          <div className="space-y-1 text-center">
            <p className="flex items-center justify-center gap-1 text-xs font-bold text-foreground">
              <MapPin className="h-4 w-4 text-primary" /> Adjust Location
            </p>
            <p className="text-[11px] font-medium leading-tight text-muted-foreground">
              {address ?? "Looking up the nearest landmark..."}
            </p>
            <p className="rounded-md bg-muted/50 py-1 text-[10px] leading-tight text-muted-foreground">
              Drag the pulsing pin to fine-tune, then confirm.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 w-1/2 cursor-pointer rounded-lg text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
            >
              <X className="mr-1 h-3 w-3" /> Cancel
            </Button>
            <Button
              size="sm"
              className="h-8 w-1/2 cursor-pointer rounded-lg text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onConfirm();
              }}
            >
              <Check className="mr-1 h-3 w-3" /> Confirm
            </Button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
