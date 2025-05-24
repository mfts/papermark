import { memo, useCallback, useMemo, useState } from "react";

import { TeamContextType } from "@/context/team-context";
import {
  ArchiveXIcon,
  FileIcon,
  FolderIcon,
  FolderInputIcon,
  UndoIcon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import DeleteConfirmationDialog from "@/components/datarooms/trash/delete-confirmation-dialog";
import { useTrashOperations } from "@/components/datarooms/trash/hooks/use-trash-operations";
import TrashDocumentCard from "@/components/datarooms/trash/trash-document-card";
import TrashFolderCard from "@/components/datarooms/trash/trash-folder-card";
import { EmptyDocuments } from "@/components/documents/empty-document";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ButtonTooltip } from "@/components/ui/tooltip";

import { MoveTrashToDataroomFolderModal } from "./trash/move-trash-to-dataroom-modal";
import { TrashItem } from "./trash/types";

const getItemsDisplayText = (documentsCount: number, foldersCount: number) => {
  return `${documentsCount > 0 ? `${documentsCount} document${documentsCount > 1 ? "s" : ""} ` : ""}${documentsCount > 0 && foldersCount > 0 ? "and " : ""}${foldersCount > 0 ? `${foldersCount} folder${foldersCount > 1 ? "s" : ""}` : ""}`;
};

