import { useState } from "react";
import {
  MapPin,
  User,
  Clock,
  CheckCircle2,
  Clock3,
  AlertCircle,
  XCircle,
  Building2,
  ChevronDown,
  Loader2,
} from "lucide-react";
import type { Issue } from "../../../types/issue";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "../../../types/issue";
import { relativeTime } from "../../../lib/relativeTime";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "../../../components/CategoryIcon";
import CommentSection from "./CommentSection";

interface IssueCardProps {
  issue: Issue;
  onStatusChange?: (issueId: string, newStatus: string) => Promise<void> | void;
  isEditable?: boolean;
}

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
] as const;

export default function IssueCard({
  issue,
  onStatusChange,
  isEditable = false,
}: IssueCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(issue.status);

  const categoryColor =
    CATEGORY_COLORS[issue.category] || "var(--category-other)";

  // Dynamic status styling helper supporting normalized status keys
  const getStatusBadge = (statusKey: string) => {
    const status = statusKey?.toLowerCase().replace("-", "_") || "open";

    switch (status) {
      case "resolved":
      case "fixed":
        return {
          color:
            "bg-primary/10 text-primary dark:text-primary border-primary/30 ring-primary/20",
          icon: (
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ),
          label: "Resolved",
        };
      case "in_progress":
      case "under_review":
        return {
          color:
            "bg-primary/10 text-primary dark:text-primary border-primary/30 ring-primary/20",
          icon: (
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-primary animate-pulse" />
          ),
          label: "In Progress",
        };
      case "closed":
      case "rejected":
        return {
          color:
            "bg-muted/10 text-foreground dark:text-muted-foreground border-border/30 ring-ring/20",
          icon: (
            <XCircle className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          ),
          label: "Closed",
        };
      default:
        return {
          color:
            "bg-accent/10 text-accent-foreground dark:text-accent-foreground border-accent/30 ring-ring/20",
          icon: (
            <Clock3 className="h-3.5 w-3.5 shrink-0 text-accent-foreground" />
          ),
          label: "Open",
        };
    }
  };

  const handleStatusSelect = async (newStatus: string) => {
    if (newStatus === currentStatus || isUpdating) return;

    setIsUpdating(true);
    setCurrentStatus(newStatus);

    try {
      if (onStatusChange) {
        await onStatusChange(issue.id, newStatus);
      }
    } catch (error) {
      // Revert status on failure
      setCurrentStatus(issue.status);
      console.error("Failed to update status:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const statusConfig = getStatusBadge(currentStatus);

  return (
    <Card className="group overflow-hidden rounded-2xl border border-border dark:border-border/80 bg-card dark:bg-background/90 text-foreground dark:text-foreground shadow-sm hover:shadow-md transition-all duration-300">
      {/* Top Bar: Category & Dynamic Interactive Status Selector */}
      <CardHeader className="p-4 sm:p-5 pb-3 flex-row items-center justify-between space-y-0 gap-3 border-b border-border dark:border-border/60 bg-muted/50 dark:bg-background/30">
        <Badge
          variant="outline"
          style={{
            backgroundColor: `color-mix(in oklch, ${categoryColor} 12%, transparent)`,
            color: categoryColor,
            borderColor: `color-mix(in oklch, ${categoryColor} 28%, transparent)`,
          }}
          className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold tracking-wider uppercase rounded-lg transition-colors shrink-0 shadow-xs"
        >
          <CategoryIcon category={issue.category} className="h-3.5 w-3.5" />
          <span>{CATEGORY_LABELS[issue.category] || issue.category}</span>
        </Badge>

        {/* Dynamic Status Display or Selector Dropdown */}
        {isEditable || onStatusChange ? (
          <div className="relative inline-flex items-center">
            {isUpdating && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground absolute left-2 z-10" />
            )}
            <select
              value={currentStatus}
              disabled={isUpdating}
              onChange={(e) => handleStatusSelect(e.target.value)}
              className={`appearance-none cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold pl-2.5 pr-7 py-1 rounded-full border shadow-2xs transition-all focus:outline-none focus:ring-2 ${
                statusConfig.color
              } ${isUpdating ? "opacity-60 cursor-not-allowed pl-7" : ""}`}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-card dark:bg-background text-foreground dark:text-foreground font-normal"
                >
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="h-3 w-3 absolute right-2.5 pointer-events-none opacity-60" />
          </div>
        ) : (
          <span
            className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border shadow-2xs transition-colors ${statusConfig.color}`}
          >
            {statusConfig.icon}
            <span>{statusConfig.label}</span>
          </span>
        )}
      </CardHeader>

      {/* Main Content Body */}
      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Issue Description */}
        <p className="text-foreground dark:text-foreground text-sm sm:text-base leading-relaxed font-normal">
          {issue.description}
        </p>

        {/* Official Department Update Banner */}
        {issue.official_notes && (
          <div className="rounded-xl bg-primary/10 dark:bg-primary/10 border border-primary/30 p-3.5 text-foreground dark:text-foreground text-xs space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 font-semibold text-primary dark:text-primary text-[11px] uppercase tracking-wide">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span>Official Department Update</span>
            </div>
            <p className="leading-relaxed text-foreground dark:text-muted-foreground">
              {issue.official_notes}
            </p>
          </div>
        )}

        {/* Additional Sub-details */}
        {issue.sub_detail && !issue.official_notes && (
          <div className="text-foreground dark:text-muted-foreground text-xs leading-relaxed bg-muted/70 dark:bg-muted/40 px-3.5 py-2.5 rounded-xl border-l-3 border-primary">
            {issue.sub_detail}
          </div>
        )}

        {/* Attached Evidence Image */}
        {issue.photo_base64 && (
          <div className="relative rounded-xl overflow-hidden border border-border/80 dark:border-border bg-background max-h-96 group/photo">
            <img
              src={issue.photo_base64}
              alt="Report evidence"
              className="w-full h-full max-h-96 object-cover transition-transform duration-500 group-hover/photo:scale-[1.02]"
              loading="lazy"
            />
          </div>
        )}
      </CardContent>

      {/* Footer Metadata */}
      <CardFooter className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-muted-foreground dark:text-muted-foreground gap-2 border-t border-border dark:border-border/60 bg-muted/30 dark:bg-background/20">
        <div className="flex items-center gap-1.5 font-medium text-foreground dark:text-muted-foreground truncate max-w-full">
          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="truncate">
            {issue.address ||
              `${issue.lat?.toFixed(4)}, ${issue.lng?.toFixed(4)}`}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-border/50 dark:border-border/50 pt-2 sm:pt-0">
          {issue.reporter_name && (
            <span className="flex items-center gap-1 font-medium">
              <User className="h-3 w-3 text-muted-foreground" />
              {issue.reporter_name}
            </span>
          )}
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            {relativeTime(issue.created_at)}
          </span>
        </div>
      </CardFooter>

      {/* Integrated Comments Feed */}
      <div className="p-4 sm:p-5 pt-3 border-t border-border dark:border-border/60 bg-muted/50 dark:bg-background/40">
        <CommentSection issueId={issue.id} />
      </div>
    </Card>
  );
}