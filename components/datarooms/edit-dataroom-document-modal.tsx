import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import { mutate } from "swr";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EditDataroomDocumentModal({
  open,
  setOpen,
  documentId,
  documentName,
  dataroomId,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  documentId: string;
  documentName: string;
  dataroomId: string;
}) {
  const [name, setName] = useState<string>(documentName);
  const [loading, setLoading] = useState<boolean>(false);

  const teamInfo = useTeam();
  const router = useRouter();
  const currentFolderPath = router.query.name as string[] | undefined;

  const editDocumentNameSchema = z.object({
    name: z
      .string()
      .min(1, {
        message: "Please provide a document name.",
      })
      .max(255, {
        message: "Document name is too long.",
      }),
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();

    const validation = editDocumentNameSchema.safeParse({ name });
    if (!validation.success) {
      return toast.error(validation.error.errors[0].message);
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/documents/${documentId}/update-name`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name.trim(),
          }),
        },
      );

      if (!response.ok) {
        const { error, message } = await response.json();
        setLoading(false);
        toast.error(error || message || "Failed to update document name");
        return;
      }

      toast.success("Document name updated successfully!");

      // Revalidate the dataroom documents cache
      mutate(
        `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/documents`,
      );
      // Revalidate folder documents if the document is in a folder
      if (currentFolderPath) {
        mutate(
          `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/folders/documents/${currentFolderPath.join("/")}`,
        );
      }
      // Revalidate the dataroom folders tree for sidebar
      mutate(
        `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/folders?tree=true`,
      );
    } catch (error) {
      setLoading(false);
      toast.error("Error updating document name. Please try again.");
      return;
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>Rename Document</DialogTitle>
          <DialogDescription>Enter a new document name.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Label htmlFor="document-name-update" className="opacity-80">
            Document Name
          </Label>
          <Input
            id="document-name-update"
            value={name}
            placeholder="document-name"
            className="mb-4 mt-1 w-full"
            onChange={(e) => setName(e.target.value)}
          />
          <DialogFooter>
            <Button type="submit" className="h-9 w-full" loading={loading}>
              Update name
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
