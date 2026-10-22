import { MapPin } from "lucide-react";
import { ThemeSwitcher } from "../../theme/ThemeSwitcher";

const LINKS = [
  { href: "/app", label: "Resident app" },
  { href: "/planner", label: "Planner console" },
  { href: "/officials", label: "Officials dashboard" },
];

export function LandingFooter() {
  return (
    <footer className="border-t border-border/60 bg-surface-raised/40">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 sm:px-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft">
              <MapPin className="h-4.5 w-4.5 stroke-[2.5]" aria-hidden="true" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-base font-bold tracking-tight text-foreground">
                KiliPlanner
              </span>
              <span className="mt-0.5 text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Kilimani Ward
              </span>
            </span>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            A civic infrastructure reporting platform for Kilimani Ward, built
            so that a reported problem keeps its place, its evidence and its
            owner until somebody fixes it.
          </p>
        </div>

        <nav aria-label="Product areas" className="flex flex-col gap-3">
          <p className="text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
            Product areas
          </p>
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex flex-col gap-3">
          <p className="text-[11px] font-bold tracking-[0.16em] text-muted-foreground uppercase">
            Appearance
          </p>
          <ThemeSwitcher variant="labelled" />
        </div>
      </div>

      <div className="border-t border-border/60 px-4 py-5 sm:px-6">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            KiliPlanner &mdash; built for the residents, planners and officials
            of Kilimani Ward.
          </p>
          <p>Reports are shared with the community. Stay safe out there.</p>
        </div>
      </div>
    </footer>
  );
}
