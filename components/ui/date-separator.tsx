"use client";

import { memo } from "react";

import { cn } from "@/lib/utils";

interface DateSeparatorProps {
  date: string;
  className?: string;
}

export const DateSeparator = memo(({ date, className }: DateSeparatorProps) => {
  return (
    <div className={cn("my-4 flex items-center justify-center", className)}>
      <div className="sticky top-5 z-10 rounded-full border border-border/60 bg-background px-4 py-2 text-xs font-medium text-muted-foreground shadow-sm">
        {date}
      </div>
    </div>
  );
});

DateSeparator.displayName = "DateSeparator";
