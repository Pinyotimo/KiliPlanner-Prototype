import React, { useState, useEffect, memo } from "react";
import { ThumbsUp, MapPin, ShieldAlert, Pencil, Trash2, BadgeCheck, MoreHorizontal, Building2, Timer, Loader2 } from "lucide-react";
import type { Issue } from "../../../types/issue";
import { CATEGORY_LABELS } from "../../../types/issue";
import { Button } from "../../../components/ui/button";
import { deleteIssue } from "../lib/deleteIssue";
import { editIssue } from "../lib/editIssue";
import { upvoteIssue } from "../lib/upvoteIssue";
import { CategoryIcon } from "../../../components/CategoryIcon";
import CommentSection from "./CommentSection";
import { getWasteSlaState, WASTE_SLA_HOURS } from "../lib/sla";
import { getStatusConfig } from "../lib/statusConfig";
import IssueEditForm from "./IssueEditForm";

interface IssueCardProps {
  issue: Issue;
  isTargeted: boolean;
  onUpdate?: (issueId: string, updates: Partial<Issue>) => Promise<void>;
  onDelete?: (issueId: string) => Promise<void>;
}

export const IssueCard = memo(({ issue, isTargeted, onUpdate, onDelete }: IssueCardProps) => {
  const [upvoting, setUpvoting] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState<number | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const isSecurity = (issue.is_security_alert || issue.category === "security") && issue.status !== "RESOLVED";
  const displayUpvotes = localUpvotes !== null ? localUpvotes : issue.upvotes || 1;
  const statusConfig = getStatusConfig(issue.status);
  const wasteSla = getWasteSlaState(issue, now);
  const isWasteOverdue = wasteSla?.overdue === true;

  useEffect(() => {
    if (!wasteSla || wasteSla.completed) return;
    const timer = window.setInterval(() => setNow(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, [issue.category, issue.created_at, issue.status, wasteSla?.completed]);

  useEffect(() => {
    const myIds: string[] = JSON.parse(localStorage.getItem("kili_my_issue_ids") || "[]");
    if (myIds.includes(String(issue.id))) setIsOwner(true);
  }, [issue]);

  async function handleUpvote() {
    if (upvoting) return;
    setUpvoting(true);
    setLocalUpvotes(displayUpvotes + 1);
    try {
      await upvoteIssue(issue.id);
      // Escalation logic here...
    } catch (err) {
      setLocalUpvotes(displayUpvotes);
    } finally {
      setUpvoting(false);
    }
  }

  async function handleSaveEdit(updates: Partial<Issue>) {
    if (onUpdate) await onUpdate(issue.id, updates);
    else await editIssue(issue.id, updates);
    setIsEditing(false);
    setShowMenu(false);
  }

  async function handleDelete() {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    if (onDelete) await onDelete(issue.id);
    else await deleteIssue(issue.id);
    const storedIds: string[] = JSON.parse(localStorage.getItem("kili_my_issue_ids") || "[]");
    localStorage.setItem("kili_my_issue_ids", JSON.stringify(storedIds.filter((id) => id !== String(issue.id))));
  }

  return (
    <article
      id={`issue-${issue.id}`}
      className={`bg-card rounded-2xl border p-5 shadow-sm transition-all duration-300 ${
        isSecurity ? "border-destructive bg-destructive/5" :
        isWasteOverdue ? "border-warning bg-warning/5" :
        isTargeted ? "ring-2 ring-primary border-primary shadow-md scale-[1.01]" : "border-border hover:shadow-md"
      }`}
    >
      {/* 1. Header (Social Media Style) */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border/50">
            <CategoryIcon category={issue.category} className="h-5 w-5 text-foreground/70" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-sm">
                {issue.is_verified_resident ? "Verified Resident" : "Community Member"}
              </span>
              {issue.is_verified_resident && <BadgeCheck className="h-4 w-4 text-primary" />}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
              <span>{new Date(issue.created_at).toLocaleDateString("en-KE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
              <span>•</span>
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md font-medium ${statusConfig.color}`}>
                {statusConfig.icon} {statusConfig.label}
              </span>
            </div>
          </div>
        </div>

        {isOwner && !isEditing && (
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} className="p-1.5 text-muted-foreground hover:bg-muted rounded-full transition-colors">
              <MoreHorizontal className="h-5 w-5" />
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-1 w-32 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-10">
                <button onClick={() => setIsEditing(true)} className="w-full text-left px-4 py-2 text-sm hover:bg-muted flex items-center gap-2">
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button onClick={handleDelete} className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 flex items-center gap-2">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Security & SLA Banners */}
      {isSecurity && (
        <div className="flex items-center gap-2 bg-destructive text-destructive-foreground px-3 py-2 rounded-lg text-xs font-bold mb-3 animate-pulse">
          <ShieldAlert className="h-4 w-4" />
          <span>TOP PRIORITY SAFETY ALERT {issue.unsafe_time && `— Unsafe: ${issue.unsafe_time}`}</span>
        </div>
      )}
      
      {wasteSla && (
         <div className={`mb-3 rounded-lg border px-3 py-2 ${isWasteOverdue ? "border-warning bg-warning/10" : "bg-muted/40"}`}>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="flex items-center gap-1"><Timer className="h-3.5 w-3.5"/> {WASTE_SLA_HOURS}h Resolution SLA</span>
              <span>{wasteSla.label}</span>
            </div>
            <div className="h-1.5 rounded-full bg-foreground/10 overflow-hidden">
               <div className={`h-full rounded-full ${isWasteOverdue ? "bg-warning" : "bg-primary"}`} style={{ width: `${wasteSla.progressPercent}%` }} />
            </div>
         </div>
      )}

      {/* 2. Body Content */}
      {isEditing ? (
        <IssueEditForm issue={issue} onSave={handleSaveEdit} onCancel={() => setIsEditing(false)} />
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-1 text-xs font-medium text-primary bg-primary/5 w-fit px-2 py-1 rounded-md mb-1">
            <MapPin className="h-3.5 w-3.5" />
            {issue.address || `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`} {issue.sub_detail && `— ${issue.sub_detail}`}
          </div>
          
          <p className="text-foreground text-[15px] leading-relaxed whitespace-pre-wrap">{issue.description}</p>
          
          {!isEditing && issue.photo_base64 && issue.photo_base64.length > 20 && (
            <div className="mt-3 rounded-xl overflow-hidden border border-border/50">
              <img src={issue.photo_base64} alt="Issue evidence" className="w-full max-h-[400px] object-cover" />
            </div>
          )}

          {issue.official_notes && (
            <div className="mt-3 rounded-lg bg-primary/5 border-l-4 border-primary p-3">
              <div className="flex items-center gap-1.5 font-bold text-primary text-xs uppercase mb-1">
                <Building2 className="h-3.5 w-3.5" /> Official Update
              </div>
              <p className="text-sm text-muted-foreground">{issue.official_notes}</p>
            </div>
          )}
        </div>
      )}

      {/* 3. Action Footer (Social Style) */}
      <div className="mt-4 pt-3 border-t border-border/50">
        <div className="flex items-center gap-4 mb-2">
          <button
            onClick={handleUpvote}
            disabled={upvoting}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${localUpvotes ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
          >
            {upvoting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className={`h-5 w-5 ${localUpvotes ? "fill-primary" : ""}`} />}
            {displayUpvotes}
          </button>
        </div>
        <CommentSection issueId={issue.id} />
      </div>
    </article>
  );
});

IssueCard.displayName = "IssueCard";