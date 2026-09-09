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
    <header className="sticky top-0 z-40 w-full border-b border-emerald-800/60 bg-emerald-950 text-emerald-50 shadow-md backdrop-blur-md">
      <div className="flex h-14 items-center justify-between px-4 max-w-7xl mx-auto">
        {/* Left: Mobile Menu Toggle & Brand */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenSidebar}
            className="md:hidden h-9 w-9 text-emerald-200 hover:text-white hover:bg-emerald-800/50"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          <a href="#" className="flex items-center gap-2">
            <div className="bg-emerald-500 text-emerald-950 p-1.5 rounded-lg flex items-center justify-center shadow-xs">
              <MapPin className="h-4 w-4 stroke-[2.5]" />
            </div>
            <span className="font-bold text-base tracking-tight text-white">
              KiliPlanner
            </span>
          </a>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="relative h-9 w-9 text-emerald-200 hover:text-white hover:bg-emerald-800/50"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-emerald-950" />
            )}
          </Button>

          <Button
            onClick={onReportClick}
            size="sm"
            className="h-9 gap-1.5 text-xs font-bold px-3 shadow-xs bg-emerald-500 hover:bg-emerald-400 text-emerald-950 border-0"
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