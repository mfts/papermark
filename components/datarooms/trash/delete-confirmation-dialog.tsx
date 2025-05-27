import { useState } from "react";

import { cn } from "@/lib/utils";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemType: "document" | "folder";
  itemName: string;
}

export default function DeleteConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  itemType,
  itemName,
}: DeleteConfirmationDialogProps) {
  const [inputValue, setInputValue] = useState("");
  const requiredText = "permanently delete";
  const isInputValid = inputValue === requiredText;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isInputValid) {
      onConfirm();
      setInputValue("");
    }
  };

  const handleCancel = () => {
    setInputValue("");
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="space-y-3">
          <AlertDialogTitle className="text-xl">Delete item</AlertDialogTitle>
          <AlertDialogDescription className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <div className="h-1.5 w-1.5 rounded-full bg-destructive/70" />
                <p>
                  This will permanently delete{" "}
                  {itemType === "folder" ? "the folder" : "the document"}
                </p>
              </div>
              <div className="overflow-hidden rounded-lg border bg-muted/30 transition-colors hover:bg-muted/50">
                <div className="border-b px-3 py-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {itemName}
                  </p>
                </div>
                {itemType === "folder" && (
                  <div className="px-3 py-1.5">
                    <p className="text-xs text-muted-foreground">
                      All contents within this folder will also be deleted
                    </p>
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} id="delete-confirmation-form">
              <div className="space-y-3">
                <label
                  htmlFor="verification"
                  className="text-sm text-muted-foreground"
                >
                  Type{" "}
                  <span className="font-medium text-foreground">
                    permanently delete
                  </span>{" "}
                  to confirm
                </label>
                <Input
                  type="text"
                  name="verification"
                  id="verification"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  pattern={requiredText}
                  required
                  autoComplete="off"
                  placeholder="Type to confirm..."
                  aria-label="Type 'permanently delete' to confirm deletion"
                  aria-describedby="verification-help verification-instructions"
                  aria-invalid={inputValue.length > 0 && !isInputValid}
                  className={cn(
                    "bg-white transition-colors dark:border-gray-500 dark:bg-gray-800 focus:dark:bg-transparent",
                    isInputValid && "border-green-500 dark:border-green-500",
                    !isInputValid && inputValue.length > 0 && "border-red-500 dark:border-red-500",
                  )}
                />
                <div
                  id="verification-help"
                  className="text-xs text-muted-foreground"
                >
                  You must type exactly "{requiredText}" to enable the delete button.
                </div>
              </div>
            </form>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-2">
          <AlertDialogCancel onClick={handleCancel} className="mt-0">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            type="submit"
            form="delete-confirmation-form"
            disabled={!isInputValid}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:pointer-events-none disabled:opacity-50"
          >
            Delete Permanently
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
