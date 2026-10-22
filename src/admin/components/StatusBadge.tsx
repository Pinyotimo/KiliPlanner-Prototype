import React from "react";
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import type { IssueStatus } from "../../types/issue";
import { statusLabel, statusRung } from "../lib/plannerStatus";

interface StatusBadgeProps {
  status: IssueStatus | string;
  /** Extra classes, for the badge to sit at a different size. */
  className?: string;
}

/**
 * Status presentation.
 *
 * The verification pipeline is an ordered scale, so each stage takes one rung
 * of the ordinal ramp (`--status-1` ... `--status-5`) rather than a
 * categorical colour. Rejected sits off the scale and takes the reserved
 * destructive colour. Every badge pairs its colour with an icon and a text
 * label, so the meaning never rests on colour alone.
 *
 * The wording comes from the shared status vocabulary, so a badge, a filter
 * option and the status board cannot drift apart.
 */
const statusConfig: Record<
  string,
  {
    className: string;
    Icon: typeof Clock3;
  }
> = {
  UNVERIFIED: {
    className: "bg-[var(--status-1)] text-[var(--status-1-ink)]",
    Icon: Clock3,
  },
  UNDER_REVIEW: {
    className: "bg-[var(--status-2)] text-[var(--status-2-ink)]",
    Icon: AlertCircle,
  },
  CORROBORATED: {
    className: "bg-[var(--status-3)] text-[var(--status-3-ink)]",
    Icon: CheckCircle2,
  },
  VERIFIED: {
    className: "bg-[var(--status-4)] text-[var(--status-4-ink)]",
    Icon: ShieldCheck,
  },
  RESOLVED: {
    className: "bg-[var(--status-5)] text-[var(--status-5-ink)]",
    Icon: CheckCircle2,
  },
  REJECTED: {
    className: "bg-destructive/10 text-destructive",
    Icon: XCircle,
  },
  // Reports that no planner has touched yet still carry the older
  // lowercase states. They get their own rung rather than being folded
  // into "Under verification", which would assert a pipeline state the
  // row does not have.
  open: {
    className: "bg-[var(--status-1)] text-[var(--status-1-ink)]",
    Icon: Clock3,
  },
  in_progress: {
    className: "bg-[var(--status-2)] text-[var(--status-2-ink)]",
    Icon: AlertCircle,
  },
  resolved: {
    className: "bg-[var(--status-5)] text-[var(--status-5-ink)]",
    Icon: CheckCircle2,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
}) => {
  const config =
    statusConfig[status] ??
    // An unknown status is shown as the rung it sits on, with the stored
    // value spelled out - never a label the row does not support.
    {
      className: `bg-[var(--status-${statusRung(status)})] text-[var(--status-${statusRung(status)}-ink)]`,
      Icon: Clock3,
    };
  const { Icon } = config;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ${config.className} ${className ?? ""}`}
    >
      <Icon className="h-3 w-3 shrink-0" aria-hidden="true" />
      {statusLabel(status)}
    </span>
  );
};

export default StatusBadge;
