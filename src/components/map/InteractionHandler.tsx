import { useMapEvents } from "react-leaflet";
import type { LeafletMouseEvent } from "leaflet";

interface InteractionHandlerProps {
  onMapClick: (lat: number, lng: number) => void;
  disabled: boolean;
}

export function InteractionHandler({ onMapClick, disabled }: InteractionHandlerProps) {
  useMapEvents({
    click(e: LeafletMouseEvent) {
      if (disabled) return;
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}