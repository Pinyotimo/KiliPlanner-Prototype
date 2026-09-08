import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import type { Comment } from "../types/issue";

interface CommentSectionProps {
  issueId: string;
}

export default function CommentSection({ issueId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    if (!showComments) return;

    let isMounted = true;

    // Fetch existing comments for this specific issue
    async function fetchComments() {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("issue_id", issueId)
        .order("created_at", { ascending: true });

      if (!error && data && isMounted) {
        setComments(data as Comment[]);
      }
    }

    fetchComments();

    // Subscribe to real-time comment updates for this post
    const channel = supabase
      .channel(`comments-${issueId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
          filter: `issue_id=eq.${issueId}`,
        },
        (payload) => {
          setComments((prev) => [...prev, payload.new as Comment]);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [issueId, showComments]);

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);

    const { error } = await supabase.from("comments").insert({
      issue_id: issueId,
      author_name: authorName.trim() || "Resident",
      content: newComment.trim(),
    });

    setSubmitting(false);

    if (!error) {
      setNewComment("");
    } else {
      console.error("Error adding comment:", error.message);
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-gray-100">
      {/* Toggle Button */}
      <button
        onClick={() => setShowComments(!showComments)}
        className="text-xs text-gray-500 font-medium hover:text-blue-600 flex items-center gap-1 mb-2"
      >
        💬 {showComments ? "Hide Comments" : `Comments (${comments.length})`}
      </button>

      {/* Expanded Comment Box */}
      {showComments && (
        <div className="space-y-3 bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
          {/* Comments List */}
          {comments.length === 0 ? (
            <p className="text-[11px] text-gray-400 italic">No comments yet. Be the first to comment!</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {comments.map((comment) => (
                <div key={comment.id} className="bg-white p-2 rounded-md border border-gray-100 text-xs">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-gray-800">{comment.author_name}</span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add Comment Input */}
          <form onSubmit={handleAddComment} className="space-y-2 pt-2 border-t border-gray-200">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Your Name (optional)"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-1/3 text-xs p-2 border border-gray-200 rounded-md bg-white"
              />
              <input
                type="text"
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-2/3 text-xs p-2 border border-gray-200 rounded-md bg-white"
              />
            </div>
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="w-full bg-blue-600 text-white text-xs py-1.5 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Posting..." : "Post Comment"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}