import type { ReactNode } from "react";
import { CircleAlert } from "lucide-react";

/**
 * A labelled form field.
 *
 * The label is always visible; the hint says what the field wants and where
 * the value came from; the error is the schema's own message, shown under
 * the field it belongs to. The three are wired together with
 * `aria-describedby` so a screen reader reads the hint and the error with
 * the field, not somewhere else on the page.
 */
export function Field({
  id,
  label,
  badge,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  /** A short note on the right of the label: "required", "optional", ... */
  badge?: ReactNode;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor={id}
          className="text-xs font-semibold text-foreground"
        >
          {label}
        </label>
        {badge ? (
          <span className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            {badge}
          </span>
        ) : null}
      </div>
      {hint ? (
        <p
          id={`${id}-hint`}
          className="text-[11px] leading-snug text-muted-foreground"
        >
          {hint}
        </p>
      ) : null}
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="flex items-start gap-1.5 text-[11px] font-medium text-destructive"
        >
          <CircleAlert className="mt-px h-3 w-3 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default Field;
