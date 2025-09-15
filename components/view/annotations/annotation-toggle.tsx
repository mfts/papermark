"use client";

import { MessageSquare, MessageSquareOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AnnotationToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  hasAnnotations?: boolean;
}

export function AnnotationToggle({
  enabled,
  onToggle,
  hasAnnotations = false,
}: AnnotationToggleProps) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggle(!enabled)}
            className={`${
              enabled ? "bg-muted text-foreground" : "text-muted-foreground"
            } ${!hasAnnotations ? "cursor-not-allowed opacity-50" : ""}`}
            disabled={!hasAnnotations}
          >
            {enabled ? (
              <MessageSquare className="h-4 w-4" />
            ) : (
              <MessageSquareOff className="h-4 w-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {!hasAnnotations
              ? "No annotations available"
              : enabled
                ? "Hide annotations"
                : "Show annotations"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
