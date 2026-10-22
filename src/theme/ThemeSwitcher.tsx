import { useEffect, useRef, useState } from "react";
import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "./ThemeProvider";
import { ACCENT_THEMES, accentSwatch, type ThemeMode } from "./themes";

const MODES: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

interface ThemeSwitcherProps {
  className?: string;
  /** Renders the trigger as a bare icon button (navbar) or with a label. */
  variant?: "icon" | "labelled";
  align?: "start" | "end";
}

export function ThemeSwitcher({
  className,
  variant = "icon",
  align = "end",
}: ThemeSwitcherProps) {
  const { mode, resolvedMode, accent, setMode, setAccent } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent | TouchEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const TriggerIcon =
    mode === "system" ? Monitor : resolvedMode === "dark" ? Moon : Sun;

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Appearance: ${mode}. Change theme`}
        title="Change theme"
        className={cn(
          "inline-flex items-center gap-2 rounded-lg border border-border bg-card/70 text-foreground transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          variant === "icon" ? "h-9 w-9 justify-center" : "h-9 px-3 text-xs font-medium",
        )}
      >
        <TriggerIcon className="h-4 w-4" />
        {variant === "labelled" && (
          <span className="hidden sm:inline">
            {mode === "system" ? "System" : resolvedMode === "dark" ? "Dark" : "Light"}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Theme settings"
          className={cn(
            "absolute top-11 z-50 w-64 rounded-xl border border-border bg-popover p-3 text-popover-foreground shadow-floating",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Appearance
          </p>

          <div
            role="radiogroup"
            aria-label="Colour mode"
            className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1"
          >
            {MODES.map(({ value, label, icon: Icon }) => {
              const selected = mode === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setMode(value)}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all cursor-pointer",
                    selected
                      ? "bg-card text-foreground shadow-soft ring-1 ring-border"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              );
            })}
          </div>

          <p className="mb-2 mt-4 flex items-center gap-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            <Palette className="h-3 w-3" />
            Colour theme
          </p>

          <div
            role="radiogroup"
            aria-label="Colour theme"
            className="grid grid-cols-3 gap-1.5"
          >
            {ACCENT_THEMES.map((theme) => {
              const selected = accent === theme.id;
              return (
                <button
                  key={theme.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  title={`${theme.label} - ${theme.hint}`}
                  onClick={() => setAccent(theme.id)}
                  className={cn(
                    "group relative flex flex-col items-center gap-1.5 rounded-lg border p-2 transition-all cursor-pointer",
                    selected
                      ? "border-primary bg-accent/60"
                      : "border-transparent hover:bg-muted",
                  )}
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full ring-1 ring-black/10 dark:ring-white/15"
                    style={{ backgroundColor: accentSwatch(theme) }}
                  >
                    {selected && <Check className="h-3.5 w-3.5 text-white drop-shadow" />}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-medium leading-none",
                      selected ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {theme.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
