"use client";

import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="rounded-full h-10 w-10 flex items-center justify-center bg-card border-border shadow-3xs p-0 text-muted-foreground/50 cursor-pointer"
        disabled
      >
        <Sun className="size-4.5 animate-pulse" />
      </Button>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="rounded-full h-9 w-9 flex items-center justify-center bg-card border-border hover:bg-secondary cursor-pointer shadow-3xs p-0 text-muted-foreground hover:text-foreground transition-all duration-200"
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      {isDark ? (
        <Sun className="size-4.5 text-amber-500 transition-transform duration-300" />
      ) : (
        <Moon className="size-4.5 text-indigo-600 transition-transform duration-300" />
      )}
    </Button>
  );
}
