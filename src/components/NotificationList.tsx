import React from "react";
import { Bell, CheckCircle2, MapPin, Inbox } from "lucide-react";
import type { Issue } from "../types/issue";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "../types/issue";
import { relativeTime } from "../lib/relativeTime";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface NotificationListProps {
  issues: Issue[];
  unreadIssueIds?: string[];
  emptyMessage?: string;
  onIssueSelect?: (issueId: string) => void;
  onMarkAllRead?: () => void;
}

export default function NotificationList({
  issues,
  unreadIssueIds = [],
  emptyMessage = "No new reported issues yet.",
  onIssueSelect,
  onMarkAllRead,
}: NotificationListProps) {
  const unreadSet = new Set(unreadIssueIds);
  const unreadCount = issues.filter((issue) => unreadSet.has(issue.id)).length;

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-foreground sm:text-lg">
              New Report Notifications
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} unread reported issue${unreadCount === 1 ? "" : "s"}`
                : "You're caught up on reported issues."}
            </p>
          </div>
        </div>
        {onMarkAllRead && unreadCount > 0 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onMarkAllRead}
            className="h-9 w-full cursor-pointer justify-center gap-1.5 rounded-xl text-xs font-semibold sm:w-auto"
          >
            <CheckCircle2 className="h-4 w-4 text-primary" />
            <span>Mark All Read</span>
          </Button>
        )}
      </div>

      {/* Content List */}
      {issues.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
          <div className="mb-3 rounded-full bg-muted p-3.5">
            <Inbox className="h-6 w-6" />
          </div>
          <p className="text-sm font-medium">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((issue) => {
            const isUnread = unreadSet.has(issue.id);
            const categoryColor =
              CATEGORY_COLORS[issue.category] || "var(--category-other)";

            const content = (
              <>
                <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        style={{
                          backgroundColor: `color-mix(in oklab, ${categoryColor} 12%, transparent)`,
                          borderColor: `color-mix(in oklab, ${categoryColor} 30%, transparent)`,
                          color: categoryColor,
                        }}
                        className="max-w-full rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                      >
                        {CATEGORY_LABELS[issue.category] || issue.category}
                      </Badge>
                      {isUnread && (
                        <span className="animate-pulse rounded-full bg-destructive px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-destructive-foreground">
                          New
                        </span>
                      )}
                    </div>
                    <h3 className="break-words text-sm font-semibold text-foreground">
                      New {CATEGORY_LABELS[issue.category] || issue.category} report
                      submitted
                    </h3>
                    <p className="line-clamp-2 text-xs font-normal leading-relaxed text-muted-foreground">
                      {issue.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-medium text-muted-foreground">
                    {relativeTime(issue.created_at)}
                  </span>
                </div>

                <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-2 border-t border-border pt-3 text-xs font-medium text-muted-foreground">
                  <span className="inline-flex min-w-0 max-w-full items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="break-words truncate">
                      {issue.address ||
                        `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`}
                    </span>
                  </span>
                  <span className="whitespace-nowrap rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-semibold capitalize text-foreground">
                    {issue.status.replace("_", " ")}
                  </span>
                </div>
              </>
            );

            const cardClassName = cn(
              "block w-full min-w-0 rounded-2xl border bg-card p-4 text-left transition-all duration-200",
              isUnread
                ? "border-primary/50 shadow-soft ring-1 ring-primary/15"
                : "border-border shadow-soft hover:border-border-strong hover:shadow-lifted",
            );

            if (onIssueSelect) {
              return (
                <button
                  key={issue.id}
                  type="button"
                  onClick={() => onIssueSelect(issue.id)}
                  className={cn(cardClassName, "cursor-pointer")}
                >
                  {content}
                </button>
              );
            }

            return (
              <article key={issue.id} className={cardClassName}>
                {content}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}