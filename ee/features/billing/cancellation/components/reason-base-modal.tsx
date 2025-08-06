import { ArrowLeftIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Modal } from "@/components/ui/modal";

export function CancellationBaseModal({
  open,
  onOpenChange,
  children,
  title,
  description,
  onBack,
  onDecline,
  onConfirm,
  confirmButton,
  showKeepButton,
  cancelButton,
  proceedButton,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title: string;
  description: string;
  onBack?: () => void;
  onDecline?: () => void;
  onConfirm?: () => void;
  confirmButton?: React.ReactNode;
  showKeepButton?: boolean;
  cancelButton?: React.ReactNode;
  proceedButton?: React.ReactNode;
}) {
  return (
    <Modal
      showModal={open}
      setShowModal={(show: boolean | ((prev: boolean) => boolean)) => {
        if (typeof show === "function") {
          onOpenChange(show(open));
        } else {
          onOpenChange(show);
        }
      }}
      className="max-w-lg"
    >
      <div className="flex flex-col items-center justify-center space-y-2 border-b border-border bg-white px-4 py-4 pt-8 dark:border-gray-900 dark:bg-gray-900 sm:px-8">
        <DialogTitle className="text-2xl font-semibold">{title}</DialogTitle>
        <DialogDescription className="max-w-md text-center text-base text-muted-foreground">
          {description}
        </DialogDescription>
      </div>
      <div className="space-y-6 bg-white px-4 py-6 dark:bg-gray-900 sm:px-8">
        <div className="space-y-6">{children}</div>
        <div className="flex items-center justify-between border-t pt-4">
          {cancelButton}
          {proceedButton}
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="flex items-center gap-2"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </Button>
          )}
          {showKeepButton && (
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-2"
            >
              Stay on Papermark
            </Button>
          )}
          {onDecline && (
            <Button variant="outline" onClick={onDecline}>
              Decline offer
            </Button>
          )}
          {confirmButton}
        </div>
      </div>
    </Modal>
  );
}