export function DataroomTrashItemsList({
  mixedItems,
  teamInfo,
  dataroomId,
  folderCount,
  documentCount,
  root,
  name,
}: {
  mixedItems: TrashItem[];
  teamInfo: TeamContextType | null;
  dataroomId: string;
  folderCount: number;
  documentCount: number;
  root?: boolean;
  name?: string[];
}) {
  // Selection state
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [moveFolderOpen, setMoveFolderOpen] = useState(false);

  const { handleBulkRestore, handleBulkDelete } = useTrashOperations({
    teamInfo,
    dataroomId,
    root,
    name,
  });

  const selectedDocumentsLength = useMemo(
    () => selectedDocuments && selectedDocuments.length,
    [selectedDocuments],
  );

  const selectedFoldersLength = useMemo(
    () => selectedFolders && selectedFolders.length,
    [selectedFolders],
  );

  const handleRestore = async () => {
    if (selectedDocumentsLength === 0 && selectedFoldersLength === 0) {
      toast.error("No items selected");
      return;
    }

    const items = [
      ...selectedDocuments.map((id) => ({ id, type: "document" as const })),
      ...selectedFolders.map((id) => ({ id, type: "folder" as const })),
    ];

    handleBulkRestore(items, {
      onSuccess: () => {
        setSelectedDocuments([]);
        setSelectedFolders([]);
      },
    });
  };

  const handleDelete = async () => {
    const items = [
      ...selectedDocuments.map((id) => ({ id, type: "document" as const })),
      ...selectedFolders.map((id) => ({ id, type: "folder" as const })),
    ];

    handleBulkDelete(items, {
      onSuccess: () => {
        setSelectedDocuments([]);
        setSelectedFolders([]);
        setShowDeleteDialog(false);
      },
    });
  };

  const handleSelect = useCallback(
    (id: string, type: "DATAROOM_DOCUMENT" | "DATAROOM_FOLDER") => {
      if (type === "DATAROOM_FOLDER") {
        setSelectedFolders((prev) =>
          prev.includes(id)
            ? prev.filter((folderId) => folderId !== id)
            : [...prev, id],
        );
      } else {
        setSelectedDocuments((prev) =>
          prev.includes(id)
            ? prev.filter((docId) => docId !== id)
            : [...prev, id],
        );
      }
    },
    [],
  );

  const resetSelection = () => {
    setSelectedDocuments([]);
    setSelectedFolders([]);
  };

  const renderItem = (item: TrashItem) => {
    const isSelected =
      item.itemType === "DATAROOM_FOLDER"
        ? selectedFolders.includes(item.id)
        : selectedDocuments.includes(item.id);

    return (
      <li
        key={item.id}
        className={cn(
          "group relative transition-all duration-100",
          isSelected ? "rounded-lg ring-2 ring-black dark:ring-gray-100" : "",
        )}
        onMouseEnter={() => setHoveredItem(item.id)}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <div
          className={cn(
            "absolute left-4 top-6 z-[49] hidden items-center justify-center group-hover:flex sm:left-6 sm:top-7",
            isSelected ? "flex" : "",
          )}
        >
          <Checkbox
            className="h-6 w-6"
            checked={isSelected}
            onCheckedChange={() => handleSelect(item.id, item.itemType)}
          />
        </div>
        {item.itemType === "DATAROOM_FOLDER" ? (
          <TrashFolderCard
            item={item}
            teamInfo={teamInfo}
            dataroomId={dataroomId}
            isSelected={isSelected}
            isHovered={hoveredItem === item.id}
            root={root}
          />
        ) : (
          <TrashDocumentCard
            item={item}
            teamInfo={teamInfo}
            dataroomId={dataroomId}
            isSelected={isSelected}
            isHovered={hoveredItem === item.id}
            root={root}
          />
        )}
      </li>
    );
  };

  const HeaderContent = memo(() => {
    if (selectedDocumentsLength > 0 || selectedFoldersLength > 0) {
      const totalItems = folderCount + documentCount;
      const isAllSelected =
        totalItems === selectedDocumentsLength + selectedFoldersLength;

      const handleSelectAll = () => {
        if (isAllSelected) {
          resetSelection();
        } else {
          const allDocumentIds = mixedItems
            .filter((item) => item.itemType === "DATAROOM_DOCUMENT")
            .map((doc) => doc.id);
          const allFolderIds = mixedItems
            .filter((item) => item.itemType === "DATAROOM_FOLDER")
            .map((folder) => folder.id);
          setSelectedDocuments(allDocumentIds);
          setSelectedFolders(allFolderIds);
        }
      };

      return (
        <div className="mb-2 flex items-center gap-x-1 rounded-3xl bg-gray-100 text-sm text-foreground dark:bg-gray-800">
          <div className="ml-5 flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-200 hover:dark:bg-gray-700">
            <ButtonTooltip
              content={isAllSelected ? "Deselect all" : "Select all"}
            >
              <Checkbox
                id="select-all"
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
                className="h-5 w-5"
                aria-label={isAllSelected ? "Deselect all" : "Select all"}
              />
            </ButtonTooltip>
          </div>
          <ButtonTooltip content="Clear selection">
            <Button
              onClick={resetSelection}
              className="mx-1.5 my-1 size-8 rounded-full hover:bg-gray-200 hover:dark:bg-gray-700"
              variant="ghost"
              size="icon"
            >
              <XIcon className="h-5 w-5" />
            </Button>
          </ButtonTooltip>
          {selectedDocumentsLength ? (
            <div className="mr-2 tabular-nums">
              {selectedDocumentsLength} document
              {selectedDocumentsLength > 1 ? "s" : ""} selected
            </div>
          ) : null}
          {selectedFoldersLength ? (
            <div className="mr-2 tabular-nums">
              {selectedFoldersLength} folder
              {selectedFoldersLength > 1 ? "s" : ""} selected
            </div>
          ) : null}
          <ButtonTooltip content="Restore items">
            <Button
              className="mx-1.5 my-1 size-8 rounded-full hover:bg-gray-200 hover:dark:bg-gray-700"
              variant="ghost"
              size="icon"
              onClick={handleRestore}
              disabled={
                selectedDocumentsLength === 0 && selectedFoldersLength === 0
              }
            >
              <UndoIcon className="h-5 w-5" />
            </Button>
          </ButtonTooltip>
          <ButtonTooltip content="Move to folder">
            <Button
              className="mx-1.5 my-1 size-8 rounded-full hover:bg-gray-200 hover:dark:bg-gray-700"
              variant="ghost"
              size="icon"
              onClick={() => setMoveFolderOpen(true)}
              disabled={
                selectedDocumentsLength === 0 && selectedFoldersLength === 0
              }
            >
              <FolderInputIcon className="h-5 w-5" />
            </Button>
          </ButtonTooltip>
          <ButtonTooltip content="Delete permanently">
            <Button
              className="mx-1.5 my-1 size-8 rounded-full hover:bg-destructive hover:text-destructive-foreground"
              variant="ghost"
              size="icon"
              onClick={() => setShowDeleteDialog(true)}
              disabled={
                selectedDocumentsLength === 0 && selectedFoldersLength === 0
              }
            >
              <ArchiveXIcon className="h-5 w-5" />
            </Button>
          </ButtonTooltip>
        </div>
      );
    } else {
      return (
        <div className="mb-2 flex min-h-10 items-center gap-x-2">
          {folderCount > 0 ? (
            <p className="flex items-center gap-x-1 text-sm text-gray-400">
              <FolderIcon className="h-5 w-5" />
              <span>
                {folderCount} folder{folderCount > 1 ? "s" : ""}
              </span>
            </p>
          ) : null}
          {documentCount > 0 ? (
            <p className="flex items-center gap-x-1 text-sm text-gray-400">
              <FileIcon className="h-5 w-5" />
              <span>
                {documentCount} document{documentCount > 1 ? "s" : ""}
              </span>
            </p>
          ) : null}
        </div>
      );
    }
  });
  HeaderContent.displayName = "HeaderContent";

  return (
    <>
      <div>
        <div id="documents-header-count">
          <HeaderContent />
        </div>
        <ul role="list" className="space-y-4">
          {mixedItems.map(renderItem)}
        </ul>
        {mixedItems.length === 0 && (
          <div className="flex h-full justify-center">
            <EmptyDocuments trash />
          </div>
        )}
      </div>

      <DeleteConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        itemType={selectedFoldersLength > 0 ? "folder" : "document"}
        itemName={getItemsDisplayText(
          selectedDocumentsLength,
          selectedFoldersLength,
        )}
      />

      {moveFolderOpen ? (
        <MoveTrashToDataroomFolderModal
          open={moveFolderOpen}
          setOpen={setMoveFolderOpen}
          dataroomId={dataroomId}
          folderIds={selectedFolders}
          documentIds={selectedDocuments}
          setSelectedDocuments={setSelectedDocuments}
          setSelectedFoldersId={setSelectedFolders}
          itemName={getItemsDisplayText(
            selectedDocumentsLength,
            selectedFoldersLength,
          )}
          root={root}
          name={name}
        />
      ) : null}
    </>
  );
}
