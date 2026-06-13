import React from "react";
import { cn } from "@/lib/utils";

interface LiquidGlassButtonProps extends React.ComponentPropsWithoutRef<"button"> {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "subtle";
}

export const LiquidGlassButton = React.forwardRef<HTMLButtonElement, LiquidGlassButtonProps>(
  (
    {
      children,
      className,
      size = "md",
      variant = "default",
      disabled = false,
      style,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: "px-2 py-1 text-xs rounded-lg",
      md: "px-3 py-2 text-sm rounded-xl",
      lg: "px-4 py-3 text-base rounded-2xl",
    };

    const variantClasses = {
      default:
        "backdrop-blur-xl bg-black/[0.05] dark:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.12] saturate-150",
      subtle:
        "backdrop-blur-lg bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] saturate-125",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        style={style}
        className={cn(
          // Base styles
          "relative transition-all duration-200 ease-out whitespace-nowrap",
          "text-foreground dark:text-white/90 font-medium",
          "flex items-center gap-2",
          "pointer-events-auto cursor-pointer",

          // Glass morphism effect
          variantClasses[variant],

          // Size variants
          sizeClasses[size],

          // Interactive states
          "hover:bg-black/8 dark:hover:bg-white/12 hover:border-black/12 dark:hover:border-white/16",
          "active:bg-black/4 dark:active:bg-white/6 active:scale-[0.98]",
          "focus:outline-none focus:ring-2 focus:ring-foreground/20 dark:focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-transparent",

          // Disabled state
          disabled &&
            "opacity-50 cursor-not-allowed hover:bg-black/5 dark:hover:bg-white/8 hover:border-black/8 dark:hover:border-white/12 active:scale-100",

          // Custom classes
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

LiquidGlassButton.displayName = "LiquidGlassButton";
