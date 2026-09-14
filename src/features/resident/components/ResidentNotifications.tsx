import { Bell, BellOff } from "lucide-react";
import type { Issue } from "../../../types/issue";
import NotificationList from "../../../components/NotificationList";
import { Button } from "../../../components/ui/button";

interface ResidentNotificationsProps {
  issues: Issue[];
  unreadIssueIds: string[];
  notificationsEnabled: boolean;
  onEnableNotifications: () => void;
  onDisableNotifications: () => void;
  onIssueSelect: (issueId: string) => void;
  onMarkAllRead: () => void;
}

export default function ResidentNotifications({
  issues,
  unreadIssueIds,
  notificationsEnabled,
  onEnableNotifications,
  onDisableNotifications,
  onIssueSelect,
  onMarkAllRead,
}: ResidentNotificationsProps) {
  if (!notificationsEnabled) {
    return (
      <div className="mx-auto max-w-2xl p-4">
        <section className="rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-xs">
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bell className="h-5 w-5" />
            </span>
            <div className="min-w-0 space-y-4">
              <div>
                <h1 className="text-xl font-bold tracking-tight">
                  Enable Notifications?
                </h1>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Get notified in the app when a new Kilimani infrastructure
                  report is submitted.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={onEnableNotifications}
                  className="gap-1.5 text-xs font-bold"
                >
                  <Bell className="h-4 w-4" />
                  Enable Notifications
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onDisableNotifications}
                  className="gap-1.5 text-xs font-semibold"
                >
                  <BellOff className="h-4 w-4" />
                  Not Now
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl p-4 pb-24">
      <NotificationList
        issues={issues}
        unreadIssueIds={unreadIssueIds}
        onIssueSelect={onIssueSelect}
        onMarkAllRead={onMarkAllRead}
      />
      <div className="mt-4 flex justify-stretch sm:justify-end">
        <Button
          type="button"
          variant="ghost"
          onClick={onDisableNotifications}
          className="w-full justify-center gap-1.5 text-xs text-muted-foreground sm:w-auto"
        >
          <BellOff className="h-3.5 w-3.5" />
          Disable Notifications
        </Button>
      </div>
    </div>
  );
}
