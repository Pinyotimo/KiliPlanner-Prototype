import { useEffect, useState } from "react";
import { navigateToPlanner, useLocation } from "../lib/plannerAccess";

const links = [
  ["Dashboard", "/planner"],
  ["Live Map", "/planner/map"],
  ["Issues", "/planner/issues"],
  ["Analytics", "/planner/analytics"],
  ["Reports", "/planner/reports"],
  ["Settings", "/planner/settings"],
] as const;

type AdminSidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

type IconName = "dashboard" | "map" | "issues" | "analytics" | "reports" | "settings";

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, string> = {
    dashboard: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
    map: "m3 6 6-3 6 3 6-3v14l-6 3-6-3-6 3V6Zm6-3v14m6-11v14",
    issues: "M12 3 21 7.5v9L12 21l-9-4.5v-9L12 3Zm0 0v9m9-4.5-9 4.5-9-4.5",
    analytics: "M4 19V5m0 14h16M8 16v-4m4 4V8m4 8V5",
    reports: "M6 3h9l3 3v15H6V3Zm9 0v4h4M9 12h6m-6 4h6",
    settings: "M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Zm0-5v2m0 13v2m9-8h-2M5 12H3m15.36-6.36-1.42 1.42M7.06 16.94l-1.42 1.42m12.72 0-1.42-1.42M7.06 7.06 5.64 5.64",
  };

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}

const icons: Record<(typeof links)[number][0], IconName> = {
  Dashboard: "dashboard",
  "Live Map": "map",
  Issues: "issues",
  Analytics: "analytics",
  Reports: "reports",
  Settings: "settings",
};

export default function AdminSidebar({ mobileOpen, onMobileClose }: AdminSidebarProps) {
  const pathname = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!mobileOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onMobileClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mobileOpen, onMobileClose]);

  return (
    <>
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-slate-950/50 lg:hidden"
          onClick={onMobileClose}
          aria-label="Close planner navigation"
        />
      )}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[min(14rem,calc(100vw-1rem))] max-w-full shrink-0 flex-col overflow-y-auto bg-slate-950 text-slate-50 shadow-2xl transition-[width,transform] duration-200 lg:sticky lg:top-0 lg:z-10 lg:h-screen ${collapsed ? "lg:w-16" : "lg:w-56"} lg:translate-x-0 lg:overflow-visible lg:shadow-none ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className={`flex min-h-[5rem] items-center border-b border-slate-800 ${collapsed ? "justify-center px-2" : "justify-between px-4"}`}>
          <div className={collapsed ? "sr-only" : ""}>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-300">KILIPLANNER</p>
            <p className="mt-1 text-lg font-semibold">Planner Console</p>
          </div>
          {collapsed && <span className="text-xl font-black text-blue-300" aria-label="KiliPlanner">K</span>}
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="hidden rounded-md p-2 text-slate-400 hover:bg-slate-800 hover:text-white lg:block"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? "›" : "‹"}
          </button>
        </div>
        <nav className={`flex-1 space-y-1.5 p-3 ${collapsed ? "lg:px-2" : ""}`} aria-label="Planner navigation">
          {links.map(([label, href]) => {
            const active = href === "/planner" ? pathname === href : pathname.startsWith(href);
            return (
              <a
                key={href}
                href={href}
                onClick={(event) => {
                  event.preventDefault();
                  onMobileClose();
                  navigateToPlanner(href);
                }}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${collapsed ? "lg:justify-center lg:px-2" : ""} ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
                title={collapsed ? label : undefined}
                aria-label={label}
              >
                <Icon name={icons[label]} />
                <span className={collapsed ? "lg:hidden" : ""}>{label}</span>
              </a>
            );
          })}
        </nav>
        <a
          href="/"
          onClick={onMobileClose}
          className={`mx-4 mb-4 flex items-center gap-3 border-t border-slate-800 px-3 pt-4 text-sm text-slate-400 hover:text-white ${collapsed ? "lg:mx-3 lg:justify-center lg:px-2" : ""}`}
          title={collapsed ? "Return to public map" : undefined}
          aria-label="Return to public map"
        >
          <span aria-hidden="true">↗</span>
          <span className={collapsed ? "lg:hidden" : ""}>Public map</span>
        </a>
      </aside>
    </>
  );
}
