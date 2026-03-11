import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import { mutate } from "swr";
import { z } from "zod";

import {
  type DataroomFolderDocument,
  type DataroomFolderWithDocuments,
} from "@/lib/swr/use-dataroom";

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

function updateDocNameInDocuments(
  _: null,
  docs: DataroomFolderDocument[] | undefined,
  docId: string,
  newName: string,
): DataroomFolderDocument[] | undefined {
  if (!docs) return docs;
  return docs.map((doc) =>
    doc.document.id === docId
      ? { ...doc, document: { ...doc.document, name: newName } }
      : doc,
  );
}

function updateDocNameInFolderTree(
  _: null,
  folders: DataroomFolderWithDocuments[] | undefined,
  docId: string,
  newName: string,
): DataroomFolderWithDocuments[] | undefined {
  if (!folders) return folders;
  const updateFolder = (
    folder: DataroomFolderWithDocuments,
  ): DataroomFolderWithDocuments => ({
    ...folder,
    documents: (folder.documents ?? []).map((doc) =>
      doc.document.id === docId
        ? { ...doc, document: { ...doc.document, name: newName } }
        : doc,
    ),
    childFolders: (folder.childFolders ?? []).map(updateFolder),
  });
  return folders.map(updateFolder);
}

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

    const trimmedName = name.trim();
    const teamId = teamInfo?.currentTeam?.id;
    const baseKey = `/api/teams/${teamId}/datarooms/${dataroomId}`;

    try {
      const response = await fetch(
        `/api/teams/${teamId}/documents/${documentId}/update-name`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: trimmedName,
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

      mutate(`${baseKey}/documents`, null, {
        populateCache: (_, docs) =>
          updateDocNameInDocuments(_, docs, documentId, trimmedName),
        revalidate: false,
      });

      if (currentFolderPath) {
        mutate(
          `${baseKey}/folders/documents/${currentFolderPath.join("/")}`,
          null,
          {
            populateCache: (_, docs) =>
              updateDocNameInDocuments(_, docs, documentId, trimmedName),
            revalidate: false,
          },
        );
      }

      mutate(`${baseKey}/folders`, null, {
        populateCache: (_, folders) =>
          updateDocNameInFolderTree(_, folders, documentId, trimmedName),
        revalidate: false,
      });
      mutate(`${baseKey}/folders?include_documents=true`, null, {
        populateCache: (_, folders) =>
          updateDocNameInFolderTree(_, folders, documentId, trimmedName),
        revalidate: false,
      });
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
