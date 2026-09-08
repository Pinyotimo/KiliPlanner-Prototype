import { useEffect, useState } from "react";
import MapView from "./components/MapView";
import ReportForm from "./components/ReportForm";
import { supabase } from "./lib/supabaseClient";
import type { Issue } from "./types/issue";
import StatsPanel from "./components/StatsPanel";

type PendingPoint = { lat: number; lng: number };

export default function App() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [pendingPoint, setPendingPoint] = useState<PendingPoint | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadIssues() {
      const { data, error } = await supabase
        .from("issues")
        .select("*")
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Failed to load issues:", error.message);
        return;
      }
      if (isMounted && data) setIssues(data as Issue[]);
    }

    loadIssues();

    const channel = supabase
      .channel("issues-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "issues" },
        (payload) => {
          setIssues((current) => [payload.new as Issue, ...current]);
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  function handleValidClick(lat: number, lng: number) {
    setPendingPoint({ lat, lng });
  }

  function handleFormClose() {
    setPendingPoint(null);
  }

  function handleSubmitted() {
    setPendingPoint(null);
    setJustSubmitted(true);
    setTimeout(() => setJustSubmitted(false), 4000);
  }

  return (
    <div className="relative">
      <MapView issues={issues} onValidClick={handleValidClick} />

      {pendingPoint && (
        <ReportForm
          lat={pendingPoint.lat}
          lng={pendingPoint.lng}
          onClose={handleFormClose}
          onSubmitted={handleSubmitted}
        />
      )}

      {justSubmitted && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white shadow-lg rounded-lg px-4 py-2 text-sm z-[1000]">
          Report submitted — it'll appear on the map shortly.
        </div>
      )}

      <div className="absolute top-4 right-4 z-[1000]">
        <StatsPanel issues={issues} />
      </div>
    </div>
  );
}
