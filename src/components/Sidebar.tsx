import { Map, LayoutList, BarChart3, Info, X, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export type NavTab = "map" | "feed" | "analytics" | "about";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  openCount?: number;
  resolvedCount?: number;
}

export default function Sidebar({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  openCount = 0,
  resolvedCount = 0,
}: SidebarProps) {
  const navItems = [
    { id: "map" as NavTab, label: "Map View", icon: Map },
    { id: "feed" as NavTab, label: "Issue Feed", icon: LayoutList },
    { id: "analytics" as NavTab, label: "Analytics", icon: BarChart3 },
    { id: "about" as NavTab, label: "About App", icon: Info },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs md:hidden"
          onClick={onClose}
          aria-label="Close navigation sidebar"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-auto bg-slate-950 text-slate-50 shadow-2xl md:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex min-h-[5rem] items-center justify-between border-b border-slate-800 px-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">
              KILIPLANNER
            </p>
            <p className="mt-1 text-lg font-semibold text-slate-50">Community Map</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1.5" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive ? "text-white" : "text-slate-400 group-hover:text-white"
                  )}
                />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Community Status Widget */}
        <div className="p-3.5 m-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-300 block">
            Community Status
          </span>
          <div className="flex justify-between items-center text-xs">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
              Active Issues
            </span>
            <span className="font-bold text-slate-100 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-[11px]">
              {openCount}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="flex items-center gap-1.5 text-slate-300 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              Resolved
            </span>
            <span className="font-bold text-slate-100 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 text-[11px]">
              {resolvedCount}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 text-[11px] text-slate-400 text-center bg-slate-950">
          Kilimani Civic Platform © 2026
        </div>
      </aside>
    </>
  );
}