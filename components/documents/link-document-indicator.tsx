import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { DocumentVersion } from "@prisma/client";
import { Edit, ExternalLink, LinkIcon } from "lucide-react";
import { toast } from "sonner";

import { useAnalytics } from "@/lib/analytics";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { ButtonTooltip } from "@/components/ui/tooltip";

interface LinkDocumentIndicatorProps {
  documentId: string;
  primaryVersion: DocumentVersion;
  onUrlUpdate?: () => void;
}

export default function LinkDocumentIndicator({
  documentId,
  primaryVersion,
  onUrlUpdate,
}: LinkDocumentIndicatorProps) {
  const teamInfo = useTeam();
  const analytics = useAnalytics();
  const [isMainDialogOpen, setIsMainDialogOpen] = useState(false);
  const [isUrlDialogOpen, setIsUrlDialogOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Local state for immediate UI updates
  const [currentUrl, setCurrentUrl] = useState(primaryVersion.file);

  // Sync with prop changes (e.g., when SWR revalidates)
  useEffect(() => {
    setCurrentUrl(primaryVersion.file);
  }, [primaryVersion.file]);

  const updateLinkUrl = async () => {
    if (!teamInfo?.currentTeam?.id || !newUrl.trim()) return;

    setIsUpdating(true);
    try {
      const response = await fetch(
        `/api/teams/${teamInfo.currentTeam.id}/documents/${documentId}/update-link-url`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ linkUrl: newUrl.trim() }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        // Immediately update local state for instant UI feedback
        setCurrentUrl(newUrl.trim());
        toast.success("Link URL updated successfully");
        setIsUrlDialogOpen(false);
        setNewUrl("");

        // Track analytics event
        analytics.capture("Document Updated", {
          documentId: documentId,
          url: newUrl.trim(),
          type: "link",
          teamId: teamInfo.currentTeam.id,
          $set: {
            teamId: teamInfo.currentTeam.id,
          },
        });

        // Trigger parent component update if provided
        if (onUrlUpdate) {
          onUrlUpdate();
        }
      } else {
        toast.error(data.message || "Failed to update URL");
      }
    } catch (error) {
      console.error("Error updating URL:", error);
      toast.error("Failed to update URL");
    } finally {
      setIsUpdating(false);
    }
  };

  const openLinkInNewTab = () => {
    if (currentUrl) {
      window.open(currentUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Only render for link documents
  if (primaryVersion.type !== "link") {
    return null;
  }

  return (
    <>
      {/* Compact Icon Trigger */}
      <Dialog open={isMainDialogOpen} onOpenChange={setIsMainDialogOpen}>
        <ButtonTooltip content="View link details">
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="default"
              className="h-8 w-8 p-0 lg:h-9 lg:w-9"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </DialogTrigger>
        </ButtonTooltip>

        {/* Main Status Dialog */}
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Link Details</DialogTitle>
            <DialogDescription>
              View and manage your external link.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* URL Display */}
            <div className="rounded-lg border p-3">
              <div className="mb-1 text-sm font-medium text-muted-foreground">
                Current URL
              </div>
              <div className="break-all font-mono text-sm">{currentUrl}</div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={openLinkInNewTab}
                className="flex-1"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Link
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setNewUrl(currentUrl || "");
                  setIsUrlDialogOpen(true);
                }}
                className="flex-1"
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit URL
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* URL Edit Dialog */}
      <Dialog open={isUrlDialogOpen} onOpenChange={setIsUrlDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Link URL</DialogTitle>
            <DialogDescription>
              Change the URL for this link document.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="link-url">Link URL</Label>
              <Input
                id="link-url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                placeholder="https://example.com/your-link"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                URL must use HTTPS protocol.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUrlDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={updateLinkUrl}
              disabled={isUpdating || !newUrl.trim()}
            >
              {isUpdating ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Updating...
                </>
              ) : (
                "Update URL"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
