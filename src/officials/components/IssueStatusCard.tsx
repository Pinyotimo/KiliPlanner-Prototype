import React, { useState } from "react";
import {
  ShieldAlert,
  Clock,
  Building2,
  Loader2,
  Send,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import type { OfficialIssue, IssueStatus } from "../types/official";
import { CATEGORY_LABELS } from "../../types/issue";
import { CategoryIcon } from "../../components/CategoryIcon";
import { Button } from "../../components/ui/button";
import { cn } from "@/lib/utils";

interface IssueStatusCardProps {
  issue: OfficialIssue;
  onUpdateStatus: (
    issueId: string,
    status: IssueStatus,
    notes: string,
    verificationStatus?: string,
  ) => Promise<void>;
}

/**
 * Verification states sit on the ordered status ramp, so each takes one
 * rung of `--status-1` ... `--status-5`. The label beside it carries the
 * meaning, so the colour is a supporting cue rather than the only signal.
 */
const VERIFICATION_STEPS: Record<string, { label: string; step: number }> = {
  UNVERIFIED: { label: "Under Verification", step: 1 },
  UNDER_REVIEW: { label: "Under Review", step: 2 },
  CORROBORATED: { label: "Corroborated", step: 3 },
  VERIFIED: { label: "Verified Issue", step: 4 },
  REJECTED: { label: "Rejected", step: 0 },
};

export const IssueStatusCard: React.FC<IssueStatusCardProps> = ({
  issue,
  onUpdateStatus,
}) => {
  const [status, setStatus] = useState<IssueStatus>(
    (issue.status as IssueStatus) || "open",
  );
  // Separate state for verification/trust lifecycle state
  const [verificationStatus, setVerificationStatus] = useState<string>(
    (issue as any).verification_status || issue.status || "UNVERIFIED",
  );
  const [notes, setNotes] = useState(issue.official_notes || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSecurity = issue.is_security_alert || issue.category === "security";
  const isGreenProject = issue.category === "green_project";
  const photoSource = (issue as any).photo_base64 || (issue as any).photo_url;

  const verification = VERIFICATION_STEPS[verificationStatus] ?? {
    label: verificationStatus,
    step: 1,
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onUpdateStatus(issue.id, status, notes, verificationStatus);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <article
      className={cn(
        "space-y-4 rounded-xl border bg-card p-5 shadow-soft transition-shadow",
        isSecurity
          ? "border-destructive/60 ring-1 ring-destructive/20"
          : "border-border hover:shadow-lifted",
      )}
    >
      {/* Security alert priority banner */}
      {isSecurity && (
        <div className="flex flex-wrap items-center justify-between gap-1.5 rounded-lg bg-destructive px-3 py-2 text-xs font-bold text-destructive-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>TOP PRIORITY SAFETY ALERT</span>
          </span>
          {issue.unsafe_time && (
            <span className="rounded-md bg-destructive-foreground/15 px-2 py-0.5 text-[11px] font-medium">
              Unsafe: {issue.unsafe_time}
            </span>
          )}
        </div>
      )}

      {/* Card header */}
      <div className="flex items-start justify-between gap-3 border-b border-border pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-muted text-foreground">
            <CategoryIcon category={issue.category} className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-foreground sm:text-base">
              {issue.summary ||
                CATEGORY_LABELS[issue.category as keyof typeof CATEGORY_LABELS] ||
                issue.category}
            </h3>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" aria-hidden="true" />
                {new Date(issue.created_at).toLocaleDateString("en-KE", {
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <span aria-hidden="true">•</span>
              <span className="truncate">{issue.address || "Location pinned"}</span>
            </div>
          </div>
        </div>

        {!isGreenProject && (
          <span className="shrink-0 rounded-lg border border-border bg-muted px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-foreground">
            {status.replace("_", " ")}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
        {issue.description}
      </p>

      {/* Photo evidence */}
      {photoSource && (
        <div className="relative max-h-72 overflow-hidden rounded-xl border border-border bg-muted">
          <img
            src={photoSource}
            alt="Report evidence"
            className="h-full max-h-72 w-full object-cover"
          />
        </div>
      )}

      {/* Verification and status controls */}
      <form
        onSubmit={handleSubmit}
        className="space-y-3 border-t border-border pt-3"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <label
              htmlFor={`verification-${issue.id}`}
              className="flex items-center gap-1 text-xs font-semibold text-foreground"
            >
              <ShieldCheck
                className="h-3.5 w-3.5 text-primary"
                aria-hidden="true"
              />
              Verification Status
            </label>
            <select
              id={`verification-${issue.id}`}
              value={verificationStatus}
              onChange={(e) => setVerificationStatus(e.target.value)}
              className="w-full cursor-pointer rounded-lg border border-input bg-card p-2.5 text-xs text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
            >
              <option value="UNVERIFIED">Under Verification</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="CORROBORATED">Corroborated</option>
              <option value="VERIFIED">Verified Issue</option>
              <option value="REJECTED">Rejected</option>
            </select>
            {/* The current rung of the ordered ramp, named in text. */}
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    verification.step === 0
                      ? "var(--destructive)"
                      : `var(--status-${verification.step})`,
                }}
                aria-hidden="true"
              />
              {verification.label}
            </p>
          </div>

          {!isGreenProject && (
            <div className="space-y-1">
              <label
                htmlFor={`workflow-${issue.id}`}
                className="flex items-center gap-1 text-xs font-semibold text-foreground"
              >
                <CheckCircle2
                  className="h-3.5 w-3.5 text-primary"
                  aria-hidden="true"
                />
                Workflow Status
              </label>
              <select
                id={`workflow-${issue.id}`}
                value={status}
                onChange={(e) => setStatus(e.target.value as IssueStatus)}
                className="w-full cursor-pointer rounded-lg border border-input bg-card p-2.5 text-xs text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          )}
        </div>

        {/* Resolution / planning notes */}
        <div className="space-y-1">
          <label
            htmlFor={`notes-${issue.id}`}
            className="flex items-center gap-1 text-xs font-semibold text-foreground"
          >
            <Building2 className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            {isGreenProject
              ? "Official Planning Notes"
              : "Official Resolution Notes"}
          </label>
          <textarea
            id={`notes-${issue.id}`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2.5}
            placeholder="Add internal or public update notes for the community..."
            className="w-full resize-none rounded-lg border border-input bg-card p-2.5 text-xs text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving updates...</span>
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5" />
              <span>{isGreenProject ? "Save Planning Notes" : "Save Changes"}</span>
            </>
          )}
        </Button>
      </form>
    </article>
  );
};
