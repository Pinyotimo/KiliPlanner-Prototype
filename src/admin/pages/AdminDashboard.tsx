import type { Issue, IssueCategory } from '../../types/issue';
import { CATEGORY_COLORS, CATEGORY_LABELS } from '../../types/issue';
import StatCard from '../components/StatCard';
import IssueTable from '../components/IssueTable';
import IssueMap from '../components/IssueMap';
import ActivityTimeline from '../components/ActivityTimeline';

type AdminDashboardProps = { issues: Issue[] };

export default function AdminDashboard({ issues }: AdminDashboardProps) {
  const openCount = issues.filter((issue) => issue.status === 'open').length;
  const resolvedCount = issues.filter((issue) => issue.status === 'resolved').length;
  const todayCount = issues.filter((issue) => new Date(issue.created_at).toDateString() === new Date().toDateString()).length;
  const categoryCounts = new Map<IssueCategory, number>();
  issues.forEach((issue) => categoryCounts.set(issue.category, (categoryCounts.get(issue.category) ?? 0) + 1));

  return (
    <div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total Reports" value={String(issues.length)} description="All infrastructure reports currently loaded." icon="▦" tone="neutral" />
        <StatCard label="New Reports" value={String(openCount)} description="Open reports requiring planner attention." icon="✦" tone="warning" />
        <StatCard label="Verified" value="—" description="Verification is not represented in the current schema." icon="✓" tone="neutral" />
        <StatCard label="In Progress" value="—" description="Work-in-progress status is not represented in the current schema." icon="↗" tone="neutral" />
        <StatCard label="Resolved" value={String(resolvedCount)} description="Reports with the existing resolved status." icon="✓" tone="success" />
        <StatCard label="High Priority" value="—" description="Severity and priority are not represented in the current schema." icon="!" tone="danger" />
      </div>

      <div className="mt-6">
        <IssueMap issues={issues} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Reports by Category</h2>
          <div className="mt-5 space-y-4">
            {Array.from(categoryCounts.entries()).map(([category, count]) => (
              <div key={category}>
                <div className="mb-1 flex justify-between text-sm"><span className="text-slate-600">{CATEGORY_LABELS[category]}</span><strong>{count}</strong></div>
                <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full" style={{ width: `${issues.length ? (count / issues.length) * 100 : 0}%`, backgroundColor: CATEGORY_COLORS[category] }} /></div>
              </div>
            ))}
            {categoryCounts.size === 0 && <p className="text-sm text-slate-500">No reports have been submitted yet.</p>}
          </div>
        </section>
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Reports by Status</h2>
          <div className="mt-5 space-y-3">
            {[['open', openCount], ['resolved', resolvedCount]].map(([status, count]) => <div key={status} className="flex items-center justify-between rounded-lg bg-slate-50 p-3 text-sm"><span className="capitalize text-slate-600">{status}</span><strong>{count}</strong></div>)}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-lg font-semibold text-slate-900">Priority Attention</h2><div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm text-slate-600">No critical infrastructure issues require immediate attention. Severity is not tracked in the current database schema.</div></section>
        <ActivityTimeline />
      </div>

      <div className="mt-6">
        <div className="mb-3 flex items-center justify-between"><div><h2 className="text-lg font-semibold text-slate-900">Recent Reports</h2><p className="text-sm text-slate-500">{todayCount} submitted today.</p></div></div>
        <IssueTable issues={issues.slice(0, 10)} />
      </div>
    </div>
  );
}
