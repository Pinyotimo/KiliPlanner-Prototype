import { Info } from "lucide-react";

export default function AboutSection() {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6">
      <div className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-soft">
        <div className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Info className="h-5 w-5" />
          </span>
          About KiliPlanner
        </div>

        <p className="text-sm leading-relaxed text-muted-foreground">
          KiliPlanner is a civic infrastructure platform designed for Kilimani
          Ward. It connects residents, planners, and local officials by making
          it easier to report, monitor, and follow up on issues affecting the
          community.
        </p>

        <p className="text-sm leading-relaxed text-muted-foreground">
          Residents can report problems such as water disruptions, sewage
          issues, waste accumulation, pollution, damaged roads, and
          encroachment. Reports are mapped to their locations, shared with the
          community, and can be supported by other residents through
          endorsements and comments.
        </p>

        <div className="space-y-2 border-t border-border pt-4 text-sm">
          <p className="font-semibold text-foreground">How to report an issue:</p>

          <ol className="list-inside list-decimal space-y-1.5 text-muted-foreground">
            <li>
              Open{" "}
              <span className="font-medium text-foreground">Report Issue</span>{" "}
              from the navigation.
            </li>
            <li>
              Select or pinpoint the exact location of the problem on the map.
            </li>
            <li>
              Choose the appropriate issue category and describe the problem.
            </li>
            <li>
              Capture two live evidence angles and optionally provide your
              contact details.
            </li>
            <li>Review the location and submit your report.</li>
          </ol>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            KiliPlanner helps create a shared, location-based view of
            infrastructure concerns across Kilimani Ward, supporting better
            visibility, community participation, and follow-up on reported
            issues.
          </p>
        </div>
      </div>
    </div>
  );
}
