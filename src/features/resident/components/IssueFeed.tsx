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
} from "lucide-react";
import type { Issue } from "../../../types/issue";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "../../../types/issue";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { supabase } from "../../../lib/supabaseClient";
import { CategoryIcon } from "../../../components/CategoryIcon";
import CommentSection from "./CommentSection";

interface IssueFeedProps {
  issues: Issue[];
  onReportClick: () => void;
  targetIssueId?: string | null;
  isFocusedView?: boolean;
  onShowAllReports?: () => void;
}

const IssueCardItem = memo(
  ({ issue, isTargeted }: { issue: Issue; isTargeted: boolean }) => {
    const [upvoting, setUpvoting] = useState(false);
    const [localUpvotes, setLocalUpvotes] = useState<number | null>(null);

    const isSecurity = issue.is_security_alert || issue.category === "security";
    const categoryColor =
      CATEGORY_COLORS[issue.category] || "var(--category-other)";
    const displayUpvotes =
      localUpvotes !== null ? localUpvotes : issue.upvotes || 1;

    const getStatusConfig = (statusKey: string) => {
      const status = statusKey?.toLowerCase().replace("-", "_") || "open";

      switch (status) {
        case "resolved":
        case "fixed":
          return {
            color:
              "bg-primary/10 text-primary dark:text-primary border-primary/30",
            icon: (
              <CheckCircle2 className="h-3 w-3 shrink-0 text-muted-foreground" />
            ),
            label: "Resolved",
          };
        case "in_progress":
        case "under_review":
          return {
            color:
              "bg-primary/10 text-primary dark:text-primary border-primary/30",
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
            icon: (
              <XCircle className="h-3 w-3 shrink-0 text-muted-foreground" />
            ),
            label: "Closed",
          };
        default:
          return {
            color:
              "bg-accent/10 text-accent-foreground dark:text-accent-foreground border-accent/30",
            icon: (
              <Clock3 className="h-3 w-3 shrink-0 text-accent-foreground" />
            ),
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
        const { error: voteError } = await supabase
          .from("issue_upvotes")
          .insert({
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
          isSecurity
            ? "border-destructive/80 bg-destructive/[0.02] dark:bg-destructive/10 ring-1 ring-destructive/20"
            : isTargeted
              ? "ring-2 ring-primary border-primary shadow-lg scale-[1.01]"
              : "border-border/80 hover:shadow-md"
        }`}
      >
        {/* Priority Security Banner */}
        {isSecurity && (
          <div className="flex flex-wrap items-center justify-between gap-1.5 bg-destructive text-primary-foreground px-3 py-1.5 rounded-xl text-xs font-bold animate-pulse shadow-sm">
            <span className="flex min-w-0 items-center gap-1.5">
              <ShieldAlert className="h-4 w-4" />
              <span className="break-words">TOP PRIORITY SAFETY ALERT</span>
            </span>
            {issue.unsafe_time && (
              <span className="text-[11px] bg-foreground/30 px-2 py-0.5 rounded-md font-medium break-words">
                Unsafe: {issue.unsafe_time}
              </span>
            )}
          </div>
        )}

        {/* Post Header */}
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
              <span className="break-words">
                {new Date(issue.created_at).toLocaleDateString("en-KE", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          <span
            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs shrink-0 ${statusConfig.color}`}
          >
            {statusConfig.icon}
            <span className="whitespace-nowrap">{statusConfig.label}</span>
          </span>
        </div>

        <p className="min-w-0 break-words text-foreground text-sm sm:text-base leading-relaxed whitespace-pre-wrap font-normal">
          {issue.description}
        </p>

        {issue.official_notes && (
          <div className="rounded-xl bg-primary/10 dark:bg-primary/10 border border-primary/30 p-3 text-foreground text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-semibold text-primary dark:text-primary text-[11px] uppercase tracking-wide">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span>Official Update</span>
            </div>
            <p className="leading-relaxed text-muted-foreground">
              {issue.official_notes}
            </p>
          </div>
        )}

        {issue.photo_base64 && issue.photo_base64.length > 20 && (
          <div className="overflow-hidden rounded-xl border border-border/60 bg-muted max-h-96 group/photo">
            <img
              src={issue.photo_base64}
              alt="Issue photo"
              className="w-full h-full max-h-96 object-cover"
            />
          </div>
        )}

        <div className="flex flex-wrap items-start justify-between gap-2 pt-1">
          {issue.sub_detail ? (
            <span className="min-w-0 flex-1 break-words text-muted-foreground text-xs leading-relaxed bg-muted/50 px-2.5 py-1 rounded-md border-l-2 border-primary/60">
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
            <span className="min-w-0 break-words">
              {issue.address ||
                `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`}
            </span>
          </div>

          {issue.reporter_name && (
            <div className="flex max-w-full items-center gap-1 font-medium text-muted-foreground">
              <User className="h-3 w-3" />
              <span className="break-words">{issue.reporter_name}</span>
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
}: IssueFeedProps) {
  const [urlTargetIssueId, setUrlTargetIssueId] = useState<string | null>(null);
  const targetIssueId = controlledTargetIssueId ?? urlTargetIssueId;

  // Pin Security Alerts to the TOP of the list
  const sortedIssues = useMemo(() => {
    return [...issues].sort((a, b) => {
      const aIsSec = a.is_security_alert || a.category === "security";
      const bIsSec = b.is_security_alert || b.category === "security";
      if (aIsSec && !bIsSec) return -1;
      if (!aIsSec && bIsSec) return 1;
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [issues]);

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
            />
          ))}
        </div>
      )}
    </div>
  );
}
