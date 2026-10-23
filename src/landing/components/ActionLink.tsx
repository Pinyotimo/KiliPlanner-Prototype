import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * A link that looks like the app's button.
 *
 * The shared `Button` is a real `<button>`, which is right for actions and
 * wrong for navigation. This keeps the same shapes, rings and shadows but
 * renders an `<a>`, so the page can be opened in a new tab, bookmarked, and
 * crawled.
 */
export function ActionLink({
  href,
  children,
  variant = "default",
  size = "default",
  className,
  external = false,
}: {
  href: string;
  children: ReactNode;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "lg" | "sm";
  className?: string;
  external?: boolean;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0",
        variant === "default" &&
          "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90 active:scale-[0.98]",
        variant === "outline" &&
          "border border-border bg-card text-foreground shadow-soft hover:bg-accent hover:text-accent-foreground",
        variant === "ghost" &&
          "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        size === "default" && "h-9 px-4",
        size === "sm" && "h-8 px-3 text-xs",
        size === "lg" && "h-11 px-6",
        className,
      )}
    >
      {children}
    </a>
  );
}
