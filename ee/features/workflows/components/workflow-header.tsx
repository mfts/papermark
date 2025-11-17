import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "sonner";
import { z } from "zod";
import { TrashIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface WorkflowHeaderProps {
  workflowId: string;
  teamId: string;
  name: string;
  description: string | null;
  isActive: boolean;
  entryUrl: string;
  onUpdate: () => void;
}

export function WorkflowHeader({
  workflowId,
  teamId,
  name,
  description,
  isActive,
  entryUrl,
  onUpdate,
}: WorkflowHeaderProps) {
  const router = useRouter();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleActive = async () => {
    // Validate IDs to prevent SSRF
    const workflowIdValidation = z.string().cuid().safeParse(workflowId);
    const teamIdValidation = z.string().cuid().safeParse(teamId);
    if (!workflowIdValidation.success || !teamIdValidation.success) {
      toast.error("Invalid workflow or team ID");
      return;
    }

    try {
      const response = await fetch(`/api/workflows/${workflowId}?teamId=${teamId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          isActive: !isActive,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update workflow");
      }

      onUpdate();
      toast.success(isActive ? "Workflow deactivated" : "Workflow activated");
    } catch (error) {
      toast.error("Failed to update workflow");
    }
  };

  const handleDeleteWorkflow = async () => {
    // Validate IDs to prevent SSRF
    const workflowIdValidation = z.string().cuid().safeParse(workflowId);
    const teamIdValidation = z.string().cuid().safeParse(teamId);
    if (!workflowIdValidation.success || !teamIdValidation.success) {
      toast.error("Invalid workflow or team ID");
      setShowDeleteDialog(false);
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/workflows/${workflowId}?teamId=${teamId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete workflow");
      }

      toast.success("Workflow deleted");
      router.push("/workflows");
    } catch (error) {
      toast.error("Failed to delete workflow");
      setIsDeleting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {name}
            </h1>
            {description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="active-toggle" className="text-sm">
                {isActive ? "Active" : "Inactive"}
              </Label>
              <Switch
                id="active-toggle"
                checked={isActive}
                onCheckedChange={handleToggleActive}
              />
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>

        {/* Entry Link */}
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-sm font-medium">Entry Link</h3>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 rounded bg-muted px-3 py-2 text-sm">
              {entryUrl}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(entryUrl)}
            >
              <CopyIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Workflow</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this workflow? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteWorkflow}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Workflow"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

