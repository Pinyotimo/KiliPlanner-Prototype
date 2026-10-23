import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, User, Loader2 } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import type { Comment } from "../../../types/issue";
import { relativeTime } from "../../../lib/relativeTime";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";

interface CommentSectionProps {
  issueId: string;
}

export default function CommentSection({ issueId }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Fetch comments immediately on mount to keep count accurate
    async function fetchComments() {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("issue_id", issueId)
        .order("created_at", { ascending: true });

      if (isMounted) {
        setLoading(false);
        if (!error && data) {
          setComments(data as Comment[]);
        }
      }
    }

    fetchComments();

    // Subscribe to real-time comment additions
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
          const incoming = payload.new as Comment;
          setComments((prev) =>
            prev.some((comment) => comment.id === incoming.id)
              ? prev
              : [...prev, incoming],
          );
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [issueId]);

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);

    const { data, error } = await supabase.functions.invoke("add-comment", {
      body: {
        issueId,
        content: newComment.trim(),
      },
    });

    setSubmitting(false);

    if (!error) {
      setNewComment("");
      if (data?.comment) {
        setComments((current) =>
          current.some((comment) => comment.id === data.comment.id)
            ? current
            : [...current, data.comment as Comment],
        );
      }
    } else {
      console.error("Error adding comment:", error.message);
    }
  }

  return (
    <div className="mt-3 border-t border-border pt-3">
      {/* Toggle Button with Live Count */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowComments(!showComments)}
        className="h-7 cursor-pointer gap-1.5 p-0 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground"
      >
        <MessageSquare className="h-3.5 w-3.5" />
        {showComments
          ? "Hide Comments"
          : loading
          ? "Comments (...)"
          : `Comments (${comments.length})`}
      </Button>

      {/* Expanded Comment Box */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="mt-2 space-y-3 rounded-lg border border-border bg-muted/40 p-3">
              {/* Comments List */}
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Loading comments...</span>
                </div>
              ) : comments.length === 0 ? (
                <p className="text-[11px] italic text-muted-foreground">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                  {comments.map((comment) => (
                    <motion.div
                      key={comment.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-1 rounded-md border border-border bg-card p-2 text-xs shadow-soft"
                    >
                      <div className="flex items-center justify-between text-muted-foreground">
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-foreground">
                          <User className="h-3 w-3 text-muted-foreground" />
                          {comment.author_name}
                        </span>
                        <span className="text-[10px]">
                          {relativeTime(comment.created_at)}
                        </span>
                      </div>
                      <p className="leading-relaxed text-foreground">
                        {comment.content}
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Add Comment Form */}
              <form
                onSubmit={handleAddComment}
                className="space-y-2 border-t border-border pt-2"
              >
                <Input
                  type="text"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="h-8 w-full text-xs"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting || !newComment.trim()}
                  className="h-8 w-full cursor-pointer gap-1.5 text-xs font-medium"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      Post Comment
                    </>
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
