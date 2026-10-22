import { History } from "lucide-react";

export default function ActivityTimeline() {
  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-soft">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <History className="h-4 w-4 text-primary" aria-hidden="true" />
        Recent Activity
      </h2>
      <div className="mt-4 rounded-lg border border-dashed border-border bg-muted/50 p-5 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">
          Activity history is not available yet.
        </p>
        <p className="mt-1 leading-6">
          The current database stores report creation only. Add an activity
          table to show verification, assignment, and resolution events here.
        </p>
      </div>
    </section>
  );
}
