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
}

export function DraftMarker({
  position,
  onDragEnd,
  onConfirm,
  onCancel,
}: DraftMarkerProps) {
  const [address, setAddress] = useState<string>("Detecting street name...");
  const markerRef = useRef<LeafletMarker | null>(null);

  useEffect(() => {
    let isMounted = true;
    setAddress("Detecting street name...");

    reverseGeocode(position[0], position[1])
      .then((res) => {
        if (isMounted) setAddress(res || "Address not found. You can still confirm.");
      })
      .catch(() => {
        if (isMounted) setAddress("Address not found. You can still confirm.");
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
    html: `<div class="relative flex items-center justify-center w-8 h-8">
            <div class="absolute w-6 h-6 bg-primary/75 rounded-full animate-ping"></div>
            <div class="relative w-4 h-4 bg-primary border-2 border-background rounded-full shadow-md"></div>
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
            alert("Please keep the pin inside Nyayo Estate.");
            onDragEnd(position[0], position[1]);
          }
        },
      }}
    >
      <Popup closeButton={false} closeOnClick={false} autoClose={false} className="custom-popup">
        <div className="p-2.5 min-w-[200px] space-y-3 bg-card text-card-foreground rounded-xl">
          <div className="text-center space-y-1">
            <p className="text-xs font-bold text-foreground flex items-center justify-center gap-1">
              <MapPin className="h-4 w-4 text-primary" /> Adjust Location
            </p>
            <p className="text-[11px] text-muted-foreground font-medium leading-tight">
              {address}
            </p>
            <p className="text-[9px] text-muted-foreground italic bg-muted/50 py-1 rounded-md">
              Drag the pulsing pin to fine-tune
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="w-1/2 h-8 text-xs rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                onCancel();
              }}
            >
              <X className="h-3 w-3 mr-1" /> Cancel
            </Button>
            <Button
              size="sm"
              className="w-1/2 h-8 text-xs rounded-lg bg-primary text-primary-foreground"
              onClick={(e) => {
                e.stopPropagation();
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