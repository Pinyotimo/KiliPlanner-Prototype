import { useEffect, useState } from "react";
import { useLocation, usePlannerSession } from "../lib/plannerAccess";
import AdminLayout from "../components/AdminLayout";
import AdminDashboard from "./AdminDashboard";
import AdminIssues from "./AdminIssues";
import AdminMap from "./AdminMap";
import AdminIssueDetails from "./AdminIssueDetails";
import AdminAnalytics from "./AdminAnalytics";
import AdminReports from "./AdminReports";
import AdminSettings from "./AdminSettings";
import { useIssues } from "../../hooks/useIssues";
import { getPlannerSettings } from "../lib/plannerSettings";
import PlannerLogin from "./PlannerLogin";

function routeTitle(pathname: string): string {
  if (pathname === "/planner/map") return "Live Infrastructure Map";
  if (pathname === "/planner/issues") return "Issue Management";
  if (pathname.startsWith("/planner/issues/")) return "Issue Details";
  if (pathname === "/planner/analytics") return "Analytics and Insights";
  if (pathname === "/planner/reports") return "Reports / Export";
  if (pathname === "/planner/settings") return "Planner Settings";
  return "Planner Dashboard";
}

export default function PlannerConsole() {
  const pathname = useLocation();
  const { session, loading: sessionLoading } = usePlannerSession();
  if (sessionLoading) return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-white">Checking planner access...</div>;
  if (!session) return <PlannerLogin />;

  return <AuthenticatedPlannerConsole pathname={pathname} />;
}

function AuthenticatedPlannerConsole({ pathname }: { pathname: string }) {

  const settings = getPlannerSettings();
  const effectivePathname = pathname === "/planner" && settings.defaultMapView === "map" ? "/planner/map" : pathname;
  const { allIssues, realtimeStatus, realtimeVersion, newIssue, loading, error, refreshing, refresh } = useIssues({ realtimeEnabled: settings.refreshBehavior === "realtime" });
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const [newIssueNotifications, setNewIssueNotifications] = useState<typeof allIssues>([]);

  useEffect(() => {
    if (!newIssue || !getPlannerSettings().newReportNotifications) return;
    setNewIssueNotifications((current) => current.some((issue) => issue.id === newIssue.id) ? current : [newIssue, ...current].slice(0, 10));
    setNotification("New infrastructure report received.");
    const timer = window.setTimeout(() => setNotification(null), 4000);
    return () => window.clearTimeout(timer);
  }, [newIssue]);

  function markNotificationsRead() {
    setNewIssueNotifications([]);
  }

  function handleRefresh() {
    refresh();
    setNotification("Updated just now.");
    window.setTimeout(() => setNotification(null), 4000);
  }

  useEffect(() => {
    function handleNotification(event: Event) {
      const detail = (event as CustomEvent<{ message: string }>).detail;
      setNotification(detail.message);
      window.setTimeout(() => setNotification(null), 4000);
    }
    window.addEventListener("planner-notification", handleNotification);
    return () => window.removeEventListener("planner-notification", handleNotification);
  }, []);

  const issueId = pathname.startsWith("/planner/issues/") ? pathname.slice("/planner/issues/".length) : "";
  let page = loading ? <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500">Loading planner data...</div> : error ? <div className="rounded-xl border border-rose-200 bg-rose-50 p-12 text-center text-sm text-rose-700">{error}</div> : <AdminDashboard issues={allIssues} />;
  if (!loading && !error) {
    if (effectivePathname === "/planner/map") page = <AdminMap issues={allIssues} />;
    else if (effectivePathname === "/planner/issues") page = <AdminIssues searchTerm={searchTerm} refreshKey={realtimeVersion} />;
    else if (effectivePathname.startsWith("/planner/issues/")) page = <AdminIssueDetails issue={allIssues.find((issue) => issue.id === issueId)} />;
    else if (effectivePathname === "/planner/analytics") page = <AdminAnalytics issues={allIssues} />;
    else if (effectivePathname === "/planner/reports") page = <AdminReports issues={allIssues} />;
    else if (effectivePathname === "/planner/settings") page = <AdminSettings />;
  }

  return <><AdminLayout title={effectivePathname === "/planner" ? "Dashboard" : effectivePathname === "/planner/map" ? "Live Map" : effectivePathname === "/planner/issues" ? "Issues" : effectivePathname === "/planner/analytics" ? "Analytics" : effectivePathname === "/planner/reports" ? "Reports" : effectivePathname === "/planner/settings" ? "Settings" : routeTitle(effectivePathname)} showBreadcrumb={effectivePathname !== "/planner" && effectivePathname !== "/planner/map" && effectivePathname !== "/planner/issues" && effectivePathname !== "/planner/analytics" && effectivePathname !== "/planner/reports" && effectivePathname !== "/planner/settings"} realtimeStatus={realtimeStatus} showSearch={effectivePathname === "/planner/issues"} searchValue={searchTerm} onSearchChange={setSearchTerm} refreshing={refreshing} onRefresh={handleRefresh} notifications={newIssueNotifications} onNotificationsRead={markNotificationsRead}>{page}</AdminLayout>{notification && <div role="status" aria-live="polite" className="fixed bottom-6 right-6 z-50 rounded-lg bg-emerald-700 px-4 py-3 text-sm font-medium text-white shadow-xl">{notification}</div>}</>;
}