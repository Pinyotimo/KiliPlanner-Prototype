export default function ActivityTimeline() {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-foreground">Recent Activity</h3>
      <div className="rounded-lg border border-dashed border-input bg-muted p-5 text-sm text-foreground">
        <p className="font-medium text-foreground">Activity history is not available yet.</p>
        <p className="mt-1 leading-6">The current database stores report creation only. Add an activity table to show verification, assignment, and resolution events here.</p>
      </div>
    </div>
  );
}
