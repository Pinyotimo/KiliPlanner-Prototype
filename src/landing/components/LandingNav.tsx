import { MapPin } from "lucide-react";
import { ThemeSwitcher } from "../../theme/ThemeSwitcher";
import { ActionLink } from "./ActionLink";

const LINKS = [
  { href: "#what", label: "What it is" },
  { href: "#why", label: "Why" },
  { href: "#how", label: "How it works" },
  { href: "#difference", label: "Differences" },
];

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/70 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="/" className="group flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft transition-transform duration-200 group-hover:scale-105">
            <MapPin className="h-4.5 w-4.5 stroke-[2.5]" aria-hidden="true" />
          </span>
          <span className="flex min-w-0 flex-col leading-none">
            <span className="truncate text-base font-bold tracking-tight text-foreground">
              KiliPlanner
            </span>
            <span className="mt-0.5 hidden text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase sm:block">
              Kilimani Ward
            </span>
          </span>
        </a>

        <nav
          aria-label="Sections"
          className="hidden items-center gap-1 md:flex"
        >
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <ActionLink href="/app" size="sm" className="hidden sm:inline-flex">
            Open the app
          </ActionLink>
        </div>
      </div>
    </header>
  );
}
