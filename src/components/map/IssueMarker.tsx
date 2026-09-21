import { Marker, Popup } from "react-leaflet";
import { ShieldAlert } from "lucide-react";
import type { Issue } from "../../types/issue";
import { CATEGORY_LABELS } from "../../types/issue";
import { createIssueDivIcon } from "../../lib/leafletIcon";
import { CategoryIcon } from "../CategoryIcon";
import { relativeTime } from "../../lib/relativeTime";
import { Badge } from "../ui/badge";

interface IssueMarkerProps {
  issue: Issue;
  onIssueSelect?: (issue: Issue) => void;
}

export function IssueMarker({ issue, onIssueSelect }: IssueMarkerProps) {
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
        <div className="p-2 space-y-2.5 max-w-xs text-xs bg-card text-card-foreground rounded-xl">
          {isSec && (
            <div className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-1 rounded-lg flex items-center justify-between">
              <span className="flex items-center gap-1">
                <ShieldAlert className="h-3 w-3" /> SECURITY ALERT
              </span>
              {issue.unsafe_time && <span>{issue.unsafe_time}</span>}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <Badge
              variant="outline"
              className="flex items-center gap-1 text-[10px] uppercase font-bold border-border bg-muted/50 text-foreground"
            >
              <CategoryIcon category={issue.category} className="h-3 w-3 text-primary" />
              {CATEGORY_LABELS[issue.category] || issue.category}
            </Badge>

            <Badge
              variant={issue.status === "RESOLVED" ? "default" : "secondary"}
              className="capitalize text-[10px] rounded-md"
            >
              {issue.status === "UNVERIFIED"
                ? "Under verification"
                : issue.status === "CORROBORATED"
                ? "Corroborated issue"
                : issue.status === "VERIFIED"
                ? "✓ Verified"
                : issue.status === "RESOLVED"
                ? "✓ Resolved"
                : issue.status.replace("_", " ")}
            </Badge>
          </div>

          <p className="font-medium text-foreground text-xs leading-snug">
            {issue.description}
          </p>

          {issue.photo_base64 && (
            <img
              src={issue.photo_base64}
              alt="Report attachment"
              className="w-full h-28 object-cover rounded-lg border border-border bg-muted"
            />
          )}

          {issue.address && (
            <p className="text-muted-foreground text-[11px] flex items-center gap-1 truncate">
              <span>📍</span> {issue.address}
            </p>
          )}

          <div className="flex items-center justify-between pt-1 border-t border-border/50">
            <span className="text-muted-foreground text-[10px]">
              {relativeTime(issue.created_at)}
            </span>
            <button
              type="button"
              className="text-xs font-semibold text-primary hover:underline cursor-pointer"
              onClick={() => {
                window.location.search = `?issue=${issue.id}`;
              }}
            >
              View Feed & Endorse
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}