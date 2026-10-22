import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowDown, Check, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import { Reveal } from "./Reveal";

const PROBLEMS = [
  {
    title: "The thread scrolls away",
    body: "A complaint gets one reply, then is buried under the next one. Nothing says whether it was ever fixed.",
  },
  {
    title: "Nobody owns the queue",
    body: "Three estates report the same burst main, the ward counts it three times, and no single list shows the crew what is waiting.",
  },
  {
    title: "A suggestion box sees last month",
    body: "No timestamp, no location, no way to follow up &mdash; and no way for the resident to see the result either.",
  },
  {
    title: "A description is not evidence",
    body: "A crew arriving at a described location still has to find the problem. A place, a picture and a time is what makes it actionable.",
  },
];

const STATUSES = [
  { label: "Unverified", fill: "var(--status-1)", ink: "var(--status-1-ink)" },
  { label: "Under review", fill: "var(--status-2)", ink: "var(--status-2-ink)" },
  { label: "Corroborated", fill: "var(--status-3)", ink: "var(--status-3-ink)" },
  { label: "Verified", fill: "var(--status-4)", ink: "var(--status-4-ink)" },
  { label: "Resolved", fill: "var(--status-5)", ink: "var(--status-5-ink)" },
];

export function WhySection() {
  return (
    <section
      id="why"
      className="scroll-mt-20 border-t border-border/60 bg-surface-raised/40 py-16 lg:py-24"
    >
      <div className="mx-auto grid w-full max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
        <div>
          <Reveal>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
              Why it exists
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              The ward already reports everything. It just never sees the same
              picture twice.
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              KiliPlanner was built for the gap between a resident seeing a
              problem and a crew ever arriving at it. Everything the product
              does &mdash; pinning, evidence, corroboration, the status track
              &mdash; exists to close that one gap.
            </p>
          </Reveal>

          <div className="mt-8 space-y-3">
            {PROBLEMS.map((problem, index) => (
              <Reveal key={problem.title} delay={index * 0.05}>
                <div className="flex gap-3.5 rounded-xl border border-border bg-card p-4 shadow-soft">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-foreground">
                      {problem.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                      {problem.body}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>

        <Reveal delay={0.1} className="lg:pt-4">
          <BeforeAfter />
        </Reveal>
      </div>
    </section>
  );
}

/**
 * The same problem, twice. On the left, three threads that never meet. On
 * the right, one report with a place, a status and a clock on it.
 */
function BeforeAfter() {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (reduced) {
      setStage(STATUSES.length - 1);
      return;
    }
    const timer = window.setInterval(
      () => setStage((current) => (current + 1) % STATUSES.length),
      2400,
    );
    return () => window.clearInterval(timer);
  }, [reduced]);

  const status = STATUSES[stage];

  return (
    <div className="relative">
      {/* Before */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Before
        </p>
        <div className="mt-4 space-y-3">
          {[
            { text: "Sewage is running at the junction", time: "08:04" },
            { text: "Same pipe burst again, please hurry", time: "11:47" },
            { text: "Anyone seen water near here?", time: "14:12" },
          ].map((message, index) => (
            <motion.div
              key={message.text}
              initial={reduced ? undefined : { opacity: 0, x: -12 }}
              whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: index * 0.12 }}
              className="max-w-[88%] rounded-2xl rounded-tl-sm border border-border bg-muted px-3.5 py-2.5"
            >
              <p className="text-xs leading-relaxed text-muted-foreground">
                {message.text}
              </p>
              <p className="mt-1 text-[10px] text-muted-foreground/70">
                {message.time}
              </p>
            </motion.div>
          ))}
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
          Three complaints, one problem, no status.
        </p>
      </div>

      <motion.div
        initial={reduced ? undefined : { opacity: 0 }}
        whileInView={reduced ? undefined : { opacity: 1 }}
        viewport={{ once: true }}
        className="my-3 flex justify-center"
        aria-hidden="true"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
          <ArrowDown className="h-4 w-4" />
        </span>
      </motion.div>

      {/* After */}
      <div className="rounded-2xl border border-primary/30 bg-card p-5 shadow-lifted">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
          After
        </p>

        <div className="mt-4 rounded-xl border border-border bg-background p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      "var(--category-water, var(--primary))",
                  }}
                  aria-hidden="true"
                />
                <p className="text-sm font-bold text-foreground">Sewage</p>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                Burst sewage pipe at the junction, running to the road
              </p>
            </div>
            <span
              className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold"
              style={{ backgroundColor: status.fill, color: status.ink }}
            >
              {status.label}
            </span>
          </div>

          <div className="mt-3.5 flex flex-wrap items-center gap-2 border-t border-border pt-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/12 px-2.5 py-1 text-[10px] font-semibold text-success">
              <Check className="h-3 w-3" aria-hidden="true" />
              2 evidence angles
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
              4 neighbours endorsed
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
              48h SLA
            </span>
          </div>
        </div>

        <p className="mt-4 text-xs font-medium text-muted-foreground">
          One report, one place, one status &mdash; visible to everyone.
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={reduced ? undefined : { opacity: 0 }}
          animate={reduced ? undefined : { opacity: 1 }}
          exit={reduced ? undefined : { opacity: 0 }}
          className="sr-only"
          aria-live="polite"
        >
          Status: {status.label}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
