import React, { useState, useEffect, memo } from "react";
import {
  ThumbsUp,
  MapPin,
  ShieldAlert,
  Pencil,
  Trash2,
  BadgeCheck,
  MoreHorizontal,
  Building2,
  Timer,
  Loader2,
} from "lucide-react";
import type { Issue } from "../../../types/issue";
import { CATEGORY_COLORS, CATEGORY_SHORT_LABELS } from "../../../types/issue";
import { deleteIssue } from "../lib/deleteIssue";
import { editIssue } from "../lib/editIssue";
import { upvoteIssue } from "../lib/upvoteIssue";
import { CategoryIcon } from "../../../components/CategoryIcon";
import CommentSection from "./CommentSection";
import { getWasteSlaState, WASTE_SLA_HOURS } from "../lib/sla";
import { getStatusConfig } from "../lib/statusConfig";
import IssueEditForm from "./IssueEditForm";
import { cn } from "@/lib/utils";

interface IssueCardProps {
  issue: Issue;
  isTargeted: boolean;
  onUpdate?: (issueId: string, updates: Partial<Issue>) => Promise<void>;
  onDelete?: (issueId: string) => Promise<void>;
}

export const IssueCard = memo(
  ({ issue, isTargeted, onUpdate, onDelete }: IssueCardProps) => {
    const [upvoting, setUpvoting] = useState(false);
    const [localUpvotes, setLocalUpvotes] = useState<number | null>(null);
    const [isOwner, setIsOwner] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [now, setNow] = useState(() => Date.now());

    const isSecurity =
      (issue.is_security_alert || issue.category === "security") &&
      issue.status !== "RESOLVED";
    const displayUpvotes = localUpvotes !== null ? localUpvotes : issue.upvotes || 1;
    const statusConfig = getStatusConfig(issue.status);
    const wasteSla = getWasteSlaState(issue, now);
    const isWasteOverdue = wasteSla?.overdue === true;
    const categoryColor = CATEGORY_COLORS[issue.category];

    useEffect(() => {
      if (!wasteSla || wasteSla.completed) return;
      const timer = window.setInterval(() => setNow(Date.now()), 60000);
      return () => window.clearInterval(timer);
    }, [issue.category, issue.created_at, issue.status, wasteSla?.completed]);

    useEffect(() => {
      const myIds: string[] = JSON.parse(
        localStorage.getItem("kili_my_issue_ids") || "[]",
      );
      if (myIds.includes(String(issue.id))) setIsOwner(true);
    }, [issue]);

    async function handleUpvote() {
      if (upvoting) return;
      setUpvoting(true);
      setLocalUpvotes(displayUpvotes + 1);
      try {
        await upvoteIssue(issue.id);
      } catch {
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
      const storedIds: string[] = JSON.parse(
        localStorage.getItem("kili_my_issue_ids") || "[]",
      );
      localStorage.setItem(
        "kili_my_issue_ids",
        JSON.stringify(storedIds.filter((id) => id !== String(issue.id))),
      );
    }

    return (
      <article
        id={`issue-${issue.id}`}
        className={cn(
          "relative overflow-hidden rounded-xl border bg-card p-5 text-card-foreground shadow-soft transition-all duration-300 focus-within:ring-2 focus-within:ring-ring/40",
          isSecurity && "border-destructive/50 bg-destructive/5",
          !isSecurity && isWasteOverdue && "border-warning/60 bg-warning/5",
          !isSecurity && !isWasteOverdue && isTargeted && "border-primary shadow-lifted ring-1 ring-primary/30",
          !isSecurity && !isWasteOverdue && !isTargeted && "border-border hover:border-border-strong hover:shadow-lifted",
        )}
      >
        {/* Category colour rail - identity, reinforced by the icon and label. */}
        <span
          className="absolute inset-y-0 left-0 w-1"
          style={{ backgroundColor: categoryColor }}
          aria-hidden="true"
        />

        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3 pl-2">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
              style={{
                backgroundColor: `color-mix(in oklab, ${categoryColor} 14%, transparent)`,
                color: categoryColor,
              }}
              aria-hidden="true"
            >
              <CategoryIcon category={issue.category} className="h-4.5 w-4.5" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-semibold text-foreground">
                  {issue.is_verified_resident
                    ? "Verified Resident"
                    : "Community Member"}
                </span>
                {issue.is_verified_resident && (
                  <BadgeCheck className="h-3.5 w-3.5 text-primary" />
                )}
                <span className="text-xs text-muted-foreground">
                  {CATEGORY_SHORT_LABELS[issue.category]}
                </span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {new Date(issue.created_at).toLocaleDateString("en-KE", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                    statusConfig.color,
                  )}
                >
                  {statusConfig.icon}
                  {statusConfig.label}
                </span>
              </div>
            </div>
          </div>

          {isOwner && !isEditing && (
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setShowMenu(!showMenu)}
                aria-label="Report actions"
                aria-expanded={showMenu}
                className="cursor-pointer rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <MoreHorizontal className="h-4.5 w-4.5" />
              </button>
              {showMenu && (
                <div className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-lg border border-border bg-popover p-1 shadow-floating">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-popover-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Priority banners */}
        {isSecurity && (
          <div className="mb-3 flex items-center gap-2 rounded-lg bg-destructive px-3 py-2 text-xs font-bold text-destructive-foreground">
            <ShieldAlert className="h-4 w-4" />
            <span>
              TOP PRIORITY SAFETY ALERT
              {issue.unsafe_time ? ` — Unsafe: ${issue.unsafe_time}` : ""}
            </span>
          </div>
        )}

        {wasteSla && (
          <div
            className={cn(
              "mb-3 rounded-lg border px-3 py-2",
              isWasteOverdue ? "border-warning/50 bg-warning/10" : "border-border bg-muted/40",
            )}
          >
            <div className="mb-1 flex justify-between text-xs font-semibold">
              <span className="flex items-center gap-1">
                <Timer className="h-3.5 w-3.5" /> {WASTE_SLA_HOURS}h Resolution SLA
              </span>
              <span className="text-muted-foreground">{wasteSla.label}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-foreground/10">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  isWasteOverdue ? "bg-warning" : "bg-primary",
                )}
                style={{ width: `${wasteSla.progressPercent}%` }}
              />
            </div>
          </div>
        )}

        {/* Body */}
        {isEditing ? (
          <IssueEditForm
            issue={issue}
            onSave={handleSaveEdit}
            onCancel={() => setIsEditing(false)}
          />
        ) : (
          <div className="space-y-3 pl-2">
            <div className="flex w-fit items-center gap-1 rounded-md bg-accent/60 px-2 py-1 text-xs font-medium text-accent-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">
                {issue.address || `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`}
                {issue.sub_detail ? ` — ${issue.sub_detail}` : ""}
              </span>
            </div>

            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-foreground">
              {issue.description}
            </p>

            {issue.photo_base64 && issue.photo_base64.length > 20 && (
              <figure className="overflow-hidden rounded-xl border border-border bg-muted">
                <img
                  src={issue.photo_base64}
                  alt={`Evidence photo for the ${CATEGORY_SHORT_LABELS[issue.category]} report`}
                  loading="lazy"
                  decoding="async"
                  className="max-h-[400px] w-full object-cover"
                />
              </figure>
            )}

            {issue.official_notes && (
              <div className="rounded-lg border-l-4 border-primary bg-accent/40 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase text-primary">
                  <Building2 className="h-3.5 w-3.5" /> Official Update
                </div>
                <p className="text-sm text-muted-foreground">
                  {issue.official_notes}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 border-t border-border pt-3 pl-2">
          <div className="mb-2 flex items-center gap-4">
            <button
              type="button"
              onClick={handleUpvote}
              disabled={upvoting}
              className={cn(
                "flex cursor-pointer items-center gap-1.5 text-sm font-medium transition-colors",
                localUpvotes !== null
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {upvoting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ThumbsUp
                  className={cn(
                    "h-4.5 w-4.5",
                    localUpvotes !== null && "fill-primary",
                  )}
                />
              )}
              <span className="tabular-nums">{displayUpvotes}</span>
            </button>
          </div>
          <CommentSection issueId={issue.id} />
        </div>
      </article>
    );
  },
);

IssueCard.displayName = "IssueCard";
