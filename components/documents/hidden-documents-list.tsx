import { memo, useCallback, useMemo, useState } from "react";
import React from "react";

import { TeamContextType } from "@/context/team-context";
import {
  EyeIcon,
  FileIcon,
  FolderIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

import { FolderWithCount } from "@/lib/swr/use-documents";
import { DocumentWithLinksAndLinkCountAndViewCount } from "@/lib/types";

import { Skeleton } from "@/components/ui/skeleton";

import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { Portal } from "../ui/portal";
import { ButtonTooltip } from "../ui/tooltip";
import { useDeleteDocumentsAndFoldersModal } from "./actions/delete-documents-modal";
import { useDeleteFolderModal } from "./actions/delete-folder-modal";
import { HiddenDocumentCard } from "./hidden-document-card";
import { HiddenFolderCard } from "./hidden-folder-card";

export function HiddenDocumentsList({
  folders,
  documents,
  teamInfo,
  loading,
  foldersLoading,
}: {
  folders: FolderWithCount[] | undefined;
  documents: DocumentWithLinksAndLinkCountAndViewCount[] | undefined;
  teamInfo: TeamContextType | null;
  loading: boolean;
  foldersLoading: boolean;
}) {
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [isUnhiding, setIsUnhiding] = useState(false);

  const { setDeleteModalOpen, setFolderToDelete, DeleteFolderModal } =
    useDeleteFolderModal(teamInfo);

  const handleDeleteFolder = useCallback(
    (folderId: string) => {
      const folderToDelete = folders?.find((f) => f.id === folderId);
      if (folderToDelete) {
        setFolderToDelete(folderToDelete);
        setDeleteModalOpen(true);
        setSelectedFolders((prev) => prev.filter((id) => id !== folderId));
      }
    },
    [folders, setFolderToDelete, setDeleteModalOpen, setSelectedFolders],
  );

  const { setShowDeleteItemsModal, DeleteItemsModal } =
    useDeleteDocumentsAndFoldersModal({
      documentIds: selectedDocuments,
      setSelectedDocuments,
      folderIds: selectedFolders,
      setSelectedFolder: setSelectedFolders,
    });

  const totalSelectedItem = [...selectedDocuments, ...selectedFolders].length;

  const selectedDocumentsLength = useMemo(
    () => selectedDocuments && selectedDocuments.length,
    [selectedDocuments],
  );

  const selectedFoldersLength = useMemo(
    () => selectedFolders && selectedFolders.length,
    [selectedFolders],
  );

  const handleSelect = useCallback(
    (id: string, type: "document" | "folder") => {
      if (type === "folder") {
        setSelectedFolders((prev) =>
          prev.includes(id)
            ? prev.filter((docId) => docId !== id)
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

  const handleBulkUnhide = useCallback(async () => {
    if (selectedDocuments.length === 0 && selectedFolders.length === 0) return;

    setIsUnhiding(true);

    try {
      const promises: Promise<Response>[] = [];

      // Unhide documents
      if (selectedDocuments.length > 0) {
        promises.push(
          fetch(`/api/teams/${teamInfo?.currentTeam?.id}/documents/hide`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              documentIds: selectedDocuments,
              hidden: false,
            }),
          }),
        );
      }

      // Unhide folders (cascades to children)
      if (selectedFolders.length > 0) {
        promises.push(
          fetch(`/api/teams/${teamInfo?.currentTeam?.id}/folders/hide`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              folderIds: selectedFolders,
              hidden: false,
            }),
          }),
        );
      }

      const results = await Promise.all(promises);

      // Check for errors
      for (const res of results) {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Failed to unhide items");
        }
      }

      // Revalidate data
      mutate(`/api/teams/${teamInfo?.currentTeam?.id}/folders?root=true`);
      mutate(`/api/teams/${teamInfo?.currentTeam?.id}/folders`);
      mutate(`/api/teams/${teamInfo?.currentTeam?.id}/documents`);
      mutate(`/api/teams/${teamInfo?.currentTeam?.id}/documents/hidden`);

      // Reset selection
      setSelectedDocuments([]);
      setSelectedFolders([]);

      toast.success(
        `Successfully unhidden ${selectedDocuments.length > 0 ? `${selectedDocuments.length} document${selectedDocuments.length > 1 ? "s" : ""}` : ""}${selectedDocuments.length > 0 && selectedFolders.length > 0 ? " and " : ""}${selectedFolders.length > 0 ? `${selectedFolders.length} folder${selectedFolders.length > 1 ? "s" : ""}` : ""}`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to unhide items",
      );
    } finally {
      setIsUnhiding(false);
    }
  }, [selectedDocuments, selectedFolders, teamInfo?.currentTeam?.id]);

  const HeaderContent = memo(() => {
    if (selectedDocumentsLength > 0 || selectedFoldersLength > 0) {
      const totalItems = (documents?.length || 0) + (folders?.length || 0);
      const isAllSelected = totalItems === totalSelectedItem;

      const handleSelectAll = () => {
        if (isAllSelected) {
          setSelectedDocuments([]);
          setSelectedFolders([]);
        } else {
          const allDocumentIds = documents?.map((doc) => doc.id) || [];
          const allFolderIds = folders?.map((folder) => folder.id) || [];
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
          <ButtonTooltip content="Unhide (Show in All Documents)">
            <Button
              onClick={handleBulkUnhide}
              disabled={isUnhiding}
              className="mx-1.5 my-1 size-8 rounded-full hover:bg-gray-200 hover:dark:bg-gray-700"
              variant="ghost"
              size="icon"
            >
              <EyeIcon className="h-5 w-5" />
            </Button>
          </ButtonTooltip>
          <ButtonTooltip content="Delete">
            <Button
              onClick={() => setShowDeleteItemsModal(true)}
              className="mx-1.5 my-1 size-8 rounded-full hover:bg-destructive hover:text-destructive-foreground"
              variant="ghost"
              size="icon"
            >
              <Trash2Icon className="h-5 w-5" />
            </Button>
          </ButtonTooltip>
        </div>
      );
    } else {
      return (
        <div className="mb-2 flex items-center gap-x-2 pt-5">
          {folders && folders.length > 0 && (
            <p className="flex items-center gap-x-1 text-sm text-gray-400">
              <FolderIcon className="h-5 w-5" />
              <span>
                {folders.length} folder{folders.length > 1 ? "s" : ""}
              </span>
            </p>
          )}
          {documents && documents.length > 0 && (
            <p className="flex items-center gap-x-1 text-sm text-gray-400">
              <FileIcon className="h-5 w-5" />
              <span>
                {documents.length} document{documents.length > 1 ? "s" : ""}
              </span>
            </p>
          )}
        </div>
      );
    }
  });
  HeaderContent.displayName = "HeaderContent";

  const isEmpty =
    !loading &&
    !foldersLoading &&
    (!documents || documents.length === 0) &&
    (!folders || folders.length === 0);

  return (
    <>
      <div className="space-y-4">
        {/* Folders list */}
        <ul role="list" className="space-y-4">
          {folders && !foldersLoading
            ? folders.map((folder) => {
                const isSelected = selectedFolders.includes(folder.id);
                return (
                  <li key={folder.id}>
                    <HiddenFolderCard
                      folder={folder}
                      teamInfo={teamInfo}
                      isSelected={isSelected}
                      onSelect={() => handleSelect(folder.id, "folder")}
                      onDelete={handleDeleteFolder}
                    />
                  </li>
                );
              })
            : foldersLoading &&
              Array.from({ length: 2 }).map((_, i) => (
                <li
                  key={i}
                  className="relative flex w-full items-center space-x-3 rounded-lg border px-4 py-5 sm:px-6 lg:px-6"
                >
                  <Skeleton className="h-9 w-9" />
                  <div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-2 h-3 w-12" />
                  </div>
                  <Skeleton className="absolute right-5 top-[50%] h-5 w-20 -translate-y-[50%] transform" />
                </li>
              ))}
        </ul>

        {/* Documents list */}
        <ul role="list" className="space-y-4">
          {documents && !loading
            ? documents.map((document) => {
                const isSelected = selectedDocuments.includes(document.id);
                return (
                  <li key={document.id}>
                    <HiddenDocumentCard
                      document={document}
                      teamInfo={teamInfo}
                      isSelected={isSelected}
                      onSelect={() => handleSelect(document.id, "document")}
                    />
                  </li>
                );
              })
            : loading &&
              Array.from({ length: 3 }).map((_, i) => (
                <li
                  key={i}
                  className="relative flex w-full items-center space-x-3 rounded-lg border px-4 py-5 sm:px-6 lg:px-6"
                >
                  <Skeleton className="h-9 w-9" />
                  <div>
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="mt-2 h-3 w-12" />
                  </div>
                  <Skeleton className="absolute right-5 top-[50%] h-5 w-20 -translate-y-[50%] transform" />
                </li>
              ))}
        </ul>

        <Portal containerId={"documents-header-count"}>
          <HeaderContent />
        </Portal>

        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-12">
            <EyeIcon className="mb-4 h-12 w-12 text-gray-400" strokeWidth={1} />
            <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-gray-100">
              No hidden documents or folders
            </h3>
            <p className="text-sm text-muted-foreground">
              Documents and folders you hide from All Documents will appear
              here.
            </p>
          </div>
        )}
      </div>

      <DeleteFolderModal />
      <DeleteItemsModal />
    </>
  );
}
