import { MapPin, User, Clock, CheckCircle2, Clock3, AlertCircle, XCircle } from "lucide-react";
import type { Issue } from "../types/issue";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "../types/issue";
import { relativeTime } from "../lib/relativeTime";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "./CategoryIcon";
import CommentSection from "./CommentSection";

interface IssueCardProps {
  issue: Issue;
}

export default function IssueCard({ issue }: IssueCardProps) {
  const categoryColor = CATEGORY_COLORS[issue.category] || "#64748b";

  // Dynamic status styling helper for all official statuses
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resolved":
        return {
          color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400",
          icon: <CheckCircle2 className="h-3 w-3 shrink-0" />,
          label: "Resolved",
        };
      case "in_progress":
        return {
          color: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400",
          icon: <AlertCircle className="h-3 w-3 shrink-0 animate-pulse" />,
          label: "In Progress",
        };
      case "closed":
        return {
          color: "bg-muted text-muted-foreground border-border",
          icon: <XCircle className="h-3 w-3 shrink-0" />,
          label: "Closed",
        };
      default:
        return {
          color: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400",
          icon: <Clock3 className="h-3 w-3 shrink-0" />,
          label: "Open",
        };
    }
  };

  const statusConfig = getStatusBadge(issue.status);

  return (
    <Card className="group overflow-hidden rounded-xl border border-border/70 bg-card text-card-foreground shadow-xs transition-all duration-200 hover:border-border hover:shadow-md">
      {/* Header: Category Badge & Dynamic Status Indicator */}
      <CardHeader className="p-4 pb-3 flex-row justify-between items-center space-y-0">
        <Badge
          variant="outline"
          style={{
            backgroundColor: `${categoryColor}12`,
            color: categoryColor,
            borderColor: `${categoryColor}30`,
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold tracking-wider uppercase rounded-md transition-colors"
        >
          <CategoryIcon category={issue.category} className="h-3.5 w-3.5" />
          {CATEGORY_LABELS[issue.category] || issue.category}
        </Badge>

        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-colors ${statusConfig.color}`}
        >
          {statusConfig.icon}
          <span>{statusConfig.label}</span>
        </span>
      </CardHeader>

      {/* Main Content: Description, Official Notes & Photo */}
      <CardContent className="px-4 py-1 space-y-3">
        <div className="space-y-2">
          <p className="text-foreground text-sm leading-relaxed font-normal">
            {issue.description}
          </p>

          {/* Official Notes Banner (when set by official) */}
          {issue.official_notes && (
            <div className="bg-primary/10 border-l-2 border-primary text-foreground text-xs p-2.5 rounded-r-md space-y-1">
              <p className="font-semibold text-[11px] text-primary">
                🏛️ Official Department Update:
              </p>
              <p className="leading-relaxed">{issue.official_notes}</p>
            </div>
          )}

          {issue.sub_detail && !issue.official_notes && (
            <div className="text-muted-foreground text-xs leading-relaxed bg-muted/40 pl-3 pr-2.5 py-2 rounded-r-md border-l-2 border-primary/50">
              {issue.sub_detail}
            </div>
          )}
        </div>

        {issue.photo_base64 && (
          <div className="relative rounded-lg overflow-hidden border border-border/60 bg-muted max-h-80 group/photo">
            <img
              src={issue.photo_base64}
              alt="Report evidence"
              className="w-full h-full object-cover transition-transform duration-300 group-hover/photo:scale-[1.02]"
            />
          </div>
        )}
      </CardContent>

      {/* Footer: Location, Reporter & Time metadata */}
      <CardFooter className="px-4 py-2.5 flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-muted-foreground gap-2 border-t border-border/50 bg-muted/20 mt-3">
        <div className="flex items-center gap-1.5 font-medium text-foreground/80 truncate max-w-full">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate">
            {issue.address || `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-border/40 pt-2 sm:pt-0">
          {issue.reporter_name && (
            <span className="flex items-center gap-1 font-medium">
              <User className="h-3 w-3 text-muted-foreground/80" />
              {issue.reporter_name}
            </span>
          )}
          <span className="flex items-center gap-1 text-muted-foreground/80">
            <Clock className="h-3 w-3" />
            {relativeTime(issue.created_at)}
          </span>
        </div>
      </CardFooter>

      {/* Integrated Comments */}
      <div className="p-4 pt-3 border-t border-border/40 bg-muted/10">
        <CommentSection issueId={issue.id} />
      </div>
    </Card>
  );
}