"use client";

import { MessageCircleDashedIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatToggleButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function ChatToggleButton({
  isOpen,
  onToggle,
  className,
}: ChatToggleButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          aria-label={
            isOpen
              ? "Close AI Document Assistant"
              : "Open AI Document Assistant"
          }
          className={cn(
            "h-10 w-10 p-0 shadow-lg transition-all duration-200 hover:scale-105",
            isOpen
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "border bg-background hover:bg-muted",
            className,
          )}
        >
          <MessageCircleDashedIcon className="h-5 w-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <p>AI Assistant </p>
      </TooltipContent>
    </Tooltip>
  );
}
