import React, { useState, memo, useEffect, useMemo } from "react";
import {
  ThumbsUp,
  MapPin,
  User,
  Clock,
  Plus,
  Inbox,
  Loader2,
  CheckCircle2,
  Clock3,
  AlertCircle,
  XCircle,
  Building2,
  ShieldAlert,
  Pencil,
  Trash2,
  X,
  Check,
  Camera,
} from "lucide-react";
import type { Issue } from "../../../types/issue";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "../../../types/issue";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { deleteIssue } from "../lib/deleteIssue";
import { editIssue } from "../lib/editIssue";
import { sortFeedIssues } from "../lib/feedUtils";
import { upvoteIssue } from "../lib/upvoteIssue";
import { CategoryIcon } from "../../../components/CategoryIcon";
import CommentSection from "./CommentSection";

interface IssueFeedProps {
  issues: Issue[];
  onReportClick: () => void;
  targetIssueId?: string | null;
  isFocusedView?: boolean;
  onShowAllReports?: () => void;
  onUpdateIssue?: (issueId: string, updates: Partial<Issue>) => Promise<void>;
  onDeleteIssue?: (issueId: string) => Promise<void>;
}

function getStatusConfig(statusKey?: string) {
  const status = statusKey?.toLowerCase().replace("-", "_") || "open";

  switch (status) {
    case "resolved":
    case "fixed":
      return {
        color: "bg-primary/10 text-primary dark:text-primary border-primary/30",
        icon: (
          <CheckCircle2 className="h-3 w-3 shrink-0 text-muted-foreground" />
        ),
        label: "Resolved",
      };
    case "in_progress":
    case "under_review":
      return {
        color: "bg-primary/10 text-primary dark:text-primary border-primary/30",
        icon: (
          <AlertCircle className="h-3 w-3 shrink-0 text-primary animate-pulse" />
        ),
        label: "In Progress",
      };
    case "closed":
    case "rejected":
      return {
        color:
          "bg-muted/10 text-foreground dark:text-muted-foreground border-border/30",
        icon: <XCircle className="h-3 w-3 shrink-0 text-muted-foreground" />,
        label: "Closed",
      };
    default:
      return {
        color:
          "bg-accent/10 text-accent-foreground dark:text-accent-foreground border-accent/30",
        icon: <Clock3 className="h-3 w-3 shrink-0 text-accent-foreground" />,
        label: "Open",
      };
  }
}

