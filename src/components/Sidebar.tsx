import { Map, LayoutList, BarChart3, Info, X, ShieldAlert, CheckCircle2 } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";

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
      {/* Mobile Darkened Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-xs md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 border-r border-border flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-auto",
          /* Contrast adjustments for mobile vs desktop */
          "bg-secondary text-secondary-foreground max-md:shadow-2xl max-md:border-r-2 max-md:border-primary/20 md:bg-card md:text-card-foreground",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Sidebar Header */}
        <div className="flex h-14 items-center justify-between px-4 border-b border-border bg-background/50 md:bg-muted/30">
          <span className="font-semibold text-[11px] uppercase tracking-wider text-muted-foreground">
            Navigation
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-background/80"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-3 space-y-1.5">
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
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground font-bold shadow-xs"
                    : "text-muted-foreground hover:bg-background/60 hover:text-foreground md:hover:bg-muted"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive ? "text-primary-foreground stroke-[2.5]" : "text-muted-foreground"
                  )}
                />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Community Status Widget */}
        <div className="p-3.5 m-3 bg-background/80 md:bg-muted/40 rounded-xl border border-border space-y-2.5 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
            Community Status
          </span>
          <div className="flex justify-between items-center text-xs">
            <span className="flex items-center gap-1.5 text-foreground font-medium">
              <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
              Active Issues
            </span>
            <span className="font-bold text-foreground bg-secondary md:bg-background px-2 py-0.5 rounded border border-border text-[11px]">
              {openCount}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="flex items-center gap-1.5 text-primary font-medium">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Resolved
            </span>
            <span className="font-bold text-foreground bg-secondary md:bg-background px-2 py-0.5 rounded border border-border text-[11px]">
              {resolvedCount}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border text-[11px] text-muted-foreground text-center bg-background/40 md:bg-muted/20">
          Kilimani Civic Platform © 2026
        </div>
      </aside>
    </>
  );
}