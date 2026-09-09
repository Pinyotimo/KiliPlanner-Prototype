export default function ActivityTimeline() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-900">Recent Activity</h3>
      <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">
        <p className="font-medium text-slate-800">Activity history is not available yet.</p>
        <p className="mt-1 leading-6">The current database stores report creation only. Add an activity table to show verification, assignment, and resolution events here.</p>
      </div>
    </div>
  );
}
