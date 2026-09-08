import { useState } from "react";
import MapView from "./components/MapView";
import ReportForm from "./components/ReportForm";
import StatsPanel from "./components/StatsPanel";
import FilterBar from "./components/FilterBar";
import { useIssues } from "./hooks/useIssues";

type PendingPoint = { lat: number; lng: number };

export default function App() {
  const {
    issues,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
  } = useIssues();

  const [pendingPoint, setPendingPoint] = useState<PendingPoint | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);

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
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Interactive Map */}
      <MapView issues={issues} onValidClick={handleValidClick} />

      {/* Top Left Floating Filter Controls */}
      <div className="absolute top-4 left-14 z-[1000] max-w-[calc(100vw-22rem)] hidden sm:block">
        <FilterBar
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
        />
      </div>

      {/* Floating Report Form Modal */}
      {pendingPoint && (
        <ReportForm
          lat={pendingPoint.lat}
          lng={pendingPoint.lng}
          onClose={handleFormClose}
          onSubmitted={handleSubmitted}
        />
      )}

      {/* Submission Toast Notification */}
      {justSubmitted && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white shadow-lg rounded-lg px-4 py-2 text-sm z-[1100] animate-bounce">
          Report submitted — it'll appear on the map shortly.
        </div>
      )}

      {/* Right Floating Stats Panel */}
      <div className="absolute top-4 right-4 z-[1000]">
        <StatsPanel issues={issues} />
      </div>
    </div>
  );
}