import { Menu, Plus, MapPin, Bell } from "lucide-react";
import { Button } from "./ui/button";

interface NavbarProps {
  onOpenSidebar: () => void;
  onReportClick: () => void;
  unreadCount?: number;
}

export default function Navbar({
  onOpenSidebar,
  onReportClick,
  unreadCount = 0,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-800/40 bg-emerald-950/80 text-emerald-50 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 max-w-7xl mx-auto">
        {/* Left: Mobile Menu Toggle & Brand */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSidebar}
            className="md:hidden h-9 w-9 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900/60 transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <a href="#" className="flex items-center gap-2.5 group">
            <div className="relative flex items-center justify-center p-2 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-emerald-950 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-200">
              <MapPin className="h-4 w-4 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-emerald-100 to-emerald-300 bg-clip-text text-transparent">
                KiliPlanner
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-400/80 -mt-1 hidden sm:block">
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
            className="relative h-9 w-9 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-900/60 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400 ring-2 ring-emerald-950"></span>
              </span>
            )}
          </Button>

          <Button
            onClick={onReportClick}
            size="sm"
            className="h-9 gap-1.5 text-xs font-bold px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-emerald-950 shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 active:scale-95 transition-all border-0"
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