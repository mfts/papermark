"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { type ScopeItem, ScopePill } from "./scope-pill";

interface ScopePillsContainerProps {
  items: ScopeItem[];
  onRemove: (id: string) => void;
  maxVisible?: number;
  className?: string;
}

export function ScopePillsContainer({
  items,
  onRemove,
  maxVisible = 3,
  className,
}: ScopePillsContainerProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  if (items.length === 0) return null;

  const visibleItems = items.slice(0, maxVisible);
  const hiddenItems = items.slice(maxVisible);
  const hasOverflow = hiddenItems.length > 0;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {visibleItems.map((item) => (
        <ScopePill key={item.id} item={item} onRemove={onRemove} />
      ))}
      {hasOverflow && (
        <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              aria-label="open popover"
              className="flex h-auto items-center px-1.5 py-1 text-xs hover:bg-transparent"
            >
              {hiddenItems.length}+
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1.5" align="start">
            <div className="flex flex-col gap-1">
              {hiddenItems.map((item) => (
                <ScopePill key={item.id} item={item} onRemove={onRemove} />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}
