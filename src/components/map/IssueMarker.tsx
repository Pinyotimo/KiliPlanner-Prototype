import { Marker, Popup } from "react-leaflet";
import { ShieldAlert, MapPin } from "lucide-react";
import type { Issue } from "../../types/issue";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "../../types/issue";
import { createIssueDivIcon } from "../../lib/leafletIcon";
import { CategoryIcon } from "../CategoryIcon";
import { relativeTime } from "../../lib/relativeTime";
import { Badge } from "../ui/badge";
import { StatusBadge } from "../../admin/components/StatusBadge";

interface IssueMarkerProps {
  issue: Issue;
  onIssueSelect?: (issue: Issue) => void;
  /** What the popin's action does on this surface. */
  actionLabel?: string;
}

export function IssueMarker({
  issue,
  onIssueSelect,
  actionLabel = "Open in the feed",
}: IssueMarkerProps) {
  const isSec = issue.is_security_alert || issue.category === "security";

  return (
    <Marker
      position={[issue.lat, issue.lng]}
      icon={createIssueDivIcon(issue.category, issue.status)}
      eventHandlers={{
        click: () => onIssueSelect?.(issue),
      }}
    >
      <Popup className="custom-popup">
        <div className="max-w-xs space-y-2.5 rounded-xl bg-card p-3 text-xs text-card-foreground">
          {isSec && (
            <div className="flex items-center justify-between gap-2 rounded-lg bg-destructive px-2 py-1 text-[10px] font-bold text-destructive-foreground">
              <span className="flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" aria-hidden="true" /> SECURITY
                ALERT
              </span>
              {issue.unsafe_time && <span>{issue.unsafe_time}</span>}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge
              variant="outline"
              className="flex items-center gap-1 border-border bg-muted/50 text-[10px] font-bold uppercase text-foreground"
            >
              <CategoryIcon
                category={issue.category}
                className="h-3 w-3"
                color={CATEGORY_COLORS[issue.category]}
              />
              {CATEGORY_LABELS[issue.category] || issue.category}
            </Badge>

            <StatusBadge
              status={issue.status}
              // The badge is sized for a table cell; in a popup it needs to
              // sit on the same line as the category chip.
              className="px-2 py-0.5 text-[10px]"
            />
          </div>

          <p className="text-xs font-medium leading-snug text-foreground">
            {issue.description}
          </p>

          {issue.photo_base64 && (
            <img
              src={issue.photo_base64}
              alt={`Photo evidence for: ${issue.description}`}
              className="h-28 w-full rounded-lg border border-border bg-muted object-cover"
            />
          )}

          {issue.address && (
            <p className="flex items-start gap-1 text-[11px] leading-snug text-muted-foreground">
              <MapPin className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
              <span>{issue.address}</span>
            </p>
          )}

          <div className="flex items-center justify-between gap-2 border-t border-border pt-2">
            <span className="text-[10px] text-muted-foreground">
              Reported {relativeTime(issue.created_at)}
            </span>
            {onIssueSelect && (
              <button
                type="button"
                className="cursor-pointer text-xs font-semibold text-primary hover:underline"
                onClick={() => onIssueSelect(issue)}
              >
                {actionLabel}
              </button>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
