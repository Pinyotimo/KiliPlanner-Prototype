import { AlertTriangle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MapNoticeProps {
  tone?: "info" | "warning" | "danger";
  title: string;
  description?: string;
  onDismiss?: () => void;
}

const TONE = {
  info: {
    icon: Info,
    className: "border-border bg-card/95 text-foreground",
    iconClass: "text-primary",
  },
  warning: {
    icon: AlertTriangle,
    className: "border-warning/40 bg-warning/10 text-foreground",
    iconClass: "text-warning",
  },
  danger: {
    icon: AlertTriangle,
    className: "border-destructive/40 bg-destructive/10 text-foreground",
    iconClass: "text-destructive",
  },
} as const;

/**
 * A message over the map.
 *
 * The map used to call `alert()` for anything that went wrong - a pin
 * outside the boundary, a refused GPS permission. A native alert blocks the
 * whole page, throws away what the user was doing, and cannot be styled or
 * translated. This is the same information, in the map's own space.
 */
export function MapNotice({
  tone = "info",
  title,
  description,
  onDismiss,
}: MapNoticeProps) {
  const { icon: Icon, className, iconClass } = TONE[tone];

  return (
    <div
      role="status"
      className={cn(
        "pointer-events-none absolute left-1/2 top-3 z-[1000] w-[min(22rem,calc(100%-1.5rem))] -translate-x-1/2",
      )}
    >
      <div
        className={cn(
          "pointer-events-auto flex items-start gap-2 rounded-lg border px-3 py-2 shadow-lifted backdrop-blur-sm",
          className,
        )}
      >
        <Icon className={cn("mt-0.5 h-3.5 w-3.5 shrink-0", iconClass)} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold leading-tight">{title}</p>
          {description && (
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss message"
            className="-mr-1 -mt-0.5 cursor-pointer rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
