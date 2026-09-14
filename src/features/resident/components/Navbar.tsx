import { Menu, Plus, MapPin, Bell } from "lucide-react";
import { Button } from "../../../components/ui/button";

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
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 text-foreground shadow-lg shadow-foreground/20 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 max-w-7xl mx-auto">
        {/* Left: Mobile Menu Toggle & Brand */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSidebar}
            className="md:hidden h-9 w-9 rounded-lg text-primary hover:text-primary-foreground hover:bg-background/60 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <a href="#" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-primary to-primary text-primary-foreground shadow-md shadow-primary/20 group-hover:scale-105 transition-transform duration-200">
              <MapPin className="h-4 w-4 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-primary-foreground via-primary/30 to-primary bg-clip-text text-transparent">
                KiliPlanner
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-primary/80 -mt-1 hidden sm:block">
                Kilimani Ward
              </span>
            </div>
          </a>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onNotificationsClick}
            className="relative h-9 w-9 rounded-lg text-primary hover:text-primary-foreground hover:bg-background/60 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary ring-2 ring-background"></span>
              </span>
            )}
          </Button>

          <Button
            onClick={onReportClick}
            size="sm"
            className="h-9 gap-1.5 text-xs font-bold px-4 rounded-lg bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-primary-foreground shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all border-0"
          >
            <Plus className="h-4 w-4 stroke-[3]" />
            <span className="hidden sm:inline">Report Issue</span>
            <span className="sm:hidden">Report</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
