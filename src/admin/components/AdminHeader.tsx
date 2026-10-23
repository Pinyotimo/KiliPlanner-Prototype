import { useEffect, useState } from "react";
import {
  Bell,
  ChevronRight,
  Menu,
  RefreshCw,
  Search,
  User,
  Wifi,
  WifiOff,
  Loader2,
} from "lucide-react";
import type { Issue } from "../../types/issue";
import { CATEGORY_LABELS } from "../../types/issue";
import { relativeTime } from "../../lib/relativeTime";
import { navigateToPlanner } from "../lib/plannerAccess";
import { ThemeSwitcher } from "../../theme/ThemeSwitcher";
import { Button } from "../../components/ui/button";
import { cn } from "@/lib/utils";

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
  onNotificationRead?: (issueId: string) => void;
};

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
  onNotificationRead,
}: AdminHeaderProps) {
  const statusLabel =
    realtimeStatus === "live"
      ? "Live"
      : realtimeStatus === "offline"
        ? "Offline"
        : "Connecting";
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
    <header className="mb-6 border-b border-border pb-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={onMenuClick}
            className="cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:hidden"
            aria-label="Open planner navigation"
            title="Open planner navigation"
          >
            <Menu className="h-4.5 w-4.5" />
          </Button>
          <div className="min-w-0">
            {showBreadcrumb && (
              <nav
                aria-label="Breadcrumb"
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
              >
                <span>Planner</span>
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
                <span className="truncate text-foreground">{title}</span>
              </nav>
            )}
            <h1 className="truncate text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {showSearch && (
            <label className="relative hidden md:block">
              <span className="sr-only">Search issues</span>
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                value={searchValue}
                onChange={(event) => onSearchChange?.(event.target.value)}
                placeholder="Search issues"
                className="h-9 w-52 rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
          )}

          {/* Realtime state: the chip always shows a text label and an icon,
              so the status never rests on colour alone. The label keeps the
              default ink for legibility; the tone rides on the icon. */}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-semibold text-foreground",
            )}
          >
            {realtimeStatus === "live" && (
              <Wifi
                className="h-3.5 w-3.5 text-success"
                aria-hidden="true"
              />
            )}
            {realtimeStatus === "offline" && (
              <WifiOff
                className="h-3.5 w-3.5 text-destructive"
                aria-hidden="true"
              />
            )}
            {realtimeStatus === "connecting" && (
              <Loader2
                className="h-3.5 w-3.5 animate-spin text-warning"
                aria-hidden="true"
              />
            )}
            {statusLabel}
          </span>

          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            disabled={refreshing}
            title={refreshing ? "Refreshing data" : "Refresh data"}
            aria-label={refreshing ? "Refreshing data" : "Refresh data"}
          >
            <RefreshCw
              className={cn("h-4.5 w-4.5", refreshing && "animate-spin")}
            />
          </Button>

          <ThemeSwitcher />

          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleNotifications}
              className="relative"
              title="Notifications"
              aria-label={`Notifications${notifications.length ? `, ${notifications.length} unread` : ""}`}
              aria-expanded={notificationsOpen}
              aria-controls="planner-notifications"
            >
              <Bell className="h-4.5 w-4.5" />
              {notifications.length > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background">
                  {notifications.length > 9 ? "9+" : notifications.length}
                </span>
              )}
            </Button>

            {notificationsOpen && (
              <div
                id="planner-notifications"
                className="absolute right-0 top-11 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-popover p-3 text-left text-popover-foreground shadow-floating"
              >
                <div className="flex items-center justify-between px-2 pb-2">
                  <h2 className="text-sm font-semibold text-foreground">
                    Notifications
                  </h2>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onNotificationsRead}
                      className="cursor-pointer text-xs font-medium text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="cursor-pointer text-xs text-muted-foreground hover:text-foreground"
                    >
                      Close
                    </button>
                  </div>
                </div>
                {notifications.length === 0 ? (
                  <p className="px-2 py-5 text-sm text-muted-foreground">
                    No new infrastructure reports.
                  </p>
                ) : (
                  <div className="max-h-72 space-y-1 overflow-y-auto">
                    {notifications.map((issue) => (
                      <button
                        key={issue.id}
                        type="button"
                        onClick={() => {
                          onNotificationRead?.(issue.id);
                          setNotificationsOpen(false);
                          navigateToPlanner(`/planner/issues/${issue.id}`);
                        }}
                        className="block w-full cursor-pointer rounded-lg p-2 text-left transition-colors hover:bg-muted"
                      >
                        <p className="line-clamp-2 text-sm font-medium text-foreground">
                          New {CATEGORY_LABELS[issue.category]} report
                        </p>
                        <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                          {issue.description}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {relativeTime(issue.created_at)}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div
            className="flex items-center gap-2 border-l border-border pl-3"
            aria-label="Planner profile"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <User className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="hidden text-sm font-semibold text-foreground sm:inline">
              Planner
            </span>
          </div>
        </div>
      </div>

      {showSearch && (
        <label className="relative mt-4 block md:hidden">
          <span className="sr-only">Search issues</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange?.(event.target.value)}
            placeholder="Search issues"
            className="h-9 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
      )}
    </header>
  );
}
