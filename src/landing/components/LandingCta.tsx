import { ArrowRight, MapPin } from "lucide-react";
import { ActionLink } from "./ActionLink";
import { Reveal } from "./Reveal";

export function LandingCta() {
  return (
    <section className="border-t border-border/60 px-4 py-16 sm:px-6 lg:py-20">
      <Reveal className="mx-auto w-full max-w-7xl">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-lifted sm:p-12">
          <div
            className="pointer-events-none absolute -top-24 -right-16 h-72 w-72 rounded-full blur-3xl"
            style={{
              background:
                "radial-gradient(circle, color-mix(in oklab, var(--primary) 24%, transparent), transparent 70%)",
            }}
            aria-hidden="true"
          />
          <div
            className="lp-grid pointer-events-none absolute inset-0 opacity-25"
            aria-hidden="true"
          />

          <div className="relative flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl lg:text-4xl">
                See what the ward has already reported.
              </h2>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                The live map is open to everyone. Pin a problem, add what you
                can see, and follow it until it is resolved.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <ActionLink href="/app" size="lg" className="relative overflow-hidden">
                <span className="lp-sweep absolute inset-0 overflow-hidden" />
                <MapPin className="h-4 w-4" aria-hidden="true" />
                Open the live app
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </ActionLink>
              <ActionLink href="/officials" variant="outline" size="lg">
                Officials dashboard
              </ActionLink>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
