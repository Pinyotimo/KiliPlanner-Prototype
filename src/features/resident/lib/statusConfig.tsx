import { Clock3, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export function getStatusConfig(statusKey?: string) {
  const status = statusKey?.toLowerCase().replace("-", "_") || "open";

  switch (status) {
    case "unverified":
      return { color: "bg-muted text-muted-foreground", icon: <Clock3 className="h-3 w-3 shrink-0" />, label: "Under verification" };
    case "under_review":
      return { color: "bg-muted text-muted-foreground", icon: <AlertCircle className="h-3 w-3 shrink-0" />, label: "Under Review" };
    case "corroborated":
      return { color: "bg-accent/10 text-accent-foreground", icon: <CheckCircle2 className="h-3 w-3 shrink-0" />, label: "Corroborated" };
    case "verified":
      return { color: "bg-primary/10 text-primary", icon: <CheckCircle2 className="h-3 w-3 shrink-0" />, label: "Verified Issue" };
    case "resolved":
    case "fixed":
      return { color: "bg-primary/10 text-primary", icon: <CheckCircle2 className="h-3 w-3 shrink-0" />, label: "Resolved" };
    case "rejected":
      return { color: "bg-muted/10 text-muted-foreground", icon: <XCircle className="h-3 w-3 shrink-0" />, label: "Rejected" };
    default:
      return { color: "bg-accent/10 text-accent-foreground", icon: <Clock3 className="h-3 w-3 shrink-0" />, label: "Open" };
  }
}