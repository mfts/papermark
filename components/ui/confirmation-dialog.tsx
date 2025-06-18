import React from "react";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  confirmText?: string;
  cancelText?: string;
  totalFiles?: number;
  totalFolders?: number;
  loading?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  confirmText = "Confirm",
  cancelText = "Cancel",
  totalFiles,
  totalFolders,
  loading,
}: ConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {totalFiles !== undefined || totalFolders !== undefined ? (
              <>
                You have selected{" "}
                {totalFiles && totalFiles > 0 ? (
                  <span className="font-medium text-primary">
                    {totalFiles} file{totalFiles !== 1 ? "s" : ""}
                  </span>
                ) : null}
                {totalFiles &&
                totalFiles > 0 &&
                totalFolders &&
                totalFolders > 0
                  ? " and "
                  : null}
                {totalFolders && totalFolders > 0 ? (
                  <span className="font-medium text-primary">
                    {totalFolders} folder{totalFolders !== 1 ? "s" : ""}
                  </span>
                ) : null}
                {totalFiles === 0 && totalFolders === 0 ? "nothing" : null}. Are
                you sure you want to upload?
              </>
            ) : (
              <>Are you sure you want to proceed?</>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {cancelText}
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {loading ? "Uploading..." : confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
