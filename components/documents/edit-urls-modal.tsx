import { FormEvent } from "react";

import { useTeam } from "@/context/team-context";
import { mutate } from "swr";

import { useUrlDocument } from "@/lib/hooks/urls/use-url-document";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UrlInput } from "@/components/ui/url-input";

interface EditUrlsModalProps {
  documentId: string;
  currentUrls: string[];
  documentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUrlsModal({
  documentId,
  currentUrls,
  documentName,
  open,
  onOpenChange,
}: EditUrlsModalProps) {
  const teamInfo = useTeam();

  const {
    urls,
    invalidUrls,
    handleUrlChange,
    uploading: isLoading,
    updateUrlDocument,
    resetAll,
    isUrlInputValid,
  } = useUrlDocument({
    initialUrls: currentUrls,
    documentId,
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const success = await updateUrlDocument();
    if (success) {
      mutate(`/api/teams/${teamInfo?.currentTeam?.id}/documents/${documentId}`);
      onOpenChange(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    if (!open) {
      resetAll();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit URLs</DialogTitle>
          <DialogDescription>
            Update the URLs for &quot;{documentName}&quot;. Enter one URL per
            line.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="pb-4">
            <UrlInput
              value={urls}
              onChange={handleUrlChange}
              invalidUrls={invalidUrls}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !isUrlInputValid()}
              loading={isLoading}
            >
              {isLoading ? "Updating..." : "Update URLs"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
