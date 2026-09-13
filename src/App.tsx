import { useEffect, useState } from "react";
import MapView from "./components/MapView";
import Navbar from "./features/resident/components/Navbar";
import Sidebar, { NavTab } from "./features/resident/components/Sidebar";
import ReportForm from "./features/resident/components/ReportForm";
import FilterBar from "./features/resident/components/FilterBar";
import IssueFeed from "./features/resident/components/IssueFeed";
import StatsPanel from "./features/resident/components/StatsPanel";
import ResidentNotifications from "./features/resident/components/ResidentNotifications";
import { useIssues } from "./features/resident/hooks/useIssues";
import { Info, MapPin } from "lucide-react";
import PlannerConsole from "./admin/pages/PlannerConsole";
import { OfficialDashboard } from "./officials/pages/OfficialDashboard";
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

  // Calculate global badge counts against all issues so active filters don't alter stats
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

  const focusedIssue = focusedIssueId
    ? allIssues.find((issue) => issue.id === focusedIssueId)
    : null;
  const feedIssues = focusedIssueId
    ? focusedIssue
      ? [focusedIssue]
      : []
    : issues;

  return (
    <div className="h-screen w-screen bg-background text-foreground flex flex-col overflow-hidden">
      {/* Navbar Header */}
      <Navbar
        onOpenSidebar={() => setSidebarOpen(true)}
        onReportClick={handleStartReporting}
        onNotificationsClick={() => setViewMode("notifications")}
        unreadCount={notificationsEnabled ? residentNotificationIds.length : 0}
      />

      {/* Main Body Layout with Sidebar */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Drawer / Navigation */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={viewMode as NavTab}
          onSelectTab={handleTabSelect}
          openCount={openCount}
          resolvedCount={resolvedCount}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
          {/* Category & Status Filter Bar */}
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

          {/* Error Banner */}
          {error && (
            <div className="bg-destructive/15 text-destructive text-xs p-3 text-center border-b border-destructive/20">
              {error}
            </div>
          )}

          {/* Main Loading & View Routing */}
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12 text-xs text-muted-foreground">
              Loading ward reports...
            </div>
          ) : (
            <>
              {/* Feed View */}
              {viewMode === "feed" && (
                <div className="flex-1 py-4">
                  <IssueFeed
                    issues={feedIssues}
                    onReportClick={handleStartReporting}
                    targetIssueId={focusedIssueId}
                    isFocusedView={Boolean(focusedIssueId)}
                    onShowAllReports={handleShowAllReports}
                  />
                </div>
              )}

              {/* Map View */}
              {viewMode === "map" && (
                <div className="flex-1 w-full relative min-h-[500px]">
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

              {/* Analytics / Stats View */}
              {viewMode === "analytics" && (
                <div className="flex-1 flex justify-center p-4">
                  <StatsPanel
                    issues={allIssues}
                    onNavigateToFeed={handleAnalyticsDetailClick}
                  />
                </div>
              )}

              {/* Notifications View */}
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

              {/* About View */}
              {viewMode === "about" && (
                <div className="max-w-2xl mx-auto p-6 space-y-4">
                  <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-3">
                    <div className="flex items-center gap-2 text-primary font-bold text-lg">
                      <Info className="h-5 w-5" />
                      About Kilimani Ward Civic Platform
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      This platform empowers residents of Kilimani Ward to
                      report, track, and resolve civic infrastructure
                      issues—including water disruptions, road damage, sewage
                      spills, and waste management.
                    </p>
                    <div className="border-t border-border/60 pt-3 text-xs space-y-1">
                      <p className="font-semibold text-foreground">
                        How to submit a report:
                      </p>
                      <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                        <li>Click "Report Issue" in the navigation header.</li>
                        <li>Pinpoint the location on the map.</li>
                        <li>
                          Select a category, attach evidence, and publish.
                        </li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Modal Form Overlay */}
      {pendingPoint && (
        <ReportForm
          lat={pendingPoint.lat}
          lng={pendingPoint.lng}
          existingIssues={allIssues}
          onClose={handleFormClose}
          onSubmitted={handleSubmitted}
        />
      )}

      {/* Toast Notification */}
      {justSubmitted && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-xs px-4 py-2.5 rounded-lg shadow-xl z-50 animate-bounce font-medium">
          Report published to feed successfully!
        </div>
      )}
    </div>
  );
}
