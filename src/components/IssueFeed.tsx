import React, { useState, memo, useEffect } from "react";
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
} from "lucide-react";
import type { Issue } from "../types/issue";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "../types/issue";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { supabase } from "../lib/supabaseClient";
import { CategoryIcon } from "./CategoryIcon";
import CommentSection from "./CommentSection";

interface IssueFeedProps {
  issues: Issue[];
  onReportClick: () => void;
}

const IssueCardItem = memo(({ issue, isTargeted }: { issue: Issue; isTargeted: boolean }) => {
  const [upvoting, setUpvoting] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState<number | null>(null);

  const categoryColor = CATEGORY_COLORS[issue.category] || "#64748b";
  const displayUpvotes = localUpvotes !== null ? localUpvotes : (issue.upvotes || 1);

  // Dynamic read-only status badge config
  const getStatusConfig = (statusKey: string) => {
    const status = statusKey?.toLowerCase().replace("-", "_") || "open";

    switch (status) {
      case "resolved":
      case "fixed":
        return {
          color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
          icon: <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-500" />,
          label: "Resolved",
        };
      case "in_progress":
      case "under_review":
        return {
          color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
          icon: <AlertCircle className="h-3 w-3 shrink-0 text-blue-500 animate-pulse" />,
          label: "In Progress",
        };
      case "closed":
      case "rejected":
        return {
          color: "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30",
          icon: <XCircle className="h-3 w-3 shrink-0 text-slate-500" />,
          label: "Closed",
        };
      default:
        return {
          color: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
          icon: <Clock3 className="h-3 w-3 shrink-0 text-amber-500" />,
          label: "Open",
        };
    }
  };

  const statusConfig = getStatusConfig(issue.status);

  async function handleUpvote() {
    if (upvoting) return;

    let deviceId = localStorage.getItem("kili_device_id");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("kili_device_id", deviceId);
    }

    setUpvoting(true);
    setLocalUpvotes(displayUpvotes + 1);

    try {
      const { error: voteError } = await supabase.from("issue_upvotes").insert({
        issue_id: issue.id,
        user_identifier: deviceId,
      });

      if (!voteError) {
        const currentUpvotes = (issue.upvotes || 0) + 1;
        await supabase
          .from("issues")
          .update({ upvotes: currentUpvotes })
          .eq("id", issue.id);
      }
    } catch (err) {
      console.error("Failed to register vote:", err);
      setLocalUpvotes(displayUpvotes);
    } finally {
      setUpvoting(false);
    }
  }

  return (
    <div
      id={`issue-${issue.id}`}
      className={`group bg-card rounded-2xl border p-4 sm:p-5 shadow-xs transition-all duration-500 text-card-foreground space-y-4 ${
        isTargeted
          ? "ring-2 ring-primary border-primary shadow-lg scale-[1.01]"
          : "border-border/80 hover:shadow-md"
      }`}
    >
      {/* Post Header: Category & Timestamp on Left | Status Badge on Far Right */}
      <div className="flex items-center justify-between gap-2 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <Badge
            variant="outline"
            style={{
              backgroundColor: `${categoryColor}15`,
              color: categoryColor,
              borderColor: `${categoryColor}35`,
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase rounded-md shadow-2xs"
          >
            <span style={{ color: categoryColor }} className="inline-flex items-center">
              <CategoryIcon category={issue.category} className="h-3.5 w-3.5" />
            </span>
            {CATEGORY_LABELS[issue.category] || issue.category}
          </Badge>

          <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
            <Clock className="h-3 w-3" />
            <span>
              {new Date(issue.created_at).toLocaleDateString("en-KE", {
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {/* Read-Only Status Badge anchored on Far Right */}
        <span
          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs shrink-0 ${statusConfig.color}`}
        >
          {statusConfig.icon}
          <span>{statusConfig.label}</span>
        </span>
      </div>

      {/* Description Body */}
      <p className="text-foreground text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-normal">
        {issue.description}
      </p>

      {/* Official Department Notes Banner */}
      {issue.official_notes && (
        <div className="rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/50 p-3 text-foreground text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-blue-600 dark:text-blue-400 text-[11px] uppercase tracking-wide">
            <Building2 className="h-3.5 w-3.5 shrink-0" />
            <span>Official Update</span>
          </div>
          <p className="leading-relaxed text-muted-foreground">{issue.official_notes}</p>
        </div>
      )}

      {/* Attached Image Display */}
      {issue.photo_base64 && issue.photo_base64.length > 20 && (
        <div className="overflow-hidden rounded-xl border border-border/60 bg-muted max-h-96 group/photo">
          <img
            src={issue.photo_base64}
            alt={CATEGORY_LABELS[issue.category] || "Issue photo"}
            decoding="async"
            loading="lazy"
            className="w-full h-full max-h-96 object-cover transition-transform duration-500 group-hover/photo:scale-[1.01]"
          />
        </div>
      )}

      {/* Sub-detail Tag & Upvote Counter */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {issue.sub_detail ? (
          <span className="text-muted-foreground text-xs leading-relaxed bg-muted/50 px-2.5 py-1 rounded-md border-l-2 border-primary/60">
            {issue.sub_detail}
          </span>
        ) : (
          <div />
        )}

        <button
          type="button"
          onClick={handleUpvote}
          disabled={upvoting}
          className="flex items-center gap-1.5 bg-muted/60 hover:bg-primary/10 hover:text-primary hover:border-primary/30 text-foreground border border-border px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer active:scale-95 shrink-0 shadow-2xs"
        >
          {upvoting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : (
            <ThumbsUp className="h-3.5 w-3.5" />
          )}
          <span>{displayUpvotes} Endorsements</span>
        </button>
      </div>

      {/* Location & Reporter Metadata Footer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-border/50 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5 font-medium text-foreground/80 truncate max-w-full">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate">
            {issue.address || `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`}
          </span>
        </div>

        {issue.reporter_name && (
          <div className="flex items-center gap-1 font-medium text-muted-foreground">
            <User className="h-3 w-3" />
            <span>{issue.reporter_name}</span>
          </div>
        )}
      </div>

      {/* Realtime Comment Section */}
      <div className="pt-2 border-t border-border/40">
        <CommentSection issueId={issue.id} />
      </div>
    </div>
  );
});

IssueCardItem.displayName = "IssueCardItem";

export default function IssueFeed({ issues, onReportClick }: IssueFeedProps) {
  const [targetIssueId, setTargetIssueId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const issueParam = params.get("issue");
    if (issueParam) {
      setTargetIssueId(issueParam);
      
      // Allow DOM to settle before scrolling
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
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-card p-5 rounded-2xl shadow-xs border border-border/70 backdrop-blur-sm">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Kilimani Community Feed
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time infrastructure & ward activity feed
          </p>
        </div>
        <Button
          onClick={onReportClick}
          size="sm"
          className="gap-1.5 text-xs font-bold px-4 rounded-xl shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground transition-all active:scale-95 shrink-0 cursor-pointer"
        >
          <Plus className="h-4 w-4 stroke-[2.5]" />
          <span>Report Issue</span>
        </Button>
      </div>

      {/* Feed List / Empty State */}
      {issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 px-6 bg-card rounded-2xl border border-dashed border-border/80 space-y-3">
          <div className="p-3.5 rounded-full bg-muted text-muted-foreground">
            <Inbox className="h-6 w-6" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-sm font-semibold text-foreground">
              No reports found
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              There are no community issue reports matching your filter parameters.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onReportClick}
            className="text-xs font-medium rounded-xl gap-1.5 mt-2 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            Report the first issue
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <IssueCardItem
              key={issue.id}
              issue={issue}
              isTargeted={String(issue.id) === targetIssueId}
            />
          ))}
        </div>
      )}
    </div>
  );
}