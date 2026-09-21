import { useEffect } from "react";
import { useMap } from "react-leaflet";
import type { Issue } from "../../types/issue";

export function FocusIssue({ issue }: { issue?: Issue }) {
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

export function MapSizeObserver() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();
    const resizeObserver = new ResizeObserver(() => {
      map.invalidateSize({ animate: false });
    });
    resizeObserver.observe(container);
    const frame = window.requestAnimationFrame(() =>
      map.invalidateSize({ animate: false })
    );

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
    };
  }, [map]);

  return null;
}