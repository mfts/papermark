import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import { mutate } from "swr";

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

export function EditDocumentModal({
  open,
  setOpen,
  name,
  documentId,
  onAddition,
  isDataroom,
  dataroomId,
  children,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  name: string;
  documentId: string;
  onAddition?: (documentName: string) => void;
  isDataroom?: boolean;
  dataroomId?: string;
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [documentName, setDocumentName] = useState<string>(name);
  const [loading, setLoading] = useState<boolean>(false);
  const currentFolderPath = router.query.name as string[] | undefined;

  const teamInfo = useTeam();

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    event.stopPropagation();

    if (documentName == "") return;

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
            name: documentName,
          }),
        },
      );

      if (!response.ok) {
        const { message } = await response.json();
        setLoading(false);
        toast.error(message);
        return;
      }
      const endpointTargetType =
        isDataroom && dataroomId ? `/datarooms/${dataroomId}` : "";

      const endpoint = currentFolderPath
        ? `/folders/documents/${currentFolderPath.join("/")}`
        : "/documents";
      console.log(
        "13213213",
        `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}${endpoint}`,
      );
      toast.success("Document updated successfully! 🎉");
      mutate(
        `/api/teams/${teamInfo?.currentTeam?.id}${endpointTargetType}${endpoint}`,
      );
    } catch (error) {
      setLoading(false);
      toast.error("Error updating Document. Please try again.");
      return;
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>Edit document</DialogTitle>
          <DialogDescription>Enter a new document name.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <Label htmlFor="document-name-update" className="opacity-80">
            Document Name
          </Label>
          <Input
            id="document-name-update"
            value={documentName}
            placeholder="folder-123"
            className="mb-4 mt-1 w-full"
            onChange={(e) => setDocumentName(e.target.value)}
          />
          <DialogFooter>
            <Button type="submit" className="h-9 w-full" loading={loading}>
              Update Document
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
