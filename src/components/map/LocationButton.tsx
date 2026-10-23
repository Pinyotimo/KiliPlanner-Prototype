import { useState, useEffect } from "react";
import { useMap } from "react-leaflet";
import { Locate, Loader2 } from "lucide-react";
import { isInsideNyayoEstate } from "../../lib/boundaryCheck";
import { describeLocationError } from "../../lib/geolocation";

interface LocationButtonProps {
  onLocationFound: (lat: number, lng: number) => void;
  /** Called with a message the map can show. No native alerts. */
  onError: (message: string) => void;
}

/**
 * The "find me" control.
 *
 * It asks the browser for a high-accuracy fix and hands the coordinates to
 * the map. A failure - permission refused, no GPS, a fix outside the
 * estate - is reported through `onError` so it can be shown in the map
 * rather than in a native alert that blocks the page.
 */
export function LocationButton({
  onLocationFound,
  onError,
}: LocationButtonProps) {
  const map = useMap();
  const [locating, setLocating] = useState(false);

  function handleLocate() {
    setLocating(true);
    map.locate({
      setView: true,
      maxZoom: 17,
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  }

  useEffect(() => {
    function handleFound(e: any) {
      setLocating(false);
      if (isInsideNyayoEstate(e.latlng.lat, e.latlng.lng)) {
        onLocationFound(e.latlng.lat, e.latlng.lng);
      } else {
        onError(
          "Your device's position is outside Nyayo Estate. Drop the pin on the map instead.",
        );
      }
    }

    function handleError(e: any) {
      setLocating(false);
      onError(describeLocationError(e));
    }

    map.on("locationfound", handleFound);
    map.on("locationerror", handleError);

    return () => {
      map.off("locationfound", handleFound);
      map.off("locationerror", handleError);
    };
  }, [map, onLocationFound, onError]);

  return (
    <div className="leaflet-control overflow-hidden rounded-lg border border-border bg-card/95 shadow-lifted backdrop-blur-sm">
      <button
        type="button"
        onClick={handleLocate}
        disabled={locating}
        title="Find my location"
        aria-label={
          locating ? "Finding your location" : "Find my location on the map"
        }
        className="flex h-9 w-9 cursor-pointer items-center justify-center p-2 text-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring disabled:cursor-wait disabled:opacity-60"
      >
        {locating ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : (
          <Locate className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}
