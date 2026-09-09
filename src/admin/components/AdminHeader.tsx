import { useEffect, useState } from "react";
import type { Issue } from "../../types/issue";
import { CATEGORY_LABELS } from "../../types/issue";
import { relativeTime } from "../../lib/relativeTime";
import { navigateToPlanner } from "../lib/plannerAccess";

type AdminHeaderProps = {
  title?: string;
  onMenuClick?: () => void;
  realtimeStatus?: "connecting" | "live" | "offline";
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  showBreadcrumb?: boolean;
  notifications?: Issue[];
  onNotificationsRead?: () => void;
};

function HeaderIcon({ type }: { type: "menu" | "search" | "bell" | "user" | "refresh" }) {
  const paths = {
    menu: "M4 6h16M4 12h16M4 18h16",
    search: "m21 21-4.35-4.35m2.1-5.4a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z",
    bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9ZM10 21h4",
    user: "M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
    refresh: "M20 11a8 8 0 0 0-14.9-3M4 5v4h4m-4 3a8 8 0 0 0 14.9 3M20 19v-4h-4",
  };
  return <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[type]} /></svg>;
}

export default function AdminHeader({
  title = "Admin Overview",
  onMenuClick,
  realtimeStatus = "connecting",
  showSearch = false,
  searchValue = "",
  onSearchChange,
  refreshing = false,
  onRefresh,
  showBreadcrumb = true,
  notifications = [],
  onNotificationsRead,
}: AdminHeaderProps) {
  const statusLabel = realtimeStatus === "live" ? "Live" : realtimeStatus === "offline" ? "Offline" : "Connecting";
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(() => {
    if (!notificationsOpen) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setNotificationsOpen(false);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [notificationsOpen]);

  function toggleNotifications() {
    setNotificationsOpen((open) => !open);
  }

  return (
    <header className="mb-6 border-b border-slate-200 pb-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg border border-slate-300 bg-white p-2 text-slate-700 shadow-sm hover:bg-slate-50 lg:hidden"
          aria-label="Open planner navigation"
          title="Open planner navigation"
        >
          <HeaderIcon type="menu" />
        </button>
        <div className="min-w-0">
        {showBreadcrumb && <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span>Planner</span><span aria-hidden="true">/</span><span className="truncate">{title}</span>
        </div>}
        <h1 className="truncate text-2xl font-bold text-slate-900">{title}</h1>
        </div>
      </div>
        <div className="flex items-center gap-2 sm:gap-4">
          {showSearch && (
            <label className="relative hidden md:block">
              <span className="sr-only">Search issues</span>
              <input
                value={searchValue}
                onChange={(event) => onSearchChange?.(event.target.value)}
                placeholder="Search issues"
                className="w-48 rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              <span className="pointer-events-none absolute left-3 top-2.5 text-slate-400"><HeaderIcon type="search" /></span>
            </label>
          )}
          <span className={`flex items-center gap-2 text-sm font-medium ${realtimeStatus === "live" ? "text-emerald-700" : "text-amber-700"}`}>
            <span className={`h-2.5 w-2.5 rounded-full ${realtimeStatus === "live" ? "bg-emerald-500" : "bg-amber-500"}`} />
            {statusLabel}
          </span>
          <button type="button" onClick={onRefresh} disabled={refreshing} className="inline-flex rounded-md p-1 text-blue-600 hover:bg-blue-50 hover:text-blue-800 disabled:opacity-50" title={refreshing ? "Refreshing data" : "Refresh data"} aria-label={refreshing ? "Refreshing data" : "Refresh data"}>
            <HeaderIcon type="refresh" />
          </button>
          <div className="relative">
            <button type="button" onClick={toggleNotifications} className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-200" title="Notifications" aria-label={`Notifications${notifications.length ? `, ${notifications.length} unread` : ""}`} aria-expanded={notificationsOpen} aria-controls="planner-notifications">
              <HeaderIcon type="bell" />
              {notifications.length > 0 && <span className="absolute -right-0.5 -top-0.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">{notifications.length > 9 ? "9+" : notifications.length}</span>}
            </button>
            {notificationsOpen && <div id="planner-notifications" className="absolute right-0 top-11 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-slate-200 bg-white p-3 text-left shadow-xl"><div className="flex items-center justify-between px-2 pb-2"><h2 className="text-sm font-semibold text-slate-900">Notifications</h2><div className="flex items-center gap-3"><button type="button" onClick={onNotificationsRead} className="text-xs font-medium text-blue-600 hover:text-blue-800">Mark all read</button><button type="button" onClick={() => setNotificationsOpen(false)} className="text-xs text-slate-500 hover:text-slate-800">Close</button></div></div>{notifications.length === 0 ? <p className="px-2 py-5 text-sm text-slate-500">No new infrastructure reports.</p> : <div className="max-h-72 space-y-1 overflow-y-auto">{notifications.map((issue) => <button key={issue.id} type="button" onClick={() => { setNotificationsOpen(false); navigateToPlanner(`/planner/issues/${issue.id}`); }} className="block w-full rounded-lg p-2 text-left hover:bg-slate-50"><p className="line-clamp-2 text-sm font-medium text-slate-800">New {CATEGORY_LABELS[issue.category]} report</p><p className="mt-1 line-clamp-1 text-xs text-slate-600">{issue.description}</p><p className="mt-1 text-xs text-slate-400">{relativeTime(issue.created_at)}</p></button>)}</div>}</div>}
          </div>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3" aria-label="Planner profile">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-white"><HeaderIcon type="user" /></span>
            <span className="hidden text-sm font-semibold text-slate-700 sm:inline">Planner</span>
          </div>
        </div>
      </div>
      {showSearch && (
        <label className="relative mt-4 block md:hidden">
          <span className="sr-only">Search issues</span>
          <input value={searchValue} onChange={(event) => onSearchChange?.(event.target.value)} placeholder="Search issues" className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-3 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </label>
      )}
    </header>
  );
}
