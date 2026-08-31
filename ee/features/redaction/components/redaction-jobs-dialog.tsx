import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function RedactionJobsDialog({
  open,
  onOpenChange,
  documentName,
  onStartNew,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  documentName: string;
  onStartNew: () => void;
}) {
  const subtitle = useMemo(
    () => `Manage redaction jobs for ${documentName}`,
    [documentName],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Redaction jobs</DialogTitle>
          <DialogDescription>{subtitle}</DialogDescription>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          Redaction jobs are not available in this local build stub.
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={onStartNew}>Start new redaction</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}