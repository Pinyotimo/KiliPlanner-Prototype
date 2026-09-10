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
import type { Issue } from "../types/issue";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "../types/issue";
import { relativeTime } from "../lib/relativeTime";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CategoryIcon } from "./CategoryIcon";
import CommentSection from "./CommentSection";

interface IssueCardProps {
  issue: Issue;
  onStatusChange?: (issueId: string, newStatus: string) => Promise<void> | void;
  isEditable?: boolean;
}

const STATUS_OPTIONS: { value: Issue["status"]; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export default function IssueCard({ issue, onStatusChange, isEditable = false }: IssueCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<Issue["status"]>(issue.status);

  const categoryColor = CATEGORY_COLORS[issue.category] || "#64748b";

  // Dynamic status styling helper supporting normalized status keys
  const getStatusBadge = (statusKey: string) => {
    const status = statusKey?.toLowerCase().replace("-", "_") || "open";

    switch (status) {
      case "resolved":
      case "fixed":
        return {
          color:
            "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 ring-emerald-500/20",
          icon: <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />,
          label: "Resolved",
        };
      case "in_progress":
      case "under_review":
        return {
          color:
            "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30 ring-blue-500/20",
          icon: <AlertCircle className="h-3.5 w-3.5 shrink-0 text-blue-500 animate-pulse" />,
          label: "In Progress",
        };
      case "closed":
      case "rejected":
        return {
          color:
            "bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30 ring-slate-500/20",
          icon: <XCircle className="h-3.5 w-3.5 shrink-0 text-slate-500" />,
          label: "Closed",
        };
      default:
        return {
          color:
            "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 ring-amber-500/20",
          icon: <Clock3 className="h-3.5 w-3.5 shrink-0 text-amber-500" />,
          label: "Open",
        };
    }
  };

  const handleStatusSelect = async (newStatus: Issue["status"]) => {
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
    <Card className="group overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 text-slate-900 dark:text-slate-100 shadow-sm hover:shadow-md transition-all duration-300">
      {/* Top Bar: Category & Dynamic Interactive Status Selector */}
      <CardHeader className="p-4 sm:p-5 pb-3 flex-row items-center justify-between space-y-0 gap-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/30">
        <Badge
          variant="outline"
          style={{
            backgroundColor: `${categoryColor}15`,
            color: categoryColor,
            borderColor: `${categoryColor}35`,
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
              <Loader2 className="h-3.5 w-3.5 animate-spin text-slate-400 absolute left-2 z-10" />
            )}
            <select
              value={currentStatus}
              disabled={isUpdating}
              onChange={(e) => handleStatusSelect(e.target.value as Issue["status"])}
              className={`appearance-none cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold pl-2.5 pr-7 py-1 rounded-full border shadow-2xs transition-all focus:outline-none focus:ring-2 ${
                statusConfig.color
              } ${isUpdating ? "opacity-60 cursor-not-allowed pl-7" : ""}`}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option
                  key={opt.value}
                  value={opt.value}
                  className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-normal"
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
        <p className="text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed font-normal">
          {issue.description}
        </p>

        {/* Official Department Update Banner */}
        {issue.official_notes && (
          <div className="rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-800/50 p-3.5 text-slate-800 dark:text-slate-200 text-xs space-y-1.5 shadow-2xs">
            <div className="flex items-center gap-1.5 font-semibold text-blue-700 dark:text-blue-400 text-[11px] uppercase tracking-wide">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              <span>Official Department Update</span>
            </div>
            <p className="leading-relaxed text-slate-700 dark:text-slate-300">
              {issue.official_notes}
            </p>
          </div>
        )}

        {/* Additional Sub-details */}
        {issue.sub_detail && !issue.official_notes && (
          <div className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed bg-slate-100/70 dark:bg-slate-800/40 px-3.5 py-2.5 rounded-xl border-l-3 border-blue-500">
            {issue.sub_detail}
          </div>
        )}

        {/* Attached Evidence Image */}
        {issue.photo_base64 && (
          <div className="relative rounded-xl overflow-hidden border border-slate-200/80 dark:border-slate-800 bg-slate-900 max-h-96 group/photo">
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
      <CardFooter className="px-4 sm:px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-950/20">
        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300 truncate max-w-full">
          <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
          <span className="truncate">
            {issue.address || `${issue.lat?.toFixed(4)}, ${issue.lng?.toFixed(4)}`}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-slate-200/50 dark:border-slate-800/50 pt-2 sm:pt-0">
          {issue.reporter_name && (
            <span className="flex items-center gap-1 font-medium">
              <User className="h-3 w-3 text-slate-400" />
              {issue.reporter_name}
            </span>
          )}
          <span className="flex items-center gap-1 text-slate-400">
            <Clock className="h-3 w-3" />
            {relativeTime(issue.created_at)}
          </span>
        </div>
      </CardFooter>

      {/* Integrated Comments Feed */}
      <div className="p-4 sm:p-5 pt-3 border-t border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/40">
        <CommentSection issueId={issue.id} />
      </div>
    </Card>
  );
}