import { Menu, Plus, MapPin, Bell } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { ThemeSwitcher } from "../../../theme/ThemeSwitcher";

interface NavbarProps {
  onOpenSidebar: () => void;
  onReportClick: () => void;
  onNotificationsClick: () => void;
  unreadCount?: number;
}

export default function Navbar({
  onOpenSidebar,
  onReportClick,
  onNotificationsClick,
  unreadCount = 0,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
      <div className="flex h-16 w-full max-w-7xl items-center justify-between gap-3 px-4 md:px-6">
        {/* Left: mobile menu + brand */}
        <div className="flex min-w-0 items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSidebar}
            className="md:hidden"
            aria-label="Toggle navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <a href="/app" className="group flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft transition-transform duration-200 group-hover:scale-105">
              <MapPin className="h-4.5 w-4.5 stroke-[2.5]" />
            </span>
            <span className="flex min-w-0 flex-col leading-none">
              <span className="truncate text-base font-bold tracking-tight text-foreground">
                KiliPlanner
              </span>
              <span className="mt-0.5 hidden text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground sm:block">
                Kilimani Ward
              </span>
            </span>
          </a>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <ThemeSwitcher />

          <Button
            variant="ghost"
            size="icon"
            onClick={onNotificationsClick}
            className="relative"
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : "Notifications"
            }
          >
            <Bell className="h-4.5 w-4.5" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
              </span>
            )}
          </Button>

          <Button onClick={onReportClick} size="sm" className="h-9 px-3 sm:px-4">
            <Plus className="h-4 w-4 stroke-[3]" />
            <span className="hidden sm:inline">Report Issue</span>
            <span className="sm:hidden">Report</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
