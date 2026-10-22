import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Camera,
  Droplets,
  MapPin,
  ShieldAlert,
  Timer,
} from "lucide-react";
import { useEffect, useState } from "react";
import { ActionLink } from "./ActionLink";
import { WardMapGraphic } from "../graphics/WardMapGraphic";

/** The verification pipeline, in the order a report moves through it. */
const STAGES = [
  { label: "Unverified", fill: "var(--status-1)", ink: "var(--status-1-ink)" },
  { label: "Under review", fill: "var(--status-2)", ink: "var(--status-2-ink)" },
  { label: "Corroborated", fill: "var(--status-3)", ink: "var(--status-3-ink)" },
  { label: "Verified", fill: "var(--status-4)", ink: "var(--status-4-ink)" },
  { label: "Resolved", fill: "var(--status-5)", ink: "var(--status-5-ink)" },
];

export function Hero() {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState(0);

  // A status that moves. It is the whole argument of the product in one
  // small component: a report is not a complaint that disappears, it is a
  // thing with a position on a track.
  useEffect(() => {
    if (reduced) {
      setStage(STAGES.length - 1);
      return;
    }
    const timer = window.setInterval(
      () => setStage((current) => (current + 1) % STAGES.length),
      2200,
    );
    return () => window.clearInterval(timer);
  }, [reduced]);

  const current = STAGES[stage];

  return (
    <section className="relative overflow-hidden pt-10 pb-16 sm:pt-16 lg:pt-20 lg:pb-24">
      {/* Ambient background: two drifting colour fields and a fine grid. */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div
          className="lp-orb absolute -top-40 -left-32 h-[34rem] w-[34rem] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, color-mix(in oklab, var(--primary) 26%, transparent), transparent 68%)",
          }}
        />
        <div
          className="lp-orb-slow absolute -right-40 top-24 h-[30rem] w-[30rem] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle at 60% 40%, color-mix(in oklab, var(--accent-foreground) 18%, transparent), transparent 70%)",
          }}
        />
        <div
          className="lp-grid absolute inset-0 opacity-40"
          style={{
            maskImage:
              "radial-gradient(ellipse 80% 60% at 50% 30%, #000 30%, transparent 78%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 80% 60% at 50% 30%, #000 30%, transparent 78%)",
          }}
        />
      </div>

      <div className="mx-auto grid w-full max-w-7xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-12 lg:gap-8">
        {/* ---------------------------------------------------------- copy */}
        <div className="lg:col-span-6">
          <motion.div
            initial={reduced ? undefined : { opacity: 0, y: 14 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground shadow-soft backdrop-blur"
          >
            <MapPin className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            Kilimani Ward, Nairobi
            <span className="h-1 w-1 rounded-full bg-border-strong" />
            Live now
          </motion.div>

          <motion.h1
            initial={reduced ? undefined : { opacity: 0, y: 18 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.06 }}
            className="mt-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
          >
            One map for every broken pipe,
            <br className="hidden sm:block" /> pothole and blocked
            drain in the ward.
          </motion.h1>

          <motion.p
            initial={reduced ? undefined : { opacity: 0, y: 18 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg"
          >
            KiliPlanner turns scattered complaints into a single, verified,
            location-based record that residents, planners and officials all
            work from. Reports are pinned to the map, checked against the ward
            boundary, and carried through a status pipeline until they are
            actually resolved.
          </motion.p>

          <motion.div
            initial={reduced ? undefined : { opacity: 0, y: 18 }}
            animate={reduced ? undefined : { opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <ActionLink href="/app" size="lg" className="relative overflow-hidden">
              <span className="lp-sweep absolute inset-0 overflow-hidden" />
              Open the live app
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </ActionLink>
            <ActionLink href="#how" variant="outline" size="lg">
              See how it works
            </ActionLink>
          </motion.div>

          {/* Facts about the system itself - nothing invented. */}
          <motion.dl
            initial={reduced ? undefined : { opacity: 0 }}
            animate={reduced ? undefined : { opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-10 grid max-w-xl grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4"
          >
            {[
              { value: "12", label: "Issue categories" },
              { value: "6", label: "Pipeline statuses" },
              { value: "3", label: "Role-scoped views" },
              { value: "1", label: "Area boundary" },
            ].map((fact) => (
              <div key={fact.label}>
                <dt className="sr-only">{fact.label}</dt>
                <dd>
                  <span className="block text-2xl font-bold tracking-tight text-foreground">
                    {fact.value}
                  </span>
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                    {fact.label}
                  </span>
                </dd>
              </div>
            ))}
          </motion.dl>
        </div>

        {/* ------------------------------------------------------- graphic */}
        <div className="relative lg:col-span-6">
          <motion.div
            initial={reduced ? undefined : { opacity: 0, scale: 0.96, y: 20 }}
            animate={reduced ? undefined : { opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-2xl border border-border bg-card/70 p-2 shadow-floating backdrop-blur-xl"
          >
            <WardMapGraphic className="h-auto w-full rounded-xl" />

            {/* A report card, as it appears in the feed. */}
            <motion.div
              initial={reduced ? undefined : { opacity: 0, y: 24 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55 }}
              className="lp-float absolute -bottom-6 -left-4 w-[15.5rem] rounded-xl border border-border bg-card/95 p-3 shadow-lifted backdrop-blur sm:-left-6"
            >
              <div className="flex items-start gap-2.5">
                <span
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor:
                      "color-mix(in oklab, var(--category-water, var(--primary)) 16%, transparent)",
                    color: "var(--category-water, var(--primary))",
                  }}
                  aria-hidden="true"
                >
                  <Droplets className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground">
                    Sewage
                  </p>
                  <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
                    Burst sewage pipe at the junction, running to the road
                  </p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold"
                  style={{ backgroundColor: current.fill, color: current.ink }}
                >
                  {current.label}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Timer className="h-3 w-3" aria-hidden="true" />
                  48h SLA
                </span>
              </div>
            </motion.div>

            {/* The security treatment: a distinct pin, a distinct sound. */}
            <motion.div
              initial={reduced ? undefined : { opacity: 0, y: -18 }}
              animate={reduced ? undefined : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="lp-float-slow absolute -top-5 -right-2 flex items-center gap-2 rounded-full border border-destructive/30 bg-card/95 px-3 py-2 shadow-lifted backdrop-blur sm:-right-4"
            >
              <span className="relative flex h-6 w-6 items-center justify-center">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive/40" />
                <span className="relative inline-flex h-6 w-6 items-center justify-center rounded-full bg-destructive/12 text-destructive">
                  <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </span>
              <span className="text-[11px] font-semibold text-foreground">
                Security alert
              </span>
              <span className="text-[11px] text-muted-foreground">
                neighbours notified
              </span>
            </motion.div>

            {/* Evidence: what a report carries with it. */}
            <motion.div
              initial={reduced ? undefined : { opacity: 0, x: 16 }}
              animate={reduced ? undefined : { opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.85 }}
              className="absolute top-1/3 -left-3 hidden items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-2 shadow-lifted backdrop-blur sm:flex"
            >
              <Camera className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <span className="text-[11px] font-medium text-foreground">
                2 evidence angles
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
