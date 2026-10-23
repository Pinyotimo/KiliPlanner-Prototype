import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost" | "destructive" | "secondary" | "link";
  size?: "default" | "sm" | "lg" | "icon" | "icon-sm";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:pointer-events-none disabled:opacity-50 cursor-pointer",
          "[&_svg]:pointer-events-none [&_svg]:shrink-0",
          variant === "default" &&
            "bg-primary text-primary-foreground shadow-soft hover:bg-primary/90 active:scale-[0.98]",
          variant === "secondary" &&
            "bg-secondary text-secondary-foreground shadow-soft hover:bg-secondary/80",
          variant === "outline" &&
            "border border-border bg-card text-foreground shadow-soft hover:bg-accent hover:text-accent-foreground",
          variant === "ghost" && "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          variant === "destructive" &&
            "bg-destructive text-destructive-foreground shadow-soft hover:bg-destructive/90",
          variant === "link" && "text-primary underline-offset-4 hover:underline",
          size === "default" && "h-9 px-4",
          size === "sm" && "h-8 px-3 text-xs",
          size === "lg" && "h-11 px-6",
          size === "icon" && "h-9 w-9",
          size === "icon-sm" && "h-8 w-8",
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
