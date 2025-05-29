import { Play } from "lucide-react";

import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface AwayPosterProps {
  isVisible: boolean;
  inactivityThreshold: number;
  onDismiss?: () => void;
  className?: string;
}

export function AwayPoster({
  isVisible,
  inactivityThreshold,
  onDismiss,
  className,
}: AwayPosterProps) {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return minutes > 0 ? `${minutes}m ${seconds % 60}s` : `${seconds}s`;
  };

  return (
    <Dialog open={isVisible} onOpenChange={(open) => !open && onDismiss?.()}>
      <DialogContent
        className={cn(
          "w-full max-w-sm rounded-md border bg-card p-4 text-card-foreground shadow-lg",
          "absolute bottom-6 left-6",
          "animate-in fade-in slide-in-from-bottom",
          className,
        )}
        onInteractOutside={onDismiss}
      >
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <Badge
              variant="outline"
              className="border-orange-400 bg-orange-100 text-orange-600"
            >
              Auto-paused
            </Badge>
            <span className="mr-6 text-xs text-muted-foreground">
              {formatTime(inactivityThreshold)} idle
            </span>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              We paused to protect your session
            </h3>
            <p className="text-sm text-muted-foreground">
              You were inactive, so we paused the document preview to keep
              session safe.
            </p>
          </div>

          <div className="pt-2">
            <Button onClick={onDismiss} className="w-full">
              <Play className="mr-2 h-4 w-4" />
              Continue where you left off
            </Button>
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            Or just move your mouse or press any key to continue
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
