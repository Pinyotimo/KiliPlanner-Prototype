import { useEffect, useState } from "react";
import type { Issue, IssueStatus } from "../../types/issue";
import { CATEGORY_LABELS } from "../../types/issue";
import StatusBadge from "../components/StatusBadge";
import MapView from "../../components/MapView";
import { navigateToPlanner } from "../lib/plannerAccess";
import { updateAdminIssueStatus } from "../lib/adminQueries";

export default function AdminIssueDetails({ issue }: { issue?: Issue }) {
  const [status, setStatus] = useState<IssueStatus>(
    issue?.status ?? "UNVERIFIED",
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    setStatus(issue?.status ?? "UNVERIFIED");
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
      setMessage(
        "Unable to update the issue. Current Supabase RLS allows public inserts but not planner updates.",
      );
      return;
    }
    setStatus(nextStatus);
    window.dispatchEvent(
      new CustomEvent("planner-issue-updated", {
        detail: { id: issue.id, status: nextStatus },
      }),
    );
    window.dispatchEvent(
      new CustomEvent("planner-notification", {
        detail: { message: "Issue status updated successfully." },
      }),
    );
  }

  if (!issue) {
    return (
      <div className="rounded-xl border border-dashed border-input bg-card p-10 text-center">
        <p className="font-medium text-foreground">Issue not found</p>
        <button
          type="button"
          onClick={() => navigateToPlanner("/planner/issues")}
          className="mt-4 rounded-lg border border-input px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
        >
          Back to Issues
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button
        type="button"
        onClick={() => navigateToPlanner("/planner/issues")}
        className="text-sm font-medium text-primary hover:text-primary"
      >
        ← Back to Issues
      </button>
      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-muted-foreground">
              {issue.id}
            </p>
            <h2 className="mt-2 max-w-3xl text-2xl font-bold text-foreground">
              {issue.description}
            </h2>
          </div>
          <StatusBadge status={status} />
        </div>
        <div className="mt-6 grid gap-4 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Category
            </p>
            <p className="mt-1 font-medium text-foreground">
              {CATEGORY_LABELS[issue.category]}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Severity
            </p>
            <p className="mt-1 font-medium text-muted-foreground">
              Not tracked
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Date reported
            </p>
            <p className="mt-1 font-medium text-foreground">
              {new Date(issue.created_at).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Last updated
            </p>
            <p className="mt-1 font-medium text-muted-foreground">
              Not tracked
            </p>
          </div>
        </div>
        {issue.sub_detail && (
          <p className="mt-5 rounded-lg bg-muted p-3 text-sm text-foreground">
            {issue.sub_detail}
          </p>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">Location</h3>
          <p className="mt-2 text-sm text-foreground">
            {issue.address || "Address not available"}
          </p>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            {issue.lat}, {issue.lng}
          </p>
          <div className="mt-4 h-72 overflow-hidden rounded-lg [&_.map-container]:!h-full">
            <MapView issues={[issue]} onValidClick={() => undefined} />
          </div>
          <button
            type="button"
            onClick={() => navigateToPlanner("/planner/map")}
            className="mt-4 text-sm font-semibold text-primary hover:text-primary"
          >
            Open on Map →
          </button>
        </section>
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">
            Planner Actions
          </h3>
          <label className="mt-5 block text-sm font-medium text-foreground">
            Status
            <select
              value={status}
              disabled={saving}
              onChange={(event) =>
                updateStatus(event.target.value as Issue["status"])
              }
              className="mt-2 block w-full rounded-lg border border-input bg-card px-3 py-2 text-sm"
            >
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="CORROBORATED">Corroborated</option>
              <option value="VERIFIED">Verified</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </label>
          {message && (
            <p
              className={`mt-4 text-sm ${message.startsWith("Unable") ? "text-destructive" : "text-primary"}`}
            >
              {message}
            </p>
          )}
          <div className="mt-6 rounded-lg border border-dashed border-input bg-muted p-4 text-sm text-foreground">
            State transitions are recorded in the report workflow history.
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-foreground">
          Live Evidence Angles
        </h3>
        {issue.photo_base64 && !photoError ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <a href={issue.photo_base64} target="_blank" rel="noreferrer">
              <img
                src={issue.photo_base64}
                alt="First infrastructure report evidence angle"
                onError={() => setPhotoError(true)}
                className="max-h-[28rem] w-full rounded-lg border border-border object-contain"
              />
            </a>
            {issue.photo_base64_second && (
              <a
                href={issue.photo_base64_second}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src={issue.photo_base64_second}
                  alt="Second infrastructure report evidence angle"
                  className="max-h-[28rem] w-full rounded-lg border border-border object-contain"
                />
              </a>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            {photoError
              ? "The attached image could not be loaded."
              : "No live evidence captured."}
          </p>
        )}
      </section>

      {issue.reporter_name || issue.reporter_email ? (
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-foreground">
            Reporter information
          </h3>
          {issue.reporter_name && (
            <p className="mt-3 text-sm text-foreground">
              Name: {issue.reporter_name}
            </p>
          )}
          {issue.reporter_email && (
            <p className="mt-1 text-sm text-foreground">
              Email: {issue.reporter_email}
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
