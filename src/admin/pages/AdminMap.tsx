import { useState } from "react";
import type { Issue } from '../../types/issue';
import type { IssueCategory, IssueStatus } from '../../types/issue';
import { CATEGORY_LABELS } from '../../types/issue';
import MapView from '../../components/MapView';
import StatusBadge from '../components/StatusBadge';
import { navigateToPlanner } from '../lib/plannerAccess';

export default function AdminMapPage({ issues }: { issues: Issue[] }) {
  const [category, setCategory] = useState<IssueCategory | "all">("all");
  const [status, setStatus] = useState<IssueStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string>();
  const filteredIssues = issues.filter((issue) => (category === "all" || issue.category === category) && (status === "all" || issue.status === status));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <select value={category} onChange={(event) => setCategory(event.target.value as IssueCategory | "all")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="all">All categories</option>{Object.keys(CATEGORY_LABELS).map((key) => <option key={key} value={key}>{CATEGORY_LABELS[key as IssueCategory]}</option>)}</select>
        <select value={status} onChange={(event) => setStatus(event.target.value as IssueStatus | "all")} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><option value="all">All statuses</option><option value="open">Open</option><option value="resolved">Resolved</option></select>
        <span className="self-center text-xs text-slate-500">Severity filtering is unavailable because severity is not stored.</span>
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="h-[calc(100vh-22rem)] min-h-[24rem] lg:h-[calc(100vh-15rem)] lg:min-h-[28rem]"><MapView issues={filteredIssues} selectedIssueId={selectedId} onIssueSelect={(issue) => setSelectedId(issue.id)} onValidClick={() => undefined} /></div><div className="flex flex-wrap gap-4 border-t border-slate-200 px-4 py-3 text-xs text-slate-600"><span><b className="mr-1 inline-block h-2.5 w-2.5 rounded-full bg-blue-600" />Category color</span><span><b className="mr-1">●</b>Open</span><span><b className="mr-1">✓</b>Resolved</span></div></div>
        <aside className="max-h-[calc(100vh-22rem)] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-sm lg:max-h-[calc(100vh-15rem)]"><h2 className="font-semibold text-slate-900">Reports on map</h2><p className="mt-1 text-xs text-slate-500">{filteredIssues.length} reports shown</p><div className="mt-4 space-y-2">{filteredIssues.map((issue) => <button key={issue.id} type="button" onClick={() => setSelectedId(issue.id)} className={`w-full rounded-lg border p-3 text-left ${selectedId === issue.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-300'}`}><div className="flex items-start justify-between gap-2"><span className="line-clamp-2 text-sm font-medium text-slate-800">{issue.description}</span><StatusBadge status={issue.status} /></div><p className="mt-1 text-xs text-slate-500">{CATEGORY_LABELS[issue.category]} · {issue.address || `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`}</p><span onClick={(event) => { event.stopPropagation(); navigateToPlanner(`/planner/issues/${issue.id}`); }} className="mt-2 inline-block text-xs font-semibold text-blue-600">View Details</span></button>)}{filteredIssues.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No reports match these filters.</p>}</div></aside>
      </div>
    </div>
  );
}
