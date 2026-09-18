import React, { useState } from "react";
import { OfficialIssue, IssueStatus } from "../types/official";

interface IssueStatusCardProps {
  issue: OfficialIssue;
  onUpdateStatus: (
    issueId: string,
    status: IssueStatus,
    notes: string,
  ) => Promise<void>;
}

export const IssueStatusCard: React.FC<IssueStatusCardProps> = ({
  issue,
  onUpdateStatus,
}) => {
  const [status, setStatus] = useState<IssueStatus>(
    (issue.status as IssueStatus) || "open",
  );
  const [notes, setNotes] = useState(issue.official_notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if issue is flagged as security priority
  const isSecurity = issue.is_security_alert || issue.category === "security";
  const isGreenProject = issue.category === "green_project";

  // Extract photo source whether stored as base64 string or image URL
  const photoSource = (issue as any).photo_base64 || (issue as any).photo_url;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onUpdateStatus(issue.id, status, notes);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`p-5 rounded-lg border shadow-sm space-y-4 transition-all ${
        isSecurity
          ? "bg-destructive/10 border-destructive/80 ring-1 ring-destructive/20"
          : "bg-card border-border"
      }`}
    >
      {/* Security Alert Priority Banner */}
      {isSecurity && (
        <div className="flex items-center justify-between bg-destructive text-primary-foreground px-3 py-1.5 rounded-md text-xs font-bold animate-pulse shadow-xs">
          <span>🚨 TOP PRIORITY SAFETY ALERT</span>
          {issue.unsafe_time && (
            <span className="text-[11px] bg-foreground/30 px-2 py-0.5 rounded font-medium">
              Unsafe: {issue.unsafe_time}
            </span>
          )}
        </div>
      )}

      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg text-foreground">
            {issue.summary || issue.description}
          </h3>
          <p className="text-sm text-muted-foreground">
            Category:{" "}
            <span className="font-medium text-foreground">
              {issue.category || "General"}
            </span>
          </p>
        </div>
        {!isGreenProject && (
          <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-primary/10 text-primary shrink-0">
            {status.replace("_", " ").toUpperCase()}
          </span>
        )}
      </div>

      <p className="text-foreground text-sm leading-relaxed">
        {issue.description}
      </p>

      {/* Render uploaded evidence photo if available */}
      {photoSource && (
        <div className="relative rounded-lg overflow-hidden border border-border bg-muted max-h-64">
          <img
            src={photoSource}
            alt="Report evidence"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-3 pt-3 border-t border-border"
      >
        {!isGreenProject && (
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">
              Update Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as IssueStatus)}
              disabled={isGreenProject}
              className="w-full text-sm rounded-md border-input shadow-sm p-2 border focus:ring-1 focus:ring-primary"
            >
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-foreground mb-1">
            {isGreenProject
              ? "Official Planning Notes"
              : "Official Resolution Notes"}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Add internal or public update notes..."
            className="w-full text-sm rounded-md border-input shadow-sm p-2 border focus:ring-1 focus:ring-primary"
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-opacity-90 disabled:opacity-50 transition-colors"
        >
          {isSubmitting
            ? "Saving..."
            : isGreenProject
              ? "Save Planning Notes"
              : "Update Issue"}
        </button>
      </form>
    </div>
  );
};
