"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      className="p-2 rounded-md bg-secondary/40 hover:bg-secondary/60 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-1000"
      aria-label="Toggle theme"
    >
      <div className="relative w-5 h-5">
        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 absolute top-0 left-0" />
        <Moon className="h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 absolute top-0 left-0" />
      </div>
    </button>
  );
}
