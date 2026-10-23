import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string;
  description: string;
  icon: string;
  tone?: "neutral" | "success" | "warning" | "danger";
};

/**
 * Tone surfaces for the stat tile icon chip.
 *
 * The chip is filled with the tone and the glyph uses that tone's foreground
 * token, so the mark keeps its contrast in both modes. The label and the
 * value are always carried by text, so colour is never the only signal.
 */
const toneClasses = {
  neutral: "bg-muted text-foreground",
  success: "bg-success text-success-foreground",
  warning: "bg-warning text-warning-foreground",
  danger: "bg-destructive text-destructive-foreground",
};

export default function StatCard({
  label,
  value,
  description,
  icon,
  tone = "neutral",
}: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-lifted">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg",
            toneClasses[tone],
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-foreground">
        {value}
      </div>
      <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{description}</p>
    </div>
  );
}
