import React, { useEffect, useState } from "react";

import { CircleHelpIcon, FolderIcon } from "lucide-react";
import { motion } from "motion/react";

import { FADE_IN_ANIMATION_SETTINGS } from "@/lib/constants";

import { SidebarFolderTreeSelection as DataroomFolderTree } from "@/components/datarooms/folders";
import { TSelectedFolder } from "@/components/documents/move-folder-modal";
import { SidebarFolderTreeSelection as AllDocFolderTree } from "@/components/sidebar-folders";
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
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { BadgeTooltip } from "@/components/ui/tooltip";

import { DEFAULT_LINK_TYPE } from "..";
import LinkItem from "../link-item";
import { LinkUpgradeOptions } from "../link-options";

function FolderSelectionModal({
  open,
  setOpen,
  dataroomId,
  handleSelectFolder,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dataroomId: string;
  handleSelectFolder: (selectedFolder: TSelectedFolder) => void;
}) {
  const [selectedFolder, setSelectedFolder] = useState<TSelectedFolder | null>(
    null,
  );

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    event.stopPropagation();
    handleSelectFolder(selectedFolder);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className="flex">
          <div className="flex w-full cursor-pointer rounded-md border border-input bg-white text-foreground placeholder-muted-foreground focus:border-muted-foreground focus:outline-none focus:ring-inset focus:ring-muted-foreground dark:border-gray-500 dark:bg-gray-800 focus:dark:bg-transparent sm:text-sm">
            <div className="flex w-full items-center px-3 py-2">
              {selectedFolder ? (
                <span className="flex items-center gap-1">
                  <FolderIcon className="h-4 w-4" /> {selectedFolder.name}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Optionally, select folder
                </span>
              )}
            </div>
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader className="text-start">
          <DialogTitle>Select Folder</DialogTitle>
          <DialogDescription>
            Select folder location to upload file.
          </DialogDescription>
        </DialogHeader>
        <form>
          <div className="mb-2 max-h-[75vh] overflow-y-scroll">
            {dataroomId && dataroomId !== "all_documents" ? (
              <DataroomFolderTree
                dataroomId={dataroomId}
                selectedFolder={selectedFolder}
                setSelectedFolder={setSelectedFolder}
              />
            ) : (
              <AllDocFolderTree
                selectedFolder={selectedFolder}
                setSelectedFolder={setSelectedFolder}
              />
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={handleSubmit}
              className="flex h-9 w-full gap-1"
              disabled={!selectedFolder}
            >
              {!selectedFolder ? (
                "Select a folder"
              ) : (
                <>
                  Select{" "}
                  <span className="font-medium">{selectedFolder.name}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function UploadSection({
  data,
  setData,
  isAllowed,
  handleUpgradeStateChange,
  targetId,
}: {
  data: DEFAULT_LINK_TYPE;
  setData: React.Dispatch<React.SetStateAction<DEFAULT_LINK_TYPE>>;
  isAllowed: boolean;
  handleUpgradeStateChange: ({
    state,
    trigger,
    plan,
  }: LinkUpgradeOptions) => void;
  targetId: string;
}) {
  const { enableUpload, isFileRequestOnly, uploadFolderId } = data;
  const [enabled, setEnabled] = useState<boolean>(false);
  const [selectedFolder, setSelectedFolder] = useState<TSelectedFolder>(null);

  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    setEnabled(enableUpload!);
  }, [enableUpload]);

  const handleUpload = async () => {
    const updatedUpload = !enabled;

    setData({
      ...data,
      enableUpload: updatedUpload,
    });
    setEnabled(updatedUpload);
  };

  const handleFileRequestToggle = (checked: boolean): void => {
    setData({
      ...data,
      isFileRequestOnly: checked,
    });
  };

  const handleSelectFolder = (selectedFolder: TSelectedFolder): void => {
    setSelectedFolder(selectedFolder);
    setData({
      ...data,
      uploadFolderId: selectedFolder?.id ?? null,
    });
  };

  return (
    <div className="pb-5">
      <LinkItem
        title="Enable file requests"
        tooltipContent="Visitors can upload files to the dataroom."
        enabled={enabled}
        action={handleUpload}
        isAllowed={isAllowed}
        requiredPlan="datarooms"
        upgradeAction={() =>
          handleUpgradeStateChange({
            state: true,
            trigger: "link_sheet_upload_section",
            plan: "Data Rooms",
          })
        }
      />

      {enabled && (
        <motion.div
          className="relative mt-4 space-y-3"
          {...FADE_IN_ANIMATION_SETTINGS}
        >
          <div className="flex w-full flex-col items-start gap-6 overflow-x-visible pb-4 pt-0">
            <div className="w-full space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="file-request-mode"
                  checked={isFileRequestOnly}
                  onCheckedChange={handleFileRequestToggle}
                />
                <Label htmlFor="file-request-mode">
                  File request only mode
                </Label>
              </div>

              <div className="space-y-4">
                <Label
                  htmlFor="link-folder"
                  className="flex items-center gap-2"
                >
                  <span>Folder for uploaded file</span>
                  <BadgeTooltip content="This is the folder that will be used to store uploaded files. If you don't select a folder, the files will be stored in the All Documents.">
                    <CircleHelpIcon className="h-4 w-4 shrink-0 text-muted-foreground hover:text-foreground" />
                  </BadgeTooltip>
                </Label>
                <FolderSelectionModal
                  open={open}
                  setOpen={setOpen}
                  dataroomId={targetId}
                  handleSelectFolder={handleSelectFolder}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
