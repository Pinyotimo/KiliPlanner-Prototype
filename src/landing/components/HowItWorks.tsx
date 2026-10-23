import { motion, useReducedMotion } from "framer-motion";
import {
  Building2,
  ClipboardCheck,
  FileCheck2,
  Megaphone,
  ShieldCheck,
  Smartphone,
  UserRoundCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";

const STAGES: {
  title: string;
  body: string;
  icon: LucideIcon;
  fill: string;
  ink: string;
}[] = [
  {
    title: "Reported",
    body: "Pinned on the map, categorised, with evidence and the time it was seen.",
    icon: Megaphone,
    fill: "var(--status-1)",
    ink: "var(--status-1-ink)",
  },
  {
    title: "Under review",
    body: "A planner picks it up, checks the evidence and sets it in motion.",
    icon: ClipboardCheck,
    fill: "var(--status-2)",
    ink: "var(--status-2-ink)",
  },
  {
    title: "Corroborated",
    body: "Neighbours endorse it, or a second report confirms the same spot.",
    icon: UserRoundCheck,
    fill: "var(--status-3)",
    ink: "var(--status-3-ink)",
  },
  {
    title: "Verified",
    body: "Confirmed as a real fault by the department responsible.",
    icon: ShieldCheck,
    fill: "var(--status-4)",
    ink: "var(--status-4-ink)",
  },
  {
    title: "Resolved",
    body: "Fixed, with the official's notes recorded against the report.",
    icon: FileCheck2,
    fill: "var(--status-5)",
    ink: "var(--status-5-ink)",
  },
];

const ROLES: {
  role: string;
  icon: LucideIcon;
  href: string;
  hrefLabel: string;
  points: string[];
}[] = [
  {
    role: "Resident",
    icon: Smartphone,
    href: "/app",
    hrefLabel: "Open the app",
    points: [
      "Report by tapping the map, with two evidence angles",
      "Endorse a neighbour's report instead of duplicating it",
      "Follow the status and the 48-hour waste SLA",
      "Get security alerts raised near you",
    ],
  },
  {
    role: "Planner",
    icon: Building2,
    href: "/planner",
    hrefLabel: "Planner console",
    points: [
      "Triage the live ward map, search and filter",
      "Assign work and update status in one place",
      "Read trends, category counts and hotspots",
      "Export the list for the day and hand it over",
    ],
  },
  {
    role: "Official",
    icon: ShieldCheck,
    href: "/officials",
    hrefLabel: "Officials dashboard",
    points: [
      "See the issues assigned to you",
      "Move a report along the pipeline",
      "Leave notes the resident can read",
      "Close the loop without a phone call",
    ],
  },
];

export function HowItWorks() {
  const reduced = useReducedMotion();

  return (
    <section id="how" className="scroll-mt-20 border-t border-border/60 py-16 lg:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            How it works
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            One track, five stages, three roles.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            A report is never simply &ldquo;open&rdquo;. It moves along a
            pipeline that everyone can see, and the person who has to act next
            is always the one looking at it.
          </p>
        </Reveal>

        {/* Pipeline - a rail that draws itself, then the stages on it. */}
        <div className="relative mt-14">
          {/* Desktop rail */}
          <div
            className="pointer-events-none absolute top-[2.35rem] right-[8%] left-[8%] hidden h-0.5 origin-left rounded-full bg-border lg:block"
            aria-hidden="true"
          >
            <motion.div
              className="h-full origin-left rounded-full bg-primary"
              initial={reduced ? undefined : { scaleX: 0 }}
              whileInView={reduced ? undefined : { scaleX: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />
          </div>

          {/* Mobile rail */}
          <div
            className="pointer-events-none absolute top-4 bottom-4 left-[1.35rem] w-0.5 origin-top rounded-full bg-border lg:hidden"
            aria-hidden="true"
          >
            <motion.div
              className="h-full w-full origin-top rounded-full bg-primary"
              initial={reduced ? undefined : { scaleY: 0 }}
              whileInView={reduced ? undefined : { scaleY: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 1.2, ease: "easeInOut" }}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-5 lg:gap-3">
            {STAGES.map((stage, index) => (
              <motion.div
                key={stage.title}
                initial={reduced ? undefined : { opacity: 0, y: 16 }}
                whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{
                  duration: 0.5,
                  delay: 0.15 + index * 0.13,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative pl-12 lg:pl-0"
              >
                <span
                  className="absolute top-0 left-0 flex h-11 w-11 items-center justify-center rounded-xl border-4 border-background shadow-soft lg:relative lg:mx-auto"
                  style={{ backgroundColor: stage.fill, color: stage.ink }}
                >
                  <stage.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="mt-3 lg:mt-4 lg:text-center">
                  <h3 className="text-sm font-bold tracking-tight text-foreground">
                    {stage.title}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                    {stage.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          A report that does not stand up is marked{" "}
          <span className="font-semibold text-destructive">Rejected</span> and
          leaves the pipeline &mdash; it does not sit in it.
        </p>

        {/* Roles */}
        <RevealGroup className="mt-16 grid gap-4 lg:grid-cols-3">
          {ROLES.map((role) => (
            <RevealItem key={role.role} className="h-full">
              <article className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:border-primary/40 hover:shadow-lifted">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <role.icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold tracking-tight text-foreground">
                      {role.role}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      A view scoped to what this role does
                    </p>
                  </div>
                </div>

                <ul className="mt-5 flex-1 space-y-2.5">
                  {role.points.map((point) => (
                    <li
                      key={point}
                      className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground"
                    >
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                        aria-hidden="true"
                      />
                      {point}
                    </li>
                  ))}
                </ul>

                <a
                  href={role.href}
                  className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  {role.hrefLabel}
                  <span aria-hidden="true">&rarr;</span>
                </a>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>
      </div>
    </section>
  );
}
