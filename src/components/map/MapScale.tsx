import { useEffect } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

/**
 * A scale bar.
 *
 * A pin on a map is a claim about a place, and a reader has no way to judge
 * that claim without knowing how far they are looking. The bar turns
 * "somewhere in the estate" into a distance they can check.
 */
export function MapScale() {
  const map = useMap();

  useEffect(() => {
    const control = L.control.scale({
      position: "bottomright",
      metric: true,
      imperial: false,
      maxWidth: 120,
    });
    control.addTo(map);
    return () => {
      control.remove();
    };
  }, [map]);

  return null;
}
