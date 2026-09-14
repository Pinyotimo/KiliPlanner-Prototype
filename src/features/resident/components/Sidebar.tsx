import {
  Map,
  LayoutList,
  BarChart3,
  Info,
  Settings,
  X,
  ShieldAlert,
  CheckCircle2,
  Bell,
} from "lucide-react";
import { Button } from "../../../components/ui/button";
import { cn } from "@/lib/utils";

export type NavTab =
  | "map"
  | "feed"
  | "analytics"
  | "notifications"
  | "about"
  | "settings";

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
    { id: "map" as NavTab, label: "Map View", icon: Map, href: "#" },
    { id: "feed" as NavTab, label: "Issue Feed", icon: LayoutList, href: "#" },
    {
      id: "analytics" as NavTab,
      label: "Analytics",
      icon: BarChart3,
      href: "#",
    },
    {
      id: "notifications" as NavTab,
      label: "Notifications",
      icon: Bell,
      href: "#",
    },
    { id: "about" as NavTab, label: "About App", icon: Info, href: "#" },
    {
      id: "planner" as NavTab,
      label: "Admin Console",
      icon: Settings,
      href: "/planner",
    },
  ];

  function handleNavigation(item: (typeof navItems)[number]) {
    onSelectTab(item.id);
    onClose();

    if (item.href && item.href !== "#") {
      window.location.href = item.href;
    }
  }

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-background/50 md:hidden"
          onClick={onClose}
          aria-label="Close navigation sidebar"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 w-64 border-r border-primary-foreground/15 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-auto bg-foreground text-primary-foreground shadow-2xl md:shadow-none",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex min-h-[5rem] items-center justify-between border-b border-primary-foreground/15 px-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-foreground">
              KILIPLANNER
            </p>
            <p className="mt-1 text-lg font-semibold text-primary-foreground">
              Community Map
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="md:hidden h-8 w-8 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary/30 cursor-pointer"
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
                onClick={() => handleNavigation(item)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-lg shadow-foreground/30"
                    : "text-primary-foreground/70 hover:bg-primary/30 hover:text-primary-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive
                      ? "text-primary-foreground"
                      : "text-muted-foreground group-hover:text-primary-foreground",
                  )}
                />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-primary-foreground/15 text-[11px] text-primary-foreground/60 text-center bg-foreground">
          Kilimani Civic Platform © 2026
        </div>
      </aside>
    </>
  );
}
