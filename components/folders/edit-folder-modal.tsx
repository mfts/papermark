import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import { mutate } from "swr";
import { z } from "zod";

import {
  DEFAULT_FOLDER_COLOR,
  DEFAULT_FOLDER_ICON,
  FolderColorId,
  FolderIconId,
} from "@/lib/constants/folder-constants";
import { useAnalytics } from "@/lib/analytics";

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

import { FolderIconColorPicker } from "./folder-icon-picker";

export function EditFolderModal({
  open,
  setOpen,
  name,
  folderId,
  icon,
  color,
  onAddition,
  isDataroom,
  dataroomId,
  children,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  name: string;
  folderId: string;
  icon?: string | null;
  color?: string | null;
  onAddition?: (folderName: string) => void;
  isDataroom?: boolean;
  dataroomId?: string;
  children?: React.ReactNode;
}) {
  const [folderName, setFolderName] = useState<string>(name);
  const [folderIcon, setFolderIcon] = useState<FolderIconId>(
    (icon as FolderIconId) || DEFAULT_FOLDER_ICON,
  );
  const [folderColor, setFolderColor] = useState<FolderColorId>(
    (color as FolderColorId) || DEFAULT_FOLDER_COLOR,
  );
  const [loading, setLoading] = useState<boolean>(false);

  const teamInfo = useTeam();
  const analytics = useAnalytics();

  // Reset state when modal opens with new folder data
  useEffect(() => {
    if (open) {
      setFolderName(name);
      setFolderIcon((icon as FolderIconId) || DEFAULT_FOLDER_ICON);
      setFolderColor((color as FolderColorId) || DEFAULT_FOLDER_COLOR);
    }
  }, [open, name, icon, color]);

  const editFolderSchema = z.object({
    name: z
      .string()
      .min(3, {
        message: "Please provide a folder name with at least 3 characters.",
      })
      .max(256, {
        message: "Folder name must be 256 characters or less.",
      }),
  });

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    event.stopPropagation();

    const validation = editFolderSchema.safeParse({ name: folderName });
    if (!validation.success) {
      return toast.error(validation.error.errors[0].message);
    }

    setLoading(true);
    const endpointTargetType =
      isDataroom && dataroomId ? `datarooms/${dataroomId}/folders` : "folders";

    // Determine what fields have changed for analytics
    const changedFields: string[] = [];
    if (folderName.trim() !== name) changedFields.push("name");
    if (folderIcon !== (icon || DEFAULT_FOLDER_ICON)) changedFields.push("icon");
    if (folderColor !== (color || DEFAULT_FOLDER_COLOR)) changedFields.push("color");

    try {
      const response = await fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}/manage`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            folderId: folderId,
            name: folderName.trim(),
            icon: folderIcon,
            color: folderColor,
          }),
        },
      );

      if (!response.ok) {
        const { message } = await response.json();
        setLoading(false);
        toast.error(message);
        return;
      }

      const { parentFolderPath } = await response.json();

      // Track analytics
      if (changedFields.length > 0) {
        analytics.capture("folder_updated", {
          changed: changedFields,
          icon: folderIcon,
          color: folderColor,
          isDataroom,
        });
      }

      toast.success("Folder updated successfully!");

      mutate(`/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}`);
      mutate(
        `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}?root=true`,
      );
      mutate(
        `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}${parentFolderPath}`,
      );
    } catch (error) {
      setLoading(false);
      toast.error("Error updating folder. Please try again.");
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
          <DialogTitle>Edit Folder</DialogTitle>
          <DialogDescription>
            Update your folder name, icon, and color.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <Label htmlFor="folder-name-update" className="opacity-80">
            Folder Name
          </Label>
          <div className="mb-1 mt-1 flex items-center gap-2">
            <FolderIconColorPicker
              iconValue={folderIcon}
              colorValue={folderColor}
              onIconChange={setFolderIcon}
              onColorChange={setFolderColor}
            />
            <Input
              id="folder-name-update"
              value={folderName}
              placeholder="Choose a helpful name"
              className="flex-1"
              maxLength={256}
              onChange={(e) => setFolderName(e.target.value)}
            />
          </div>
          <p className="mb-4 text-xs text-muted-foreground">
            {folderName.length}/256 characters
          </p>

          <DialogFooter>
            <Button type="submit" className="h-9 w-full" loading={loading}>
              Update folder
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
