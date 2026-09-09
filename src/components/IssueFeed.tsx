import { useState } from "react";
import type { Issue } from "../types/issue";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "../types/issue";
import { Button } from "./ui/button";
import { supabase } from "../lib/supabaseClient";
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
    <div className="max-w-2xl mx-auto p-4 space-y-4 pb-20">
      {/* Header Banner */}
      <div className="flex justify-between items-center mb-6 bg-card p-4 rounded-xl shadow-xs border border-border">
        <div>
          <h1 className="text-xl font-bold text-foreground">Kilimani Community Feed</h1>
          <p className="text-xs text-muted-foreground">Recent issue reports across the ward</p>
        </div>
        <Button
          onClick={onReportClick}
          size="sm"
          className="text-xs font-semibold"
        >
          + Report a new issue
        </Button>
      </div>

      {/* Feed List / Empty State */}
      {issues.length === 0 ? (
        <div className="text-center py-12 px-4 bg-card rounded-xl border border-dashed border-border">
          <p className="text-muted-foreground text-sm mb-3">
            No issues found matching your filters.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onReportClick}
            className="text-xs"
          >
            Report the first issue
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="bg-card rounded-xl border border-border p-4 shadow-xs hover:shadow-md transition-shadow text-card-foreground"
            >
              {/* Post Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: CATEGORY_COLORS[issue.category] || "var(--primary)" }}
                  />
                  <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                    {CATEGORY_LABELS[issue.category] || issue.category}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(issue.created_at).toLocaleDateString("en-KE", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>

              {/* Description Body */}
              <p className="text-foreground text-sm mb-3 whitespace-pre-wrap">
                {issue.description}
              </p>

              {/* Attached Image Display */}
              {issue.photo_base64 && issue.photo_base64.startsWith("data:image/") && (
                <div className="mb-3 overflow-hidden rounded-lg border border-border bg-muted">
                  <img
                    src={issue.photo_base64}
                    alt={CATEGORY_LABELS[issue.category] || "Issue photo"}
                    className="w-full h-auto max-h-80 object-cover rounded-lg"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              )}

              {/* Sub-detail tag & Upvote Counter Action Row */}
              <div className="flex items-center justify-between mb-3 gap-2">
                {issue.sub_detail ? (
                  <span className="inline-block bg-muted text-muted-foreground text-xs px-2.5 py-1 rounded-md font-medium">
                    {issue.sub_detail}
                  </span>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  onClick={() => handleUpvote(issue)}
                  disabled={upvotingIds.includes(issue.id)}
                  className="flex items-center gap-1.5 bg-accent hover:bg-accent/80 text-foreground border border-border px-3 py-1 rounded-full text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <span>👍</span>
                  <span>{issue.upvotes || 1} Endorsements</span>
                </button>
              </div>

              {/* Location & Metadata Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-border text-xs text-muted-foreground">
                <div className="flex items-center gap-1 truncate max-w-[70%]">
                  <span>📍</span>
                  <span className="truncate">
                    {issue.address || `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`}
                  </span>
                </div>
                {issue.reporter_name && (
                  <span className="italic">
                    By {issue.reporter_name}
                  </span>
                )}
              </div>

              {/* Realtime Comment Section */}
              <CommentSection issueId={issue.id} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}