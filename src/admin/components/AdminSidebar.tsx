import { useEffect, useRef, useState } from "react";
import {
  BarChart3,
  Bell,
  FileText,
  LayoutDashboard,
  ListChecks,
  Map,
  Settings,
  SquareKanban,
  ChevronsLeft,
  ChevronsRight,
  Home,
  ShieldCheck,
  ScrollText,
  Activity,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { navigateToPlanner, useRoute } from "../lib/plannerAccess";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { cn } from "@/lib/utils";

type SidebarLink = {
  label: string;
  href: string;
  icon: LucideIcon;
};

/**
 * The console is grouped by what a planner is doing, not by route order, so
 * the rail reads as a set of tasks rather than a list of pages.
 */
const linkGroups: { heading: string; links: SidebarLink[] }[] = [
  {
    heading: "Overview",
    links: [{ label: "Dashboard", href: "/planner", icon: LayoutDashboard }],
  },
  {
    heading: "Manage",
    links: [
      { label: "Live Map", href: "/planner/map", icon: Map },
      { label: "Issues", href: "/planner/issues", icon: SquareKanban },
      { label: "Status board", href: "/planner/status", icon: ListChecks },
      { label: "Analytics", href: "/planner/analytics", icon: BarChart3 },
    ],
  },
  {
    heading: "Communications",
    links: [
      { label: "Notifications", href: "/planner/notifications", icon: Bell },
      { label: "Reports", href: "/planner/reports", icon: FileText },
    ],
  },
  {
    heading: "Assurance",
    links: [
      { label: "Audit log", href: "/planner/audit", icon: ScrollText },
      { label: "System health", href: "/planner/health", icon: Activity },
    ],
  },
  {
    heading: "Configuration",
    links: [{ label: "Settings", href: "/planner/settings", icon: Settings }],
  },
];

/** Offsites - the other surfaces of the platform, one hop away. */
const offsiteLinks: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Official desk", href: "/officials", icon: ShieldCheck },
  { label: "Public map", href: "/app", icon: Map },
  { label: "Landing page", href: "/", icon: Home },
];

type AdminSidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export default function AdminSidebar({
  mobileOpen,
  onMobileClose,
}: AdminSidebarProps) {
  const { pathname } = useRoute();
  const [collapsed, setCollapsed] = useState(false);
  const asideRef = useRef<HTMLElement>(null);
  const isDocked = useMediaQuery("(min-width: 1024px)");
  const offCanvas = !isDocked && !mobileOpen;

  // The collapsed rail is still on screen, so only the off-canvas drawer is
  // taken out of the tab order.
  useEffect(() => {
    const node = asideRef.current;
    if (!node) return;
    if (offCanvas) node.setAttribute("inert", "");
    else node.removeAttribute("inert");
  }, [offCanvas]);

  useEffect(() => {
    if (!mobileOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      onMobileClose();
      document
        .querySelector<HTMLElement>('[aria-label="Open planner navigation"]')
        ?.focus();
    }
    window.addEventListener("keydown", handleKeyDown);
    asideRef.current?.querySelector<HTMLElement>("a, button")?.focus();
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onMobileClose]);

  return (
    <>
      {/* Skip link. It lives outside the rail because the rail is transformed
          off-canvas on small screens, and a transformed ancestor would drag a
          fixed-position link off screen with it. */}
      <a
        href="#planner-content"
        className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-floating transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-[2px] lg:hidden"
          onClick={onMobileClose}
          aria-label="Close planner navigation"
        />
      )}

      <aside
        ref={asideRef}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col overflow-y-auto border-r border-inverse-border bg-inverse text-inverse-foreground transition-[width,transform] duration-300 ease-out lg:sticky lg:top-0 lg:z-10 lg:h-screen lg:translate-x-0",
          collapsed ? "lg:w-16" : "lg:w-60",
          mobileOpen ? "translate-x-0 shadow-floating" : "-translate-x-full",
        )}
        aria-label="Planner navigation"
      >
        {/* Brand - the console's own home */}
        <div
          className={cn(
            "flex min-h-16 items-center border-b border-inverse-border",
            collapsed ? "justify-center px-2" : "justify-between px-4",
          )}
        >
          <a
            href="/planner"
            className={cn(
              "min-w-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-inverse",
              collapsed ? "sr-only" : "",
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-inverse-muted">
              KiliPlanner
            </p>
            <p className="mt-0.5 truncate text-base font-semibold tracking-tight">
              Planner Console
            </p>
          </a>
          {collapsed && (
            <a
              href="/planner"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-black text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-inverse"
              aria-label="KiliPlanner planner console"
            >
              K
            </a>
          )}
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="hidden cursor-pointer rounded-lg p-2 text-inverse-muted transition-colors hover:bg-inverse-raised hover:text-inverse-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-inverse lg:block"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronsRight className="h-4 w-4" />
            ) : (
              <ChevronsLeft className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav
          className={cn(
            "min-h-0 flex-1 space-y-4 overflow-y-auto p-3",
            collapsed ? "lg:px-2" : "",
          )}
          aria-label="Planner navigation"
        >
          {linkGroups.map((group) => (
            <div key={group.heading} className="space-y-1">
              <p
                className={cn(
                  "px-3 pb-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-inverse-muted",
                  collapsed ? "lg:hidden" : "",
                )}
              >
                {group.heading}
              </p>
              {group.links.map((link) => {
                const active =
                  link.href === "/planner"
                    ? pathname === link.href
                    : pathname.startsWith(link.href);
                const Icon = link.icon;
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={(event) => {
                      event.preventDefault();
                      onMobileClose();
                      navigateToPlanner(link.href);
                    }}
                    className={cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-inverse",
                      collapsed ? "lg:justify-center lg:px-2" : "",
                      active
                        ? "bg-primary text-primary-foreground shadow-soft"
                        : "text-inverse-muted hover:bg-inverse-raised hover:text-inverse-foreground",
                    )}
                    title={collapsed ? link.label : undefined}
                    aria-label={link.label}
                    aria-current={active ? "page" : undefined}
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
                    <span className={collapsed ? "lg:hidden" : ""}>
                      {link.label}
                    </span>
                  </a>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Offsites - the rest of the platform */}
        <div className="space-y-1 border-t border-inverse-border px-3 py-3">
          <p
            className={cn(
              "px-3 pb-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-inverse-muted",
              collapsed ? "lg:hidden" : "",
            )}
          >
            Elsewhere
          </p>
          {offsiteLinks.map((link) => {
            const Icon = link.icon;
            return (
              <a
                key={link.href}
                href={link.href}
                onClick={onMobileClose}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-inverse-muted transition-colors hover:bg-inverse-raised hover:text-inverse-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-inverse",
                  collapsed ? "lg:justify-center lg:px-2" : "",
                )}
                title={collapsed ? link.label : undefined}
                aria-label={link.label}
              >
                <Icon
                  className="h-4 w-4 shrink-0 text-inverse-muted transition-colors group-hover:text-inverse-foreground"
                  aria-hidden="true"
                />
                <span className={collapsed ? "lg:hidden" : ""}>
                  {link.label}
                </span>
              </a>
            );
          })}
        </div>

        <div className="border-t border-inverse-border px-4 py-3 text-[11px] text-inverse-muted">
          {collapsed ? (
            <span className="block text-center" aria-hidden="true">
              © 26
            </span>
          ) : (
            "Kilimani Civic Platform © 2026"
          )}
        </div>
      </aside>
    </>
  );
}