const IssueCardItem = memo(
  ({
    issue,
    isTargeted,
    onUpdate,
    onDelete,
  }: {
    issue: Issue;
    isTargeted: boolean;
    onUpdate?: (issueId: string, updates: Partial<Issue>) => Promise<void>;
    onDelete?: (issueId: string) => Promise<void>;
  }) => {
    const [upvoting, setUpvoting] = useState(false);
    const [localUpvotes, setLocalUpvotes] = useState<number | null>(null);

    const [isOwner, setIsOwner] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [editForm, setEditForm] = useState({
      description: issue.description,
      category: issue.category,
      sub_detail: issue.sub_detail || "",
      photo_base64: issue.photo_base64 || null,
    });

    // Only apply the red security priority styling if the issue is NOT resolved or closed
    const isSecurity = (issue.is_security_alert || issue.category === "security") 
      && issue.status !== "resolved" 
      && issue.status !== "closed";
    const categoryColor =
      CATEGORY_COLORS[issue.category] || "var(--category-other)";
    const displayUpvotes =
      localUpvotes !== null ? localUpvotes : issue.upvotes || 1;
    const statusConfig = getStatusConfig(issue.status);

    useEffect(() => {
      setEditForm({
        description: issue.description,
        category: issue.category,
        sub_detail: issue.sub_detail || "",
        photo_base64: issue.photo_base64 || null,
      });
    }, [issue]);

    useEffect(() => {
      const deviceId = localStorage.getItem("kili_device_id");
      const myIds: string[] = JSON.parse(
        localStorage.getItem("kili_my_issue_ids") || "[]",
      );
      if (
        (deviceId && issue.device_id === deviceId) ||
        myIds.includes(String(issue.id))
      ) {
        setIsOwner(true);
      }
    }, [issue]);

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const scale = Math.min(800 / img.width, 800 / img.height, 1);
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;
          canvas
            .getContext("2d")
            ?.drawImage(img, 0, 0, canvas.width, canvas.height);
          setEditForm((prev) => ({
            ...prev,
            photo_base64: canvas.toDataURL("image/jpeg", 0.7),
          }));
        };
      };
      reader.readAsDataURL(file);
    };

    async function handleUpvote() {
      if (upvoting) return;
      let deviceId = localStorage.getItem("kili_device_id");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("kili_device_id", deviceId);
      }

      setUpvoting(true);
      const newUpvotes = displayUpvotes + 1;
      setLocalUpvotes(newUpvotes);

      try {
        await upvoteIssue(issue.id, deviceId);
        
        // --- AUTOMATED ESCALATION EMAIL ---
        // Replace with your actual Formspree URL
        const EMAIL_GATEWAY_URL = "https://formspree.io/f/mzezzbav";
        fetch(EMAIL_GATEWAY_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: `⚠️ Escalation: ${CATEGORY_LABELS[issue.category] || issue.category} Issue Gaining Traction`,
            total_endorsements: newUpvotes,
            category: issue.category,
            description: issue.description,
            location: issue.address || "Location on map",
            action_required: "This issue has received a new community endorsement. Please prioritize its resolution.",
          }),
        }).catch((err) => console.error("Escalation email failed to send", err));
        // ----------------------------------

      } catch (err) {
        console.error("Failed to register vote:", err);
        setLocalUpvotes(displayUpvotes);
      } finally {
        setUpvoting(false);
      }
    }

    async function handleSaveEdit(e: React.FormEvent) {
      e.preventDefault();
      setIsSubmitting(true);
      try {
        const updates = {
          description: editForm.description,
          category: editForm.category,
          sub_detail: editForm.sub_detail || null,
          photo_base64: editForm.photo_base64,
        };

        if (onUpdate) {
          await onUpdate(issue.id, updates);
        } else {
          await editIssue(issue.id, updates);
        }
        setIsEditing(false);
      } catch (err) {
        console.error("Failed to update post:", err);
        alert("Failed to update post. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    }

    async function handleConfirmDelete() {
      setIsSubmitting(true);
      try {
        if (onDelete) {
          await onDelete(issue.id);
        } else {
          await deleteIssue(issue.id);
        }

        const storedIds: string[] = JSON.parse(
          localStorage.getItem("kili_my_issue_ids") || "[]",
        );
        localStorage.setItem(
          "kili_my_issue_ids",
          JSON.stringify(storedIds.filter((id) => id !== String(issue.id))),
        );
      } catch (err) {
        console.error("Failed to delete post:", err);
        alert("Failed to delete post. Please try again.");
      } finally {
        setIsSubmitting(false);
        setIsConfirmingDelete(false);
      }
    }

    return (
      <div
        id={`issue-${issue.id}`}
        className={`group bg-card rounded-2xl border p-4 sm:p-5 shadow-xs transition-all duration-500 text-card-foreground space-y-4 ${
          isSecurity
            ? "border-destructive/80 bg-destructive/2 dark:bg-destructive/10 ring-1 ring-destructive/20"
            : isTargeted
              ? "ring-2 ring-primary border-primary shadow-lg scale-[1.01]"
              : "border-border/80 hover:shadow-md"
        }`}
      >
        {isSecurity && (
          <div className="flex flex-wrap items-center justify-between gap-1.5 bg-destructive text-primary-foreground px-3 py-1.5 rounded-xl text-xs font-bold animate-pulse shadow-sm">
            <span className="flex min-w-0 items-center gap-1.5">
              <ShieldAlert className="h-4 w-4" />
              <span className="wrap-break-word">TOP PRIORITY SAFETY ALERT</span>
            </span>
            {issue.unsafe_time && (
              <span className="text-[11px] bg-foreground/30 px-2 py-0.5 rounded-md font-medium wrap-break-word">
                Unsafe: {issue.unsafe_time}
              </span>
            )}
          </div>
        )}

        <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border/40 pb-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 flex-wrap">
            <Badge
              variant="outline"
              style={{
                backgroundColor: `color-mix(in oklch, ${categoryColor} 12%, transparent)`,
                color: categoryColor,
                borderColor: `color-mix(in oklch, ${categoryColor} 28%, transparent)`,
              }}
              className="flex max-w-full items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase rounded-md shadow-2xs"
            >
              <CategoryIcon category={issue.category} className="h-3.5 w-3.5" />
              <span className="truncate">
                {CATEGORY_LABELS[issue.category] || issue.category}
              </span>
            </Badge>

            <div className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground font-medium">
              <Clock className="h-3 w-3" />
              <span className="wrap-break-word">
                {new Date(issue.created_at).toLocaleDateString("en-KE", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs ${statusConfig.color}`}
            >
              {statusConfig.icon}
              <span className="whitespace-nowrap">{statusConfig.label}</span>
            </span>

            {isOwner && !isEditing && (
              <div className="flex items-center gap-1 border-l border-border/50 pl-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  title="Edit post"
                  className="p-1 text-muted-foreground hover:text-primary rounded-md transition-colors cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  title="Delete post"
                  className="p-1 text-muted-foreground hover:text-destructive rounded-md transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {isConfirmingDelete && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 space-y-2 text-xs">
            <p className="font-semibold text-destructive">
              Are you sure you want to delete this report?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsConfirmingDelete(false)}
                disabled={isSubmitting}
                className="h-7 text-xs px-2.5 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="h-7 text-xs px-2.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  "Delete"
                )}
              </Button>
            </div>
          </div>
        )}

        {isEditing ? (
          <form
            onSubmit={handleSaveEdit}
            className="space-y-3 bg-muted/30 p-3 rounded-xl border border-border"
          >
            <div>
              <label className="block text-xs font-semibold mb-1">
                Category
              </label>
              <select
                value={editForm.category}
                onChange={(e) =>
                  setEditForm({
                    ...editForm,
                    category: e.target.value as Issue["category"],
                  })
                }
                className="w-full text-xs rounded-md border border-border bg-background p-2"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Description
              </label>
              <textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                rows={3}
                required
                className="w-full text-xs rounded-md border border-border bg-background p-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Landmark / Sub-detail
              </label>
              <input
                type="text"
                value={editForm.sub_detail}
                onChange={(e) =>
                  setEditForm({ ...editForm, sub_detail: e.target.value })
                }
                className="w-full text-xs rounded-md border border-border bg-background p-2"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1">
                Photo Evidence
              </label>
              {editForm.photo_base64 ? (
                <div className="relative rounded-lg overflow-hidden border border-border max-h-48">
                  <img
                    src={editForm.photo_base64}
                    alt="Preview"
                    className="w-full h-36 object-cover"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setEditForm({ ...editForm, photo_base64: null })
                    }
                    className="absolute top-2 right-2 bg-destructive text-white p-1 rounded-full shadow-md hover:bg-destructive/80 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center gap-2 p-2.5 border border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 text-xs text-muted-foreground">
                  <Camera className="h-4 w-4" />
                  <span>Upload or change photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={isSubmitting}
                className="h-7 text-xs gap-1 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" /> Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="h-7 text-xs gap-1 bg-primary text-primary-foreground cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <Check className="h-3.5 w-3.5" /> Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <p className="min-w-0 wrap-break-word text-foreground text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-normal">
            {issue.description}
          </p>
        )}

        {issue.official_notes && (
          <div className="rounded-xl bg-primary/10 border border-primary/30 p-3 text-foreground text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-primary text-[11px] uppercase tracking-wide">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span>Official Update</span>
            </div>
            <p className="leading-relaxed text-muted-foreground">
              {issue.official_notes}
            </p>
          </div>
        )}

        {!isEditing && issue.photo_base64 && issue.photo_base64.length > 20 && (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-muted max-h-96">
            <img
              src={issue.photo_base64}
              alt="Issue photo"
              className="w-full h-full max-h-96 object-cover"
            />
          </div>
        )}

        <div className="flex flex-wrap items-start justify-between gap-2 pt-1">
          {issue.sub_detail ? (
            <span className="min-w-0 flex-1 wrap-break-word text-muted-foreground text-xs leading-relaxed bg-muted/50 px-2.5 py-1 rounded-md border-l-2 border-primary/60">
              {issue.sub_detail}
            </span>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleUpvote}
            disabled={upvoting}
            className="flex items-center gap-1.5 bg-muted/60 hover:bg-primary/10 hover:text-primary hover:border-primary/30 text-foreground border border-border px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer shrink-0"
          >
            {upvoting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            ) : (
              <ThumbsUp className="h-3.5 w-3.5" />
            )}
            <span className="whitespace-nowrap">
              {displayUpvotes} Endorsements
            </span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-border/50 text-[11px] text-muted-foreground">
          <div className="flex min-w-0 max-w-full items-center gap-1.5 font-medium text-foreground/80">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="min-w-0 wrap-break-word">
              {issue.address ||
                `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`}
            </span>
          </div>

          {issue.reporter_name && (
            <div className="flex max-w-full items-center gap-1 font-medium text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="wrap-break-word">{issue.reporter_name}</span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-border/40">
          <CommentSection issueId={issue.id} />
        </div>
      </div>
    );
  },
);

IssueCardItem.displayName = "IssueCardItem";

export default function IssueFeed({
  issues,
  onReportClick,
  targetIssueId: controlledTargetIssueId,
  isFocusedView = false,
  onShowAllReports,
  onUpdateIssue,
  onDeleteIssue,
}: IssueFeedProps) {
  const [urlTargetIssueId, setUrlTargetIssueId] = useState<string | null>(null);
  const targetIssueId = controlledTargetIssueId ?? urlTargetIssueId;

  const sortedIssues = useMemo(() => sortFeedIssues(issues), [issues]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const issueParam = params.get("issue");
    if (issueParam) {
      setUrlTargetIssueId(issueParam);
      const timer = setTimeout(() => {
        const element = document.getElementById(`issue-${issueParam}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [issues]);

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-5 pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card p-5 rounded-2xl shadow-xs border border-border/70 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            {isFocusedView
              ? "Selected Report Details"
              : "Kilimani Community Feed"}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isFocusedView
              ? "Showing only the report selected from Analytics"
              : "Real-time safety & infrastructure ward activity feed"}
          </p>
        </div>
        {isFocusedView && onShowAllReports ? (
          <Button
            onClick={onShowAllReports}
            variant="outline"
            size="sm"
            className="text-xs font-bold px-4 rounded-xl cursor-pointer"
          >
            Show All Reports
          </Button>
        ) : (
          <Button
            onClick={onReportClick}
            size="sm"
            className="gap-1.5 text-xs font-bold px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer"
          >
            <Plus className="h-4 w-4 stroke-[2.5]" />
            <span>Report Issue</span>
          </Button>
        )}
      </div>

      {sortedIssues.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-6 bg-card rounded-2xl border border-dashed border-border/80 space-y-3">
          <div className="p-3.5 rounded-full bg-muted text-muted-foreground">
            <Inbox className="h-6 w-6" />
          </div>
          <p className="text-xs text-muted-foreground">
            There are no reports matching your filter parameters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedIssues.map((issue) => (
            <IssueCardItem
              key={issue.id}
              issue={issue}
              isTargeted={String(issue.id) === targetIssueId}
              onUpdate={onUpdateIssue}
              onDelete={onDeleteIssue}
            />
          ))}
        </div>
      )}
    </div>
  );
}
