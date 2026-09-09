import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";

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

  return { session, loading };
}

export function useLocation(): string {
  const [pathname, setPathname] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return pathname;
}

export function navigateToPlanner(path: string): void {
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}