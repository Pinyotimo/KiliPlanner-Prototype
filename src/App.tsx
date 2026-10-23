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
import { Button } from "./components/ui/button";
import PageSkeleton from "./components/PageSkeleton";
import { useIssues } from "./features/resident/hooks/useIssues";
import { MapPin } from "lucide-react";
import PlannerConsole from "./admin/pages/PlannerConsole";
import LandingPage from "./landing/LandingPage";
import { OfficialDashboard } from "./officials/pages/OfficialDashboard";
import type { Issue } from "./types/issue";
import {
  getResidentNotificationIds,
  setResidentNotificationIds,
} from "./lib/notificationStorage";
import {
  publishDevicePing,
  requestNotificationPermission,
  showSecurityAlertNotification,
  subscribeToNearbyAlerts,
} from "./lib/geoFenceNotifications";

type ViewMode = "feed" | "map" | "analytics" | "notifications" | "about";
type PendingPoint = { lat: number; lng: number };
const RESIDENT_NOTIFICATIONS_KEY = "kiliplanner-resident-notifications-enabled";

export default function App() {
  const path = window.location.pathname;

  // The public front door. Everything else is a working surface.
  if (path === "/" || path === "/index.html" || path === "/landing") {
    return <LandingPage />;
  }

  if (path.startsWith("/planner")) {
    return <PlannerConsole />;
  }

  if (path.startsWith("/officials")) {
    return (
      <OfficialDashboard officialId="a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11" />
    );
  }

  return <ResidentApp />;
}

function ResidentApp() {
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
  const [submittedReportId, setSubmittedReportId] = useState<string | null>(null);
  const [isSelectingLocation, setIsSelectingLocation] = useState(false);
  const [focusedIssueId, setFocusedIssueId] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    () => localStorage.getItem(RESIDENT_NOTIFICATIONS_KEY) === "true",
  );
  const [residentNotificationIds, setResidentNotificationIdsState] = useState<
    string[]
  >(() => getResidentNotificationIds());

  useEffect(() => {
    if (!notificationsEnabled || !navigator.geolocation) return;

    let watchId: number | null = null;
    let lastPosition: GeolocationPosition | null = null;
    const publishPosition = (position: GeolocationPosition) => {
      lastPosition = position;
      void publishDevicePing(position, true).catch((error) =>
        console.warn("Could not publish device location:", error),
      );
    };

    watchId = navigator.geolocation.watchPosition(
      publishPosition,
      (error) => {
        console.warn(
          "Location permission is required for nearby alerts:",
          error,
        );
      },
      { enableHighAccuracy: false, maximumAge: 60000, timeout: 10000 },
    );
    const heartbeat = window.setInterval(() => {
      if (lastPosition) publishPosition(lastPosition);
    }, 60000);

    const unsubscribe = subscribeToNearbyAlerts((issue) => {
      updateResidentNotificationIds((current) =>
        current.includes(issue.id)
          ? current
          : [issue.id, ...current].slice(0, 20),
      );
      showSecurityAlertNotification(issue);
    });

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      window.clearInterval(heartbeat);
      unsubscribe();
    };
  }, [notificationsEnabled]);

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

  const openCount = allIssues.filter((i) =>
    ["UNVERIFIED", "UNDER_REVIEW", "CORROBORATED", "VERIFIED"].includes(i.status),
  ).length;
  const resolvedCount = allIssues.filter((i) => i.status === "RESOLVED").length;

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

  function handleSubmitted(reportId?: string) {
    setPendingPoint(null);
    setIsSelectingLocation(false);
    setFocusedIssueId(null);
    setViewMode("feed");
    setJustSubmitted(true);
    setSubmittedReportId(reportId ?? null);
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

  function dismissSubmissionConfirmation() {
    setSubmittedReportId(null);
    setJustSubmitted(false);
  }

  async function handleEnableResidentNotifications() {
    await requestNotificationPermission();

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
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
      <Navbar
        onOpenSidebar={() => setSidebarOpen(true)}
        onReportClick={handleStartReporting}
        onNotificationsClick={() => setViewMode("notifications")}
        unreadCount={notificationsEnabled ? residentNotificationIds.length : 0}
      />

      <div className="relative flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeTab={viewMode as NavTab}
          onSelectTab={handleTabSelect}
          openCount={openCount}
          resolvedCount={resolvedCount}
        />

        <main className="relative flex min-w-0 flex-1 flex-col overflow-y-auto">
          {((viewMode === "feed" && !focusedIssueId) || viewMode === "map") && (
            <div className="sticky top-0 z-30 flex justify-center border-b border-border bg-card/85 p-3 backdrop-blur-xl">
              <FilterBar
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                selectedStatus={selectedStatus}
                onStatusChange={setSelectedStatus}
              />
            </div>
          )}

          {error && (
            <div className="border-b border-destructive/25 bg-destructive/10 p-3 text-center text-xs text-destructive">
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
                <div className="relative min-h-125 w-full flex-1">
                  {isSelectingLocation && !pendingPoint && (
                    <div className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 animate-fade-in items-center gap-1.5 rounded-full border border-primary/25 bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow-lifted">
                      <MapPin className="h-4 w-4" />
                      <span>
                        Tap anywhere on the map to pinpoint your issue
                      </span>
                    </div>
                  )}
                  <MapView
                    issues={issues}
                    onValidClick={handleValidClick}
                    onIssueSelect={(issue) =>
                      handleAnalyticsDetailClick(String(issue.id))
                    }
                  />
                </div>
              )}

              {viewMode === "analytics" && (
                <div className="flex flex-1 justify-center p-4">
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
                <div className="fixed bottom-6 left-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 rounded-xl border border-primary/30 bg-card p-4 text-card-foreground shadow-floating">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/15 text-sm text-success">
                      ✓
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <p className="font-semibold">Report submitted</p>
                      <p className="text-xs text-muted-foreground">
                        Your report is currently:
                      </p>
                      <p className="text-sm font-bold text-muted-foreground">
                        UNVERIFIED
                      </p>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Your report is now on the map. If you gave a name or
                        email, it went to the ward office so an officer can
                        follow up - it is not shown on the public map or feed.
                        The report can be corroborated by other residents and
                        reviewed by authorized planners.
                      </p>
                      {submittedReportId && (
                        <p className="rounded-md bg-muted px-2 py-1 font-mono text-[11px]">
                          Report ID: {submittedReportId}
                        </p>
                      )}
                      <div className="space-y-1 border-t border-border pt-2 text-[11px] text-muted-foreground">
                        <p className="font-semibold text-foreground">Tracking</p>
                        <p>Submitted</p>
                        <p>Evidence checked</p>
                        <p>Under review</p>
                        <p>Corroborated</p>
                        <p>Verified</p>
                        <p>Resolved</p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={dismissSubmissionConfirmation}
                        className="cursor-pointer"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}