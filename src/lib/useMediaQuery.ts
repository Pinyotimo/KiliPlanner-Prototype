import { useEffect, useState } from "react";

/**
 * Tracks a media query so a rail can tell whether it is currently on-canvas
 * or off-canvas. The drawers translate away with CSS, which hides them
 * visually but leaves their links in the tab order - `inert` is what keeps
 * a keyboard from tabbing into a drawer that is not on screen.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(
    () => typeof window !== "undefined" && window.matchMedia(query).matches,
  );

  useEffect(() => {
    const list = window.matchMedia(query);
    const handle = (event: MediaQueryListEvent) => setMatches(event.matches);
    setMatches(list.matches);
    list.addEventListener("change", handle);
    return () => list.removeEventListener("change", handle);
  }, [query]);

  return matches;
}
