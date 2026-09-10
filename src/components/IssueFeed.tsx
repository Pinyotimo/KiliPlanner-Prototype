import { useState } from "react";
import {
  ThumbsUp,
  MapPin,
  User,
  Clock,
  Plus,
  Inbox,
  Loader2,
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

export default function IssueFeed({ issues, onReportClick }: IssueFeedProps) {
  const [upvotingIds, setUpvotingIds] = useState<string[]>([]);

  // Local helper to track upvotes per device and sync with Supabase
  async function handleUpvote(issue: Issue) {
    if (upvotingIds.includes(issue.id)) return;

    // Get or create persistent device ID to prevent instant duplicate spamming
    let deviceId = localStorage.getItem("kili_device_id");
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem("kili_device_id", deviceId);
    }

    setUpvotingIds((prev) => [...prev, issue.id]);

    try {
      // Record unique vote entry in DB
      const { error: voteError } = await supabase.from("issue_upvotes").insert({
        issue_id: issue.id,
        user_identifier: deviceId,
      });

      if (!voteError) {
        // Increment aggregate count on the issue record
        const currentUpvotes = (issue.upvotes || 0) + 1;
        await supabase
          .from("issues")
          .update({ upvotes: currentUpvotes })
          .eq("id", issue.id);
      }
    } catch (err) {
      console.error("Failed to register vote:", err);
    } finally {
      setUpvotingIds((prev) => prev.filter((id) => id !== issue.id));
    }
  }

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
          className="gap-1.5 text-xs font-bold px-4 rounded-xl shadow-xs bg-primary hover:bg-primary/90 text-primary-foreground transition-all active:scale-95 shrink-0"
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
            className="text-xs font-medium rounded-xl gap-1.5 mt-2"
          >
            <Plus className="h-3.5 w-3.5" />
            Report the first issue
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => {
            const categoryColor = CATEGORY_COLORS[issue.category] || "#64748b";
            const isUpvoting = upvotingIds.includes(issue.id);

            return (
              <div
                key={issue.id}
                className="group bg-card rounded-2xl border border-border/70 p-5 shadow-xs hover:shadow-md transition-all duration-200 text-card-foreground space-y-3.5"
              >
                {/* Post Header */}
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="outline"
                    style={{
                      backgroundColor: `${categoryColor}12`,
                      color: categoryColor,
                      borderColor: `${categoryColor}30`,
                    }}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase rounded-md"
                  >
                    <CategoryIcon category={issue.category} className="h-3.5 w-3.5" />
                    {CATEGORY_LABELS[issue.category] || issue.category}
                  </Badge>

                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground/80 font-medium">
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

                {/* Description Body */}
                <p className="text-foreground text-sm leading-relaxed whitespace-pre-wrap font-normal">
                  {issue.description}
                </p>

                {/* Attached Image Display */}
                {issue.photo_base64 && issue.photo_base64.startsWith("data:image/") && (
                  <div className="overflow-hidden rounded-xl border border-border/60 bg-muted max-h-80 group/photo">
                    <img
                      src={issue.photo_base64}
                      alt={CATEGORY_LABELS[issue.category] || "Issue photo"}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover/photo:scale-[1.02]"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                )}

                {/* Sub-detail tag & Upvote Counter Action Row */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  {issue.sub_detail ? (
                    <span className="text-muted-foreground text-xs leading-relaxed bg-muted/40 pl-2.5 pr-2 py-1 rounded-r-md border-l-2 border-primary/50">
                      {issue.sub_detail}
                    </span>
                  ) : (
                    <div />
                  )}

                  <button
                    type="button"
                    onClick={() => handleUpvote(issue)}
                    disabled={isUpvoting}
                    className="flex items-center gap-1.5 bg-muted/60 hover:bg-primary/10 hover:text-primary hover:border-primary/30 text-foreground border border-border px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer active:scale-95 shrink-0"
                  >
                    {isUpvoting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                    ) : (
                      <ThumbsUp className="h-3.5 w-3.5" />
                    )}
                    <span>{issue.upvotes || 1} Endorsements</span>
                  </button>
                </div>

                {/* Location & Metadata Footer */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-3 border-t border-border/50 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5 font-medium text-foreground/80 truncate max-w-full">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">
                      {issue.address || `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`}
                    </span>
                  </div>

                  {issue.reporter_name && (
                    <div className="flex items-center gap-1 font-medium">
                      <User className="h-3 w-3 text-muted-foreground/80" />
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
          })}
        </div>
      )}
    </div>
  );
}