import { Clock3, AlertCircle, CheckCircle2, XCircle, ShieldCheck } from "lucide-react";

/**
 * Status presentation.
 *
 * The verification pipeline is an ordered scale, so each stage takes one rung
 * of the ordinal ramp (`--status-1` ... `--status-5`) rather than a
 * categorical colour. Rejected sits off the scale and takes the reserved
 * destructive colour, always paired with its icon and label.
 */
export function getStatusConfig(statusKey?: string) {
  const status = statusKey?.toLowerCase().replace("-", "_") || "open";

  switch (status) {
    case "unverified":
      return {
        color: "bg-[var(--status-1)] text-[var(--status-1-ink)]",
        fill: "var(--status-1)",
        icon: <Clock3 className="h-3 w-3 shrink-0" />,
        label: "Under verification",
      };
    case "under_review":
      return {
        color: "bg-[var(--status-2)] text-[var(--status-2-ink)]",
        fill: "var(--status-2)",
        icon: <AlertCircle className="h-3 w-3 shrink-0" />,
        label: "Under review",
      };
    case "corroborated":
      return {
        color: "bg-[var(--status-3)] text-[var(--status-3-ink)]",
        fill: "var(--status-3)",
        icon: <CheckCircle2 className="h-3 w-3 shrink-0" />,
        label: "Corroborated",
      };
    case "verified":
      return {
        color: "bg-[var(--status-4)] text-[var(--status-4-ink)]",
        fill: "var(--status-4)",
        icon: <ShieldCheck className="h-3 w-3 shrink-0" />,
        label: "Verified issue",
      };
    case "resolved":
    case "fixed":
      return {
        color: "bg-[var(--status-5)] text-[var(--status-5-ink)]",
        fill: "var(--status-5)",
        icon: <CheckCircle2 className="h-3 w-3 shrink-0" />,
        label: "Resolved",
      };
    case "rejected":
      return {
        color: "bg-destructive/10 text-destructive",
        fill: "var(--destructive)",
        icon: <XCircle className="h-3 w-3 shrink-0" />,
        label: "Rejected",
      };
    default:
      return {
        color: "bg-muted text-muted-foreground",
        fill: "var(--muted-foreground)",
        icon: <Clock3 className="h-3 w-3 shrink-0" />,
        label: "Open",
      };
  }
}
