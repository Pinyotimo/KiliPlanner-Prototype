import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import { getRoleFromSession, resolveAuthState } from "../../lib/authState";

export function usePlannerSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) {
        setSession(data.session);
        setLoading(false);
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const authState = resolveAuthState({
    session,
    role: getRoleFromSession(session),
  });

  return { session, loading, authState };
}

export type PlannerRoute = { pathname: string; search: string };

/**
 * The console's current route.
 *
 * Both halves matter. The pathname says which page is open; the query string
 * says which slice of it is open - "/planner/issues?status=open" is the
 * issues page filtered to the reports that are still open, and the rail has
 * to light up for it exactly as it does for the unfiltered page.
 */
export function useRoute(): PlannerRoute {
  const [route, setRoute] = useState<PlannerRoute>(() => ({
    pathname: window.location.pathname,
    search: window.location.search,
  }));

  useEffect(() => {
    const handlePopState = () =>
      setRoute({
        pathname: window.location.pathname,
        search: window.location.search,
      });
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return route;
}

export function navigateToPlanner(path: string): void {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

/**
 * Replace the current entry rather than stacking a new one.
 *
 * Used for state changes inside a page - a filter moved, a sort changed -
 * which should be shareable in the URL without filling the back button with
 * every keystroke of the process.
 */
export function replacePlannerRoute(path: string): void {
  window.history.replaceState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}