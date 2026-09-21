import React, { useState } from "react";
import { 
  ShieldAlert, 
  Clock, 
  Building2, 
  Loader2, 
  Send, 
  CheckCircle2, 
  ShieldCheck 
} from "lucide-react";
import type { OfficialIssue, IssueStatus } from "../types/official";
import { CATEGORY_LABELS } from "../../types/issue";
import { CategoryIcon } from "../../components/CategoryIcon";
import { Button } from "../../components/ui/button";

interface IssueStatusCardProps {
  issue: OfficialIssue;
  onUpdateStatus: (
    issueId: string,
    status: IssueStatus,
    notes: string,
    verificationStatus?: string,
  ) => Promise<void>;
}

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
    <div
      className={`rounded-2xl border p-5 shadow-sm space-y-4 transition-all bg-card ${
        isSecurity
          ? "border-destructive/80 bg-destructive/5 ring-1 ring-destructive/20"
          : "border-border/80 hover:shadow-md"
      }`}
    >
      {/* Security Alert Priority Banner */}
      {isSecurity && (
        <div className="flex flex-wrap items-center justify-between gap-1.5 bg-destructive text-destructive-foreground px-3 py-2 rounded-xl text-xs font-bold animate-pulse shadow-xs">
          <span className="flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>TOP PRIORITY SAFETY ALERT</span>
          </span>
          {issue.unsafe_time && (
            <span className="text-[11px] bg-foreground/20 px-2 py-0.5 rounded-md font-medium">
              Unsafe: {issue.unsafe_time}
            </span>
          )}
        </div>
      )}

      {/* Card Header */}
      <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0 border border-border/60 text-foreground">
            <CategoryIcon category={issue.category} className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
              {issue.summary || CATEGORY_LABELS[issue.category as keyof typeof CATEGORY_LABELS] || issue.category}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(issue.created_at).toLocaleDateString("en-KE", { month: "short", day: "numeric" })}
              </span>
              <span>•</span>
              <span className="truncate">{issue.address || "Location pinned"}</span>
            </div>
          </div>
        </div>

        {!isGreenProject && (
          <span className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-primary/10 text-primary border border-primary/20 shrink-0">
            {status.replace("_", " ")}
          </span>
        )}
      </div>

      {/* Description */}
      <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap">
        {issue.description}
      </p>

      {/* Photo Evidence */}
      {photoSource && (
        <div className="relative rounded-xl overflow-hidden border border-border/60 bg-muted max-h-72">
          <img
            src={photoSource}
            alt="Report evidence"
            className="w-full h-full object-cover max-h-72"
          />
        </div>
      )}

      {/* Action Form for Verification & Status Updates */}
      <form onSubmit={handleSubmit} className="space-y-3 pt-3 border-t border-border/50">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Verification Status Control */}
          <div className="space-y-1">
            <label className="block text-xs font-semibold text-foreground flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-primary" />
              Verification Status
            </label>
            <select
              value={verificationStatus}
              onChange={(e) => setVerificationStatus(e.target.value)}
              className="w-full text-xs rounded-lg border border-border bg-background p-2.5 text-foreground focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="UNVERIFIED">Under Verification</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="CORROBORATED">Corroborated</option>
              <option value="VERIFIED">Verified Issue</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          {/* Operational/Workflow Status Control */}
          {!isGreenProject && (
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                Workflow Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as IssueStatus)}
                className="w-full text-xs rounded-lg border border-border bg-background p-2.5 text-foreground focus:ring-2 focus:ring-primary/20 cursor-pointer"
              >
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          )}
        </div>

        {/* Resolution/Planning Notes */}
        <div className="space-y-1">
          <label className="block text-xs font-semibold text-foreground flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5 text-primary" />
            {isGreenProject ? "Official Planning Notes" : "Official Resolution Notes"}
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2.5}
            placeholder="Add internal or public update notes for the community..."
            className="w-full text-xs rounded-lg border border-border bg-background p-2.5 text-foreground resize-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full gap-2 text-xs font-semibold py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm cursor-pointer"
        >
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
    </div>
  );
};