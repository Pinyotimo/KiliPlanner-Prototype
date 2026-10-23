import {
  Camera,
  GitBranch,
  Layers,
  MapPin,
  ShieldAlert,
  Sprout,
  WifiOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal, RevealGroup, RevealItem } from "./Reveal";

const FEATURES: {
  icon: LucideIcon;
  title: string;
  body: string;
}[] = [
  {
    icon: MapPin,
    title: "Pinned, not described",
    body: "A tap on the map fixes the location. A boundary check runs on your device before the report is filed, so a pin outside the covered area never becomes a report, and the address is filled in for you.",
  },
  {
    icon: Camera,
    title: "Evidence, not hearsay",
    body: "Two live evidence angles, a photo and the accuracy of your position travel with the report, so a crew arriving at the spot knows what it is looking at.",
  },
  {
    icon: Layers,
    title: "One shared map",
    body: "Nearby duplicates are detected before you file, and neighbours can endorse a report instead of raising a second one. One burst main reads as one problem.",
  },
  {
    icon: GitBranch,
    title: "A pipeline, not a black hole",
    body: "Every report carries a status from Unverified through to Resolved, with the official's notes attached, so nothing quietly disappears.",
  },
  {
    icon: ShieldAlert,
    title: "Security alerts that carry",
    body: "Not every report is a fault. A security alert takes its own treatment on the map and pushes a notification to the residents nearest to it, so the people closest to the risk hear it first.",
  },
  {
    icon: WifiOff,
    title: "Built for a patchy network",
    body: "The app keeps a local copy of the ward's reports, so the map and the feed still open when the connection drops &mdash; and it says plainly when what you are looking at is older than the live data.",
  },
];

export function WhatSection() {
  return (
    <section id="what" className="scroll-mt-20 border-t border-border/60 py-16 lg:py-24">
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
            What it is
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            A shared record of the ward&rsquo;s infrastructure, built on a map.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground">
            Most complaint systems record a sentence. KiliPlanner records a
            place, the evidence behind it, and what happened next &mdash; and
            shows the same thing to everyone involved.
          </p>
        </Reveal>

        <RevealGroup className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {FEATURES.map((feature) => (
            <RevealItem key={feature.title} className="h-full">
              <article className="group h-full rounded-2xl border border-border bg-card p-6 shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lifted">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors duration-300 group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-base font-bold tracking-tight text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </article>
            </RevealItem>
          ))}
        </RevealGroup>

        {/* Green Pin - the one category that is not a fault report. */}
        <Reveal delay={0.05} className="mt-4">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
            <div
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in oklab, var(--success) 20%, transparent), transparent 70%)",
              }}
              aria-hidden="true"
            />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-success/12 text-success">
                <Sprout className="h-6 w-6" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <h3 className="text-lg font-bold tracking-tight text-foreground">
                  Green Pin: not everything is a fault
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Some corners need a project, not a repair. Green Pin lets a
                  resident propose one &mdash; a tree pit, a footbridge, a
                  play space &mdash; and it runs through the same pipeline, so
                  proposals are visible, discussed and eventually decided
                  instead of vanishing into a suggestion box.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
