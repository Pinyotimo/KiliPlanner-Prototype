import { navigateToPlanner } from '../lib/plannerAccess';
import type { Issue } from '../../types/issue';
import { CATEGORY_LABELS } from '../../types/issue';
import StatusBadge from './StatusBadge';

type IssueTableProps = {
  issues: Issue[];
};

export default function IssueTable({ issues }: IssueTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="hidden min-w-full divide-y divide-slate-200 text-left text-sm md:table">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-4 py-3 font-semibold">Report</th>
            <th className="px-4 py-3 font-semibold">Category</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Location</th>
            <th className="px-4 py-3 font-semibold">Reported</th>
            <th className="px-4 py-3 font-semibold">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-slate-700">
          {issues.map((issue) => (
            <tr key={issue.id} className="hover:bg-slate-50">
              <td className="px-4 py-3">
                <div className="max-w-xs font-medium text-slate-900">{issue.description}</div>
                <div className="text-xs text-slate-500">{issue.id}</div>
              </td>
              <td className="px-4 py-3">{CATEGORY_LABELS[issue.category]}</td>
              <td className="px-4 py-3"><StatusBadge status={issue.status} /></td>
              <td className="px-4 py-3">{issue.address || `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`}</td>
              <td className="whitespace-nowrap px-4 py-3">{new Date(issue.created_at).toLocaleDateString()}</td>
              <td className="px-4 py-3"><button type="button" className="font-medium text-blue-600 hover:text-blue-800" onClick={() => navigateToPlanner(`/planner/issues/${issue.id}`)}>View</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="space-y-3 p-3 md:hidden">
        {issues.map((issue) => (
          <button key={issue.id} type="button" onClick={() => navigateToPlanner(`/planner/issues/${issue.id}`)} className="block w-full rounded-lg border border-slate-200 p-4 text-left hover:border-blue-300">
            <div className="flex items-start justify-between gap-3"><span className="font-medium text-slate-900">{issue.description}</span><StatusBadge status={issue.status} /></div>
            <p className="mt-2 text-xs text-slate-500">{issue.id} · {CATEGORY_LABELS[issue.category]}</p>
            <p className="mt-1 truncate text-xs text-slate-500">{issue.address || `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
