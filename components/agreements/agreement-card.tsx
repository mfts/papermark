import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { DownloadIcon, FileTextIcon, MoreVertical, TrashIcon } from "lucide-react";
import { toast } from "sonner";

import { AgreementWithLinksCount } from "@/lib/swr/use-agreements";

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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AgreementCardProps {
  agreement: AgreementWithLinksCount;
  onDelete: (id: string) => void;
}

export default function AgreementCard({
  agreement,
  onDelete,
}: AgreementCardProps) {
  const teamInfo = useTeam();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    toast.promise(
      fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/agreements/${agreement.id}`,
        {
          method: "PUT",
        },
      ).then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to delete agreement");
        }
        onDelete(agreement.id);
      }),
      {
        loading: "Deleting agreement...",
        success: "Agreement deleted successfully",
        error: "Failed to delete agreement",
      },
    );
  };

  const handleDownload = async () => {
    toast.promise(
      fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/agreements/${agreement.id}/download`,
        {
          method: "POST",
        },
      ).then(async (response) => {
        if (!response.ok) {
          throw new Error("Failed to download agreement");
        }
        
        // Get the filename from the Content-Disposition header or use default
        const contentDisposition = response.headers.get("Content-Disposition");
        const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/);
        const filename = filenameMatch ? filenameMatch[1] : `${agreement.name}.txt`;
        
        // Create a blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          document.body.removeChild(link);
        }, 100);
      }),
      {
        loading: "Downloading agreement...",
        success: "Agreement downloaded successfully",
        error: "Failed to download agreement",
      },
    );
  };

  return (
    <>
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="flex items-center space-x-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <FileTextIcon className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-medium">{agreement.name}</h3>
            <p className="text-sm text-muted-foreground">
              Last updated {new Date(agreement.updatedAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-x-2">
          <div className="text-sm text-muted-foreground">
            {agreement._count?.links || 0}{" "}
            {agreement._count?.links === 1 ? "link" : "links"}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDownload}>
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download agreement
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                onClick={() => setShowDeleteDialog(true)}
              >
                <TrashIcon className="mr-2 h-4 w-4" />
                Delete agreement
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the agreement &quot;
              {agreement.name}&quot;. This action cannot be undone.
              <br />
              <br />
              <span className="font-medium">
                Note: If this agreement is still referenced in any documents or
                dataroom links, it will remain available there until those
                references are removed.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
