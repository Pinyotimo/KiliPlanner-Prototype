import { Info } from "lucide-react";

export default function AboutSection() {
  return (
    <div className="max-w-2xl mx-auto p-6 space-y-4">
      <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold text-lg">
          <Info className="h-5 w-5" />
          About KiliPlanner
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          KiliPlanner is a civic infrastructure platform designed for Kilimani
          Ward. It connects residents, planners, and local officials by making
          it easier to report, monitor, and follow up on issues affecting the
          community.
        </p>

        <p className="text-sm text-muted-foreground leading-relaxed">
          Residents can report problems such as water disruptions, sewage
          issues, waste accumulation, pollution, damaged roads, and
          encroachment. Reports are mapped to their locations, shared with the
          community, and can be supported by other residents through
          endorsements and comments.
        </p>

        <div className="border-t border-border/60 pt-4 text-sm space-y-2">
          <p className="font-semibold text-foreground">
            How to report an issue:
          </p>

          <ol className="list-decimal list-inside text-muted-foreground space-y-1.5">
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

        <div className="border-t border-border/60 pt-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
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
