import { useEffect, useState } from "react";
import MapView from "./components/MapView";
import Navbar from "./features/resident/components/Navbar";
import Sidebar, { NavTab } from "./features/resident/components/Sidebar";
import ReportForm from "./features/resident/components/ReportForm";
import FilterBar from "./features/resident/components/FilterBar";
import IssueFeed from "./features/resident/components/IssueFeed";
import StatsPanel from "./features/resident/components/StatsPanel";
import ResidentNotifications from "./features/resident/components/ResidentNotifications";
import AboutSection from "./features/resident/components/AboutSection";
import PageSkeleton from "./components/PageSkeleton";
import { useIssues } from "./features/resident/hooks/useIssues";
import { MapPin } from "lucide-react";
import PlannerConsole from "./admin/pages/PlannerConsole";
import { OfficialDashboard } from "./officials/pages/OfficialDashboard";
import type { Issue } from "./types/issue";
import {
  getResidentNotificationIds,
  setResidentNotificationIds,
} from "./lib/notificationStorage";

type ViewMode = "feed" | "map" | "analytics" | "notifications" | "about";
type PendingPoint = { lat: number; lng: number };
const RESIDENT_NOTIFICATIONS_KEY = "kiliplanner-resident-notifications-enabled";

export default function App() {
  if (window.location.pathname.startsWith("/planner")) {
    return <PlannerConsole />;
  }

  if (window.location.pathname.startsWith("/officials")) {
    return (
      <OfficialDashboard officialId="a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" />
    );
  }

  const {
    issues,
    allIssues,
    loading,
    error,
    selectedCategory,
    setSelectedCategory,
    selectedStatus,
    setSelectedStatus,
    newIssue,
    updateIssue,
    deleteIssue,
    refresh,
  } = useIssues();

  const [viewMode, setViewMode] = useState<ViewMode>("feed");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingPoint, setPendingPoint] = useState<PendingPoint | null>(null);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [focusedIssueId, setFocusedIssueId] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem(RESIDENT_NOTIFICATIONS_KEY) === "true",
  );
  const [residentNotificationIds, setResidentNotificationIdsState] = useState<
    string[]
  >(() => getResidentNotificationIds());

  function updateResidentNotificationIds(
    update: string[] | ((current: string[]) => string[]),
  ) {
    setResidentNotificationIdsState((current) => {
      const next = typeof update === "function" ? update(current) : update;
      setResidentNotificationIds(next);
      return next;
    });
  }

  useEffect(() => {
    if (!newIssue || !notificationsEnabled) return;
    updateResidentNotificationIds((current) =>
      current.includes(newIssue.id)
        ? current
        : [newIssue.id, ...current].slice(0, 20),
    );
  }, [newIssue, notificationsEnabled]);

  const openCount = allIssues.filter((i) => i.status === "open").length;
  const resolvedCount = allIssues.filter((i) => i.status === "resolved").length;

  function handleStartReporting() {
    setFocusedIssueId(null);
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
    setFocusedIssueId(null);
    setViewMode("feed");
    setJustSubmitted(true);
    setTimeout(() => setJustSubmitted(false), 4000);
  }

  function handleTabSelect(tab: NavTab) {
    setFocusedIssueId(null);
    setViewMode(tab as ViewMode);
    if (tab !== "map") {
      setIsSelectingLocation(false);
    }
  }

  function handleAnalyticsDetailClick(issueId: string) {
    setFocusedIssueId(issueId);
    setSelectedCategory("all");
    setSelectedStatus("all");
    setViewMode("feed");
  }

  function handleShowAllReports() {
    setFocusedIssueId(null);
  }

  function handleEnableResidentNotifications() {
    localStorage.setItem(RESIDENT_NOTIFICATIONS_KEY, "true");
    setNotificationsEnabled(true);
  }

  function handleDisableResidentNotifications() {
    localStorage.setItem(RESIDENT_NOTIFICATIONS_KEY, "false");
    setNotificationsEnabled(false);
    updateResidentNotificationIds([]);
  }

  function handleNotificationIssueSelect(issueId: string) {
    updateResidentNotificationIds((current) =>
      current.filter((id) => id !== issueId),
    );
    handleAnalyticsDetailClick(issueId);
  }

  const handleUpdateIssue = async (
    issueId: string,
    updates: Partial<Issue>,
  ) => {
    try {
      await updateIssue(issueId, updates);
    } catch (error) {
      console.error("Error updating issue:", error);
      throw error;
    }
  };

  const handleDeleteIssue = async (issueId: string) => {
    try {
      await deleteIssue(issueId);
    } catch (error) {
      console.error("Failed to delete issue:", error);
      throw error;
    }
  };

  const focusedIssue = focusedIssueId
    ? allIssues.find((issue) => String(issue.id) === String(focusedIssueId))
    : null;
  const feedIssues = focusedIssueId
    ? focusedIssue
      ? [focusedIssue]
      : []
    : issues;

  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden">
      <Navbar
        onOpenSidebar={() => setSidebarOpen(true)}
        onReportClick={handleStartReporting}
        onNotificationsClick={() => setViewMode("notifications")}
        unreadCount={notificationsEnabled ? residentNotificationIds.length : 0}
      />

      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={viewMode as NavTab}
          onSelectTab={handleTabSelect}
          openCount={openCount}
          resolvedCount={resolvedCount}
        />

        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
          {((viewMode === "feed" && !focusedIssueId) || viewMode === "map") && (
            <div className="p-3 bg-card border-b border-border flex justify-center sticky top-0 z-30 shadow-xs">
              <FilterBar
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
              />
            </div>
          )}

          {error && (
            <div className="bg-destructive/15 text-destructive text-xs p-3 text-center border-b border-destructive/20">
              {error}
            </div>
          )}

          {loading ? (
            <PageSkeleton variant="resident" onRetry={refresh} />
          ) : (
            <>
              {viewMode === "feed" && (
                <div className="flex-1 py-4">
                  <IssueFeed
                    issues={feedIssues}
                    onReportClick={handleStartReporting}
                    targetIssueId={focusedIssueId}
                    isFocusedView={Boolean(focusedIssueId)}
                    onShowAllReports={handleShowAllReports}
                    onUpdateIssue={handleUpdateIssue}
                    onDeleteIssue={handleDeleteIssue}
                  />
                </div>
              )}

              {viewMode === "map" && (
                <div className="flex-1 w-full relative min-h-125">
                  {isSelectingLocation && !pendingPoint && (
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-medium px-4 py-2 rounded-full z-20 shadow-lg border border-primary/20 animate-fade-in flex items-center gap-1.5">
                      <MapPin className="h-4 w-4" />
                      <span>
                        Tap anywhere on the map to pinpoint your issue
                      </span>
                    </div>
                  )}
                  <MapView issues={issues} onValidClick={handleValidClick} />
                </div>
              )}

              {viewMode === "analytics" && (
                <div className="flex-1 flex justify-center p-4">
                  <StatsPanel
                    issues={allIssues}
                    onNavigateToFeed={handleAnalyticsDetailClick}
                  />
                </div>
              )}

              {viewMode === "notifications" && (
                <ResidentNotifications
                  issues={allIssues}
                  unreadIssueIds={residentNotificationIds}
                  notificationsEnabled={notificationsEnabled}
                  onEnableNotifications={handleEnableResidentNotifications}
                  onDisableNotifications={handleDisableResidentNotifications}
                  onIssueSelect={handleNotificationIssueSelect}
                  onMarkAllRead={() => updateResidentNotificationIds([])}
                />
              )}

              {viewMode === "about" && <AboutSection />}

              {pendingPoint && (
                <ReportForm
                  lat={pendingPoint.lat}
                  lng={pendingPoint.lng}
                  existingIssues={allIssues}
                  onClose={handleFormClose}
                  onSubmitted={handleSubmitted}
                />
              )}

              {justSubmitted && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-4 py-2.5 rounded-lg shadow-xl z-50 animate-bounce font-medium">
                  Report published to feed successfully!
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
