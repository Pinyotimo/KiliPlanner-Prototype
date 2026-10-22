import { useEffect, useRef } from "react";
import { Layers, Bell, ShieldCheck, Map, Home, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { cn } from "@/lib/utils";

export type OfficialView = "issues" | "notifications";

type OfficialSidebarProps = {
  activeView: OfficialView;
  onSelectView: (view: OfficialView) => void;
  issueCount: number;
  unreadCount: number;
  mobileOpen: boolean;
  onMobileClose: () => void;
};

/**
 * The official desk is its own surface, so it gets its own rail rather than
 * borrowing the planner console's. The views it holds are tabs of this
 * workstation; the other destinations are the platform's other surfaces.
 */
const VIEWS: { id: OfficialView; label: string; icon: LucideIcon }[] = [
  { id: "issues", label: "Assigned issues", icon: Layers },
  { id: "notifications", label: "Alerts", icon: Bell },
];

/**
 * The other surfaces of the platform.
 *
 * The planner console is not one of them: it is a different desk, with its
 * own sign-in and its own rail, so it is reached from the console's own
 * navigation rather than from the official desk's.
 */
const OFFSITES: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Public map", href: "/app", icon: Map },
  { label: "Landing page", href: "/", icon: Home },
];

export default function OfficialSidebar({
  activeView,
  onSelectView,
  issueCount,
  unreadCount,
  mobileOpen,
  onMobileClose,
}: OfficialSidebarProps) {
  const asideRef = useRef<HTMLElement>(null);
  const isDocked = useMediaQuery("(min-width: 1024px)");
  const offCanvas = !isDocked && !mobileOpen;

  // The slide-over is off screen when it is closed, so it must not keep its
  // links in the tab order while it is away.
  useEffect(() => {
    const node = asideRef.current;
    if (!node) return;
    if (offCanvas) node.setAttribute("inert", "");
    else node.removeAttribute("inert");
  }, [offCanvas]);

  // The slide-over is modal on small screens: Escape dismisses it and focus
  // goes back to the button that opened it.
  useEffect(() => {
    if (!mobileOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      onMobileClose();
      document
        .querySelector<HTMLElement>('[aria-label="Open official navigation"]')
        ?.focus();
    }
    window.addEventListener("keydown", handleKeyDown);
    asideRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onMobileClose]);

  return (
    <>
      {/* Skip link. It sits outside the rail because the rail is transformed
          off-canvas on small screens, and a transformed ancestor would drag a
          fixed-position link off screen with it. */}
      <a
        href="#officials-content"
        className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-floating transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-[2px] lg:hidden"
          onClick={onMobileClose}
          aria-label="Close official navigation"
        />
      )}

      <aside
        ref={asideRef}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col overflow-y-auto border-r border-inverse-border bg-inverse text-inverse-foreground transition-[transform] duration-300 ease-out lg:sticky lg:top-0 lg:z-10 lg:h-screen lg:translate-x-0",
          mobileOpen ? "translate-x-0 shadow-floating" : "-translate-x-full",
        )}
        aria-label="Official navigation"
      >
        {/* Brand - the desk's own home */}
        <div className="flex min-h-16 items-center justify-between border-b border-inverse-border px-4">
          <a
            href="/officials"
            className="min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-inverse"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-inverse-muted">
              KiliPlanner
            </p>
            <p className="mt-0.5 truncate text-base font-semibold tracking-tight">
              Official Desk
            </p>
          </a>
          <button
            type="button"
            onClick={onMobileClose}
            className="cursor-pointer rounded-lg p-2 text-inverse-muted transition-colors hover:bg-inverse-raised hover:text-inverse-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-inverse lg:hidden"
            aria-label="Close official navigation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className="flex-1 space-y-1 p-3"
          aria-label="Official navigation"
        >
          <p className="px-3 pb-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-inverse-muted">
            Workstation
          </p>
          {VIEWS.map((view) => {
            const Icon = view.icon;
            const active = activeView === view.id;
            const count =
              view.id === "issues" ? issueCount : unreadCount;
            return (
              <button
                key={view.id}
                type="button"
                onClick={() => {
                  onSelectView(view.id);
                  onMobileClose();
                }}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-inverse",
                  active
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-inverse-muted hover:bg-inverse-raised hover:text-inverse-foreground",
                )}
              >
                <Icon
                  className={cn(
                    "h-4.5 w-4.5 shrink-0 transition-colors",
                    active
                      ? "text-primary-foreground"
                      : "text-inverse-muted group-hover:text-inverse-foreground",
                  )}
                  aria-hidden="true"
                />
                <span className="truncate">{view.label}</span>
                {count > 0 && (
                  <span
                    className={cn(
                      "ml-auto rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
                      active
                        ? "bg-primary-foreground/20 text-primary-foreground"
                        : "bg-inverse-raised text-inverse-muted",
                    )}
                  >
                    {count > 99 ? "99+" : count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Offsites */}
          <p className="px-3 pb-0.5 pt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-inverse-muted">
            Elsewhere
          </p>
          {OFFSITES.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={onMobileClose}
                className="group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-inverse-muted transition-colors hover:bg-inverse-raised hover:text-inverse-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-inverse"
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
        </nav>

        <div className="border-t border-inverse-border px-4 py-3 text-[11px] text-inverse-muted">
          Kilimani Civic Platform © 2026
        </div>
      </aside>
    </>
  );
}
