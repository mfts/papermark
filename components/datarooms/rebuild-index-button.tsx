import { useState } from "react";

import { Hash, ListOrderedIcon, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { useFeatureFlags } from "@/lib/hooks/use-feature-flags";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ResponsiveButton } from "@/components/ui/responsive-button";

interface RebuildIndexButtonProps {
  teamId: string;
  dataroomId: string;
  disabled?: boolean;
}

export default function RebuildIndexButton({
  teamId,
  dataroomId,
  disabled = false,
}: RebuildIndexButtonProps) {
  const { isFeatureEnabled } = useFeatureFlags();
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const isDataroomIndexEnabled = isFeatureEnabled("dataroomIndex");

  // Don't render if feature is not enabled
  if (!isDataroomIndexEnabled) {
    return null;
  }

  const handleRebuildIndex = async () => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `/api/teams/${teamId}/datarooms/${dataroomId}/calculate-indexes`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to rebuild indexes");
      }

      const result = await response.json();

      toast.success(
        `Hierarchical indexes rebuilt successfully! Updated ${result.totalUpdated} items (${result.foldersUpdated} folders, ${result.documentsUpdated} documents).`,
      );

      setIsOpen(false);

      // Trigger a page refresh to show updated indexes
      window.location.reload();
    } catch (error) {
      console.error("Error rebuilding indexes:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to rebuild indexes",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <ResponsiveButton
          icon={<ListOrderedIcon className="h-4 w-4" />}
          text="Rebuild Index"
          variant="outline"
          size="sm"
          disabled={disabled}
        />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            Rebuild Hierarchical Index
          </DialogTitle>
          <DialogDescription>
            Recalculate the hierarchical numbering based on the dataroom
            items&apos; current order.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-start gap-3">
              <div className="text-sm text-muted-foreground">
                <p className="mb-1 font-medium">What this does:</p>
                <ul className="list-inside list-disc space-y-1">
                  <li>
                    Analyzes the current folder structure and document order
                  </li>
                  <li>
                    Assigns hierarchical numbers (1, 1.1, 1.1.1, 2, 2.1, etc.)
                  </li>
                  <li>
                    Updates the display to show these numbers alongside names
                  </li>
                  <li>Maintains the existing order and hierarchy</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleRebuildIndex} loading={isLoading}>
            <ListOrderedIcon className="h-4 w-4" />
            Rebuild Index
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
