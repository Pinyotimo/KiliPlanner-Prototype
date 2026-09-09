import { useEffect, useState } from "react";
import type { Issue } from '../../types/issue';
import { CATEGORY_LABELS } from '../../types/issue';
import StatusBadge from '../components/StatusBadge';
import MapView from '../../components/MapView';
import { navigateToPlanner } from '../lib/plannerAccess';
import { updateAdminIssueStatus } from '../lib/adminQueries';

export default function AdminIssueDetails({ issue }: { issue?: Issue }) {
  const [status, setStatus] = useState(issue?.status ?? "open");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    setStatus(issue?.status ?? "open");
    setMessage(null);
    setPhotoError(false);
  }, [issue?.id, issue?.status]);

  async function updateStatus(nextStatus: Issue["status"]) {
    if (!issue || nextStatus === status) return;
    setSaving(true);
    setMessage(null);
    const { error } = await updateAdminIssueStatus(issue.id, nextStatus);
    setSaving(false);
    if (error) {
      setMessage("Unable to update the issue. Current Supabase RLS allows public inserts but not planner updates.");
      return;
    }
    setStatus(nextStatus);
    window.dispatchEvent(new CustomEvent("planner-issue-updated", { detail: { id: issue.id, status: nextStatus } }));
    window.dispatchEvent(new CustomEvent("planner-notification", { detail: { message: "Issue status updated successfully." } }));
  }

  if (!issue) {
    return <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center"><p className="font-medium text-slate-800">Issue not found</p><button type="button" onClick={() => navigateToPlanner('/planner/issues')} className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Back to Issues</button></div>;
  }

  return (
    <div className="space-y-6">
      <button type="button" onClick={() => navigateToPlanner('/planner/issues')} className="text-sm font-medium text-blue-600 hover:text-blue-800">← Back to Issues</button>
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><p className="font-mono text-xs text-slate-500">{issue.id}</p><h2 className="mt-2 max-w-3xl text-2xl font-bold text-slate-900">{issue.description}</h2></div>
          <StatusBadge status={status} />
        </div>
        <div className="mt-6 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div><p className="text-xs uppercase tracking-wide text-slate-500">Category</p><p className="mt-1 font-medium text-slate-800">{CATEGORY_LABELS[issue.category]}</p></div>
          <div><p className="text-xs uppercase tracking-wide text-slate-500">Severity</p><p className="mt-1 font-medium text-slate-500">Not tracked</p></div>
          <div><p className="text-xs uppercase tracking-wide text-slate-500">Date reported</p><p className="mt-1 font-medium text-slate-800">{new Date(issue.created_at).toLocaleString()}</p></div>
          <div><p className="text-xs uppercase tracking-wide text-slate-500">Last updated</p><p className="mt-1 font-medium text-slate-500">Not tracked</p></div>
        </div>
        {issue.sub_detail && <p className="mt-5 rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{issue.sub_detail}</p>}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="text-lg font-semibold text-slate-900">Location</h3><p className="mt-2 text-sm text-slate-600">{issue.address || 'Address not available'}</p><p className="mt-1 font-mono text-xs text-slate-500">{issue.lat}, {issue.lng}</p><div className="mt-4 h-72 overflow-hidden rounded-lg [&_.map-container]:!h-full"><MapView issues={[issue]} onValidClick={() => undefined} /></div><button type="button" onClick={() => navigateToPlanner('/planner/map')} className="mt-4 text-sm font-semibold text-blue-600 hover:text-blue-800">Open on Map →</button></section>
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="text-lg font-semibold text-slate-900">Planner Actions</h3><label className="mt-5 block text-sm font-medium text-slate-700">Status<select value={status} disabled={saving} onChange={(event) => updateStatus(event.target.value as Issue["status"])} className="mt-2 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="open">Open</option><option value="resolved">Resolved</option></select></label>{message && <p className={`mt-4 text-sm ${message.startsWith('Unable') ? 'text-rose-700' : 'text-emerald-700'}`}>{message}</p>}<div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">Severity, assignment, planner notes, and workflow history are not supported by the current database schema.</div></section>
      </div>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="text-lg font-semibold text-slate-900">Photo</h3>{issue.photo_base64 && !photoError ? <a href={issue.photo_base64} target="_blank" rel="noreferrer"><img src={issue.photo_base64} alt="Infrastructure report attachment" onError={() => setPhotoError(true)} className="mt-4 max-h-[28rem] w-full rounded-lg border border-slate-200 object-contain" /></a> : <p className="mt-3 text-sm text-slate-500">{photoError ? 'The attached image could not be loaded.' : 'No photo attached.'}</p>}</section>

      {issue.reporter_name || issue.reporter_email ? <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"><h3 className="text-lg font-semibold text-slate-900">Reporter information</h3>{issue.reporter_name && <p className="mt-3 text-sm text-slate-700">Name: {issue.reporter_name}</p>}{issue.reporter_email && <p className="mt-1 text-sm text-slate-700">Email: {issue.reporter_email}</p>}</section> : null}
      </div>
  );
}
