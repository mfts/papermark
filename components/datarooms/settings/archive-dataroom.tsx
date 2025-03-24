import { useRouter } from "next/router";

import { useState } from "react";

import { ArchiveIcon } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ArchiveDataroomProps {
  dataroomId: string;
  teamId?: string;
  isArchived: boolean;
}

export function ArchiveDataroom({
  dataroomId,
  teamId,
  isArchived,
}: ArchiveDataroomProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const router = useRouter();

  const handleArchive = async () => {
    try {
      setIsArchiving(true);
      const response = await fetch(
        `/api/teams/${teamId}/datarooms/${dataroomId}/archive`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isArchived: !isArchived }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to archive dataroom");
      }

      mutate(`/api/teams/${teamId}/datarooms/${dataroomId}`);

      http: toast.success(
        isArchived
          ? "Dataroom unarchived successfully!"
          : "Dataroom archived successfully!",
      );
      setIsOpen(false);
    } catch (error) {
      toast.error(
        isArchived
          ? "Failed to unarchive dataroom"
          : "Failed to archive dataroom",
      );
      console.error(error);
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <>
      <Card className="border-destructive bg-transparent">
        <CardHeader>
          <CardTitle>Archive Dataroom</CardTitle>
          <CardDescription>
            {isArchived
              ? "Unarchive this dataroom and all its contents. This action will:"
              : "Archive this dataroom and all its contents. This action will:"}
            <ul className="mt-2 list-inside list-disc">
              {isArchived ? (
                <>
                  <li>
                    Unfreeze all{" "}
                    <span className="font-medium">associated links</span>
                  </li>
                  <li>
                    Unfreeze all{" "}
                    <span className="font-medium">associated olders</span>
                  </li>
                  <li>
                    Unfreeze all{" "}
                    <span className="font-medium">associated documents</span>
                  </li>
                  <li>
                    Unfreeze all{" "}
                    <span className="font-medium">associated views</span>
                  </li>
                </>
              ) : (
                <>
                  <li>
                    Freeze all{" "}
                    <span className="font-medium">associated links</span>
                  </li>
                  <li>
                    Prevent document deletion{" "}
                    <span className="font-medium">associated documents</span>
                  </li>
                  <li>
                    Prevent document and folder{" "}
                    <span className="font-medium">associated folders</span>
                  </li>
                  <li>
                    Freeze all{" "}
                    <span className="font-medium">associated views</span>
                  </li>
                </>
              )}
            </ul>
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-end rounded-b-lg border-t px-6 py-3">
          <Button
            variant="destructive"
            onClick={() => setIsOpen(true)}
            className="w-full sm:w-auto"
          >
            <ArchiveIcon className="mr-2 h-4 w-4" />
            {isArchived ? "Unarchive Dataroom" : "Archive Dataroom"}
          </Button>
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="border-destructive bg-transparent">
          <DialogHeader>
            <DialogTitle>
              {isArchived ? "Unarchive Dataroom" : "Archive Dataroom"}
            </DialogTitle>
            <DialogDescription>
              {isArchived
                ? "Are you sure you want to unarchive this dataroom? This action will:"
                : "Are you sure you want to archive this dataroom? This action will:"}
              <ul className="mt-2 list-inside list-disc">
                {isArchived ? (
                  <>
                    <li>
                      Unfreeze all{" "}
                      <span className="font-medium">associated links</span>
                    </li>
                    <li>
                      Unfreeze all{" "}
                      <span className="font-medium">associated folders</span>
                    </li>
                    <li>
                      Unfreeze all{" "}
                      <span className="font-medium">associated documents</span>
                    </li>
                    <li>
                      Unfreeze all{" "}
                      <span className="font-medium">associated views</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      Freeze all{" "}
                      <span className="font-medium">associated links</span>
                    </li>
                    <li>
                      Prevent document deletion{" "}
                      <span className="font-medium">associated documents</span>
                    </li>
                    <li>
                      Prevent document and folder{" "}
                      <span className="font-medium">movement</span>
                    </li>
                    <li>
                      Freeze all{" "}
                      <span className="font-medium">associated views</span>
                    </li>
                  </>
                )}
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isArchiving}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleArchive}
              disabled={isArchiving}
            >
              {isArchiving
                ? isArchived
                  ? "Unarchiving..."
                  : "Archiving..."
                : isArchived
                  ? "Unarchive"
                  : "Yes, Archive Dataroom"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
