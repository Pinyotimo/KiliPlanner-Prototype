import { useEffect, useRef } from "react";
import {
  Map,
  LayoutList,
  BarChart3,
  Bell,
  Info,
  X,
  Home,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "../../../components/ui/button";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { cn } from "@/lib/utils";

export type NavTab =
  | "map"
  | "feed"
  | "analytics"
  | "notifications"
  | "about";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  openCount?: number;
  resolvedCount?: number;
}

/**
 * Each role gets its own rail. This one is the resident's: the views of the
 * public app and nothing else.
 *
 * The planner console is not here. It has its own rail of its own pages
 * (AdminSidebar), and the official desk has one too - a resident should not
 * be able to wander into a staff console from the community map. The landing
 * page is the public front door, and it is where a role is chosen.
 */
const ELSEWHERE_LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Landing page", icon: Home },
];

/**
 * The skip link. It sits outside the rail because the rail is transformed
 * off-canvas on small screens, and a transformed ancestor would trap a
 * fixed-position link with it.
 */
const SKIP_LINK_CLASS =
  "fixed left-3 top-3 z-[100] -translate-y-24 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-floating transition-transform focus:translate-y-0";

/** Move focus to the app's main region, which has no fragment id of its own. */
function focusAppContent() {
  const main = document.querySelector<HTMLElement>("main");
  if (!main) return;
  if (!main.hasAttribute("tabindex")) main.setAttribute("tabindex", "-1");
  main.focus();
}

export default function Sidebar({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  openCount = 0,
  resolvedCount = 0,
}: SidebarProps) {
  const asideRef = useRef<HTMLElement>(null);
  const isDocked = useMediaQuery("(min-width: 768px)");
  const offCanvas = !isDocked && !isOpen;

  // A drawer that is translated off screen must not keep its links in the
  // tab order, so it is made inert until it is on screen again.
  useEffect(() => {
    const node = asideRef.current;
    if (!node) return;
    if (offCanvas) node.setAttribute("inert", "");
    else node.removeAttribute("inert");
  }, [offCanvas]);

  // The drawer is a modal surface on small screens, so Escape dismisses it
  // and focus returns to the button that opened it.
  useEffect(() => {
    if (!isOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      onClose();
      document
        .querySelector<HTMLElement>('[aria-label="Toggle navigation menu"]')
        ?.focus();
    }
    window.addEventListener("keydown", handleKeyDown);
    asideRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const appNav: {
    id: NavTab;
    label: string;
    icon: LucideIcon;
    count: number;
  }[] = [
    { id: "map", label: "Map View", icon: Map, count: 0 },
    { id: "feed", label: "Issue Feed", icon: LayoutList, count: openCount },
    { id: "analytics", label: "Analytics", icon: BarChart3, count: 0 },
    { id: "notifications", label: "Notifications", icon: Bell, count: 0 },
    { id: "about", label: "About App", icon: Info, count: 0 },
  ];

  const itemClass = cn(
    "group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    "text-inverse-muted hover:bg-inverse-raised hover:text-inverse-foreground",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-inverse",
  );

  return (
    <>
      <a
        href="#app-content"
        onClick={(event) => {
          event.preventDefault();
          focusAppContent();
        }}
        className={SKIP_LINK_CLASS}
      >
        Skip to content
      </a>

      {/* Mobile backdrop */}
      {isOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-[2px] md:hidden"
          onClick={onClose}
          aria-label="Close navigation sidebar"
        />
      )}

      {/* Sidebar rail */}
      <aside
        ref={asideRef}
        className={cn(
          "fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-inverse-border bg-inverse text-inverse-foreground transition-transform duration-300 ease-out md:translate-x-0 md:static md:z-auto",
          isOpen ? "translate-x-0 shadow-floating" : "-translate-x-full",
        )}
        aria-label="Resident navigation"
      >
        {/* Header - the app's home is /app, the landing page is the root */}
        <div className="flex min-h-16 items-center justify-between border-b border-inverse-border px-4">
          <a
            href="/app"
            className="min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-inverse"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-inverse-muted">
              KiliPlanner
            </p>
            <p className="mt-0.5 truncate text-lg font-semibold tracking-tight">
              Community Map
            </p>
          </a>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="md:hidden text-inverse-muted hover:bg-inverse-raised hover:text-inverse-foreground"
            aria-label="Close navigation sidebar"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Navigation */}
        <nav
          className="min-h-0 flex-1 space-y-1 overflow-y-auto p-3"
          aria-label="Main navigation"
        >
          {appNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onClose();
                }}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  itemClass,
                  isActive &&
                    "bg-primary text-primary-foreground shadow-soft hover:bg-primary hover:text-primary-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-4.5 w-4.5 shrink-0 transition-colors",
                    isActive
                      ? "text-primary-foreground"
                      : "text-inverse-muted group-hover:text-inverse-foreground",
                  )}
                />
                <span className="truncate">{item.label}</span>
                {item.count > 0 && (
                  <span
                    className={cn(
                      "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                      isActive
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-inverse-raised text-inverse-muted",
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Resolved summary */}
        <div className="px-3 pb-3">
          <div className="rounded-lg border border-inverse-border bg-inverse-raised px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-inverse-muted">
              Ward progress
            </p>
            <p className="mt-1 text-sm font-semibold tabular-nums">
              {resolvedCount} resolved
              <span className="mx-1.5 text-inverse-muted">/</span>
              {openCount + resolvedCount} total
            </p>
          </div>
        </div>

        {/* Elsewhere - the public front door, where a role is chosen */}
        <div className="space-y-1 border-t border-inverse-border px-3 py-3">
          <p className="px-3 pb-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-inverse-muted">
            Elsewhere
          </p>
          {ELSEWHERE_LINKS.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={onClose}
                className={itemClass}
                aria-label={link.label}
              >
                <Icon
                  className="h-4.5 w-4.5 shrink-0 text-inverse-muted transition-colors group-hover:text-inverse-foreground"
                  aria-hidden="true"
                />
                <span className="truncate">{link.label}</span>
              </a>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-inverse-border px-4 py-3 text-[11px] text-inverse-muted">
          Kilimani Civic Platform © 2026
        </div>
      </aside>

      {/* Fragment target for the skip link, sitting just before the main
          region so a browser without script still lands on the content. */}
      <span id="app-content" className="sr-only" />
    </>
  );
}
