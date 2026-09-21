import { useState, useEffect } from "react";
import { useMap } from "react-leaflet";
import { Locate, Loader2 } from "lucide-react";
import { isInsideNyayoEstate } from "../../lib/boundaryCheck";

export function LocationButton({
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
    function handleFound(e: any) {
      setLocating(false);
      if (isInsideNyayoEstate(e.latlng.lat, e.latlng.lng)) {
        onLocationFound(e.latlng.lat, e.latlng.lng);
      } else {
        alert("Your current GPS location is outside Nyayo Estate.");
      }
    }

    function handleError(e: any) {
      setLocating(false);
      alert("Unable to retrieve high-accuracy GPS location: " + e.message);
    }

    map.on("locationfound", handleFound);
    map.on("locationerror", handleError);

    return () => {
      map.off("locationfound", handleFound);
      map.off("locationerror", handleError);
    };
  }, [map, onLocationFound]);

  return (
    <div className="leaflet-top leaflet-left !top-20">
      <div className="leaflet-control leaflet-bar border-none overflow-hidden rounded-lg shadow-md">
        <button
          type="button"
          onClick={handleLocate}
          disabled={locating}
          title="Find my location"
          className="bg-card hover:bg-accent text-card-foreground p-2 text-xs flex items-center justify-center w-9 h-9 cursor-pointer disabled:opacity-50 transition-colors border border-border rounded-lg"
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