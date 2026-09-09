import { MapPin, User, Clock, CheckCircle2, AlertCircle } from "lucide-react";
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
  const categoryColor = CATEGORY_COLORS[issue.category];
  const isResolved = issue.status === "resolved";

  return (
    <Card className="overflow-hidden border border-border bg-card text-card-foreground transition-all hover:border-primary/40 hover:shadow-md">
      {/* Header: Category Badge & Status Indicator */}
      <CardHeader className="p-4 pb-3 flex-row justify-between items-center space-y-0">
        <Badge
          variant="outline"
          style={{
            backgroundColor: `${categoryColor}15`,
            color: categoryColor,
            borderColor: `${categoryColor}35`,
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold tracking-wide uppercase border rounded-md"
        >
          <CategoryIcon category={issue.category} className="h-3.5 w-3.5" />
          {CATEGORY_LABELS[issue.category]}
        </Badge>

        <span
          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full border ${
            isResolved
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-muted text-muted-foreground border-border"
          }`}
        >
          {isResolved ? (
            <CheckCircle2 className="h-3 w-3 shrink-0 text-primary" />
          ) : (
            <AlertCircle className="h-3 w-3 shrink-0 text-muted-foreground" />
          )}
          <span className="capitalize">{issue.status}</span>
        </span>
      </CardHeader>

      {/* Main Content: Description & Photo */}
      <CardContent className="px-4 py-1 space-y-3">
        <div>
          <p className="text-foreground text-sm leading-snug font-normal">
            {issue.description}
          </p>
          {issue.sub_detail && (
            <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed bg-muted/50 p-2.5 rounded-md border border-border">
              {issue.sub_detail}
            </p>
          )}
        </div>

        {issue.photo_base64 && (
          <div className="relative rounded-lg overflow-hidden border border-border bg-muted max-h-72">
            <img
              src={issue.photo_base64}
              alt="Issue evidence"
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.01]"
            />
          </div>
        )}
      </CardContent>

      {/* Footer: Location, Reporter & Time metadata */}
      <CardFooter className="px-4 py-3 flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-muted-foreground gap-2 border-t border-border bg-muted/30 mt-3">
        <span className="flex items-center gap-1.5 font-medium text-foreground/90 truncate max-w-full">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate">
            {issue.address || `${issue.lat.toFixed(4)}, ${issue.lng.toFixed(4)}`}
          </span>
        </span>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
          {issue.reporter_name && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {issue.reporter_name}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {relativeTime(issue.created_at)}
          </span>
        </div>
      </CardFooter>

      {/* Integrated Comments */}
      <div className="px-4 pb-3">
        <CommentSection issueId={issue.id} />
      </div>
    </Card>
  );
}