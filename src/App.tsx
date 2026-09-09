import { useState } from "react";
import MapView from "./components/MapView";
import ReportForm from "./components/ReportForm";
import FilterBar from "./components/FilterBar";
import IssueFeed from "./components/IssueFeed";
import { useIssues } from "./hooks/useIssues";
import PlannerConsole from "./admin/pages/PlannerConsole";

type ViewMode = "feed" | "map";
type PendingPoint = { lat: number; lng: number };

export default function App() {
  if (window.location.pathname.startsWith("/planner")) {
    return <PlannerConsole />;
  }

  const {
    issues,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
  } = useIssues();

  const [viewMode, setViewMode] = useState<ViewMode>("feed");
  const [pendingPoint, setPendingPoint] = useState<PendingPoint | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);

  function handleStartReporting() {
    setViewMode("map");
    setIsSelectingLocation(true);
  }

  function handleValidClick(lat: number, lng: number) {
    setPendingPoint({ lat, lng });
  }

  function handleFormClose() {
    setPendingPoint(null);
    setIsSelectingLocation(false);
  }

  function handleSubmitted() {
    setPendingPoint(null);
    setIsSelectingLocation(false);
    setViewMode("feed"); // Return to social feed post submission
    setJustSubmitted(true);
    setTimeout(() => setJustSubmitted(false), 4000);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-[1200] px-4 py-3 flex items-center justify-between shadow-xs">
        <h1 className="font-bold text-lg text-blue-600 tracking-tight">
          Kilimani Ward
        </h1>

        {/* View Switcher Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => {
              setViewMode("feed");
              setIsSelectingLocation(false);
            }}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === "feed"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            💬 Feed
          </button>
          <button
            onClick={() => setViewMode("map")}
            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
              viewMode === "map"
                ? "bg-white text-gray-900 shadow-xs"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            🗺️ Map
          </button>
        </div>

        <button
          onClick={handleStartReporting}
          className="bg-blue-600 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Report
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 relative overflow-hidden">
        {/* Floating Category/Status Filters */}
        <div className="p-3 bg-white border-b border-gray-200 flex justify-center sticky top-0 z-[1000]">
          <FilterBar
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
          />
        </div>

        {/* Dynamic View Rendering */}
        {viewMode === "feed" ? (
          <IssueFeed issues={issues} onReportClick={handleStartReporting} />
        ) : (
          <div className="h-[calc(100vh-105px)] w-full relative">
            {isSelectingLocation && !pendingPoint && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-900/90 text-white text-xs px-4 py-2 rounded-full z-[1100] shadow-lg border border-blue-400 backdrop-blur-xs">
                📍 Tap anywhere inside Kilimani Ward to pinpoint your issue
              </div>
            )}
            <MapView issues={issues} onValidClick={handleValidClick} />
          </div>
        )}
      </main>

      {/* Modal Form Overlay */}
      {pendingPoint && (
        <ReportForm
          lat={pendingPoint.lat}
          lng={pendingPoint.lng}
          existingIssues={issues}
          onClose={handleFormClose}
          onSubmitted={handleSubmitted}
        />
      )}

      {/* Toast Notification */}
      {justSubmitted && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-green-600 text-white text-xs px-4 py-2 rounded-lg shadow-xl z-[1300] animate-bounce">
          Report published to feed successfully!
        </div>
      )}
    </div>
  );
}