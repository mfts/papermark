import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import {
  CheckIcon,
  ChevronRightIcon,
  FolderIcon,
  HomeIcon,
  SearchIcon,
} from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

import useDocuments, {
  useFolder,
  useFolderDocuments,
  useRootFolders,
} from "@/lib/swr/use-documents";
import { DocumentWithLinksAndLinkCountAndViewCount } from "@/lib/types";
import { timeAgo } from "@/lib/utils";
import { fileIcon } from "@/lib/utils/get-file-icon";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

export function SelectDocumentsModal({
  open,
  setOpen,
  dataroomId,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  dataroomId: string;
}) {
  const router = useRouter();
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState<string[]>([]);
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { name } = router.query as { name?: string[] };
  const dataroomFolderPath = name?.join("/");

  const isRoot = currentPath.length === 0;
  const { folders: rootFolders, loading: rootFoldersLoading } =
    useRootFolders();
  const { documents: rootDocuments, loading: rootDocumentsLoading } =
    useDocuments();
  const { folders: subFolders, loading: subFoldersLoading } = useFolder({
    name: currentPath,
  });
  const { documents: subDocuments, loading: subDocumentsLoading } =
    useFolderDocuments({ name: currentPath });

  const folders = isRoot ? rootFolders : subFolders;
  const documents = isRoot ? rootDocuments : subDocuments;
  const foldersLoading = isRoot ? rootFoldersLoading : subFoldersLoading;
  const documentsLoading = isRoot ? rootDocumentsLoading : subDocumentsLoading;

  const filteredFolders =
    folders?.filter((folder) =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  const filteredDocuments =
    documents?.filter((document) =>
      document.name.toLowerCase().includes(searchQuery.toLowerCase()),
    ) || [];

  const totalSelectedItems = selectedDocuments.length + selectedFolders.length;

  const handleDocumentSelect = (documentId: string) => {
    setSelectedDocuments((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId],
    );
  };

  const handleFolderSelect = (folderId: string) => {
    setSelectedFolders((prev) =>
      prev.includes(folderId)
        ? prev.filter((id) => id !== folderId)
        : [...prev, folderId],
    );
  };

  const handleFolderClick = (folderName: string, event: React.MouseEvent) => {
    if ((event.target as HTMLElement).closest(".folder-checkbox")) {
      return;
    }
    setCurrentPath([...currentPath, folderName]);
    setSearchQuery("");
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setCurrentPath([]);
    } else {
      setCurrentPath(currentPath.slice(0, index + 1));
    }
    setSearchQuery("");
  };

  const handleSelectAll = () => {
    const allSelected =
      selectedDocuments.length === filteredDocuments.length &&
      selectedFolders.length === filteredFolders.length;

    if (allSelected) {
      setSelectedDocuments([]);
      setSelectedFolders([]);
    } else {
      setSelectedDocuments(filteredDocuments.map((doc) => doc.id));
      setSelectedFolders(filteredFolders.map((folder) => folder.id));
    }
  };

  const handleAddToDataroom = async () => {
    if (totalSelectedItems === 0) return;

    setLoading(true);
    try {
      const promises: Promise<Response>[] = [];
      if (selectedDocuments.length > 0) {
        promises.push(
          ...selectedDocuments.map((documentId) =>
            fetch(`/api/teams/${teamId}/datarooms/${dataroomId}/documents`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                documentId,
                folderPathName: dataroomFolderPath,
              }),
            }),
          ),
        );
      }

      if (selectedFolders.length > 0) {
        promises.push(
          ...selectedFolders.map((folderId) =>
            fetch(
              `/api/teams/${teamId}/folders/manage/${folderId}/add-to-dataroom`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  dataroomId,
                  folderPathName: dataroomFolderPath,
                }),
              },
            ),
          ),
        );
      }

      const responses = await Promise.allSettled(promises);

      let successful = 0;
      let failed = 0;

      for (const result of responses) {
        if (result.status === "fulfilled") {
          if (result.value.ok) {
            successful++;
          } else {
            failed++;
          }
        } else {
          failed++;
        }
      }

      if (successful > 0) {
        if (dataroomFolderPath) {
          mutate(
            `/api/teams/${teamId}/datarooms/${dataroomId}/folders/documents/${dataroomFolderPath}`,
          );
          mutate(
            `/api/teams/${teamId}/datarooms/${dataroomId}/folders/${dataroomFolderPath}`,
          );
        } else {
          mutate(`/api/teams/${teamId}/datarooms/${dataroomId}/documents`);
          mutate(
            `/api/teams/${teamId}/datarooms/${dataroomId}/folders?root=true`,
          );
        }

        const documentText =
          selectedDocuments.length > 0
            ? `${selectedDocuments.length} document${selectedDocuments.length > 1 ? "s" : ""}`
            : "";

        const folderText =
          selectedFolders.length > 0
            ? `${selectedFolders.length} folder${selectedFolders.length > 1 ? "s" : ""}`
            : "";

        const itemsText = [documentText, folderText]
          .filter(Boolean)
          .join(" and ");

        const message =
          failed > 0
            ? `${successful} item${successful > 1 ? "s" : ""} added successfully. ${failed} item${failed > 1 ? "s" : ""} already exist in dataroom.`
            : `${itemsText} added to dataroom successfully! 🎉`;

        toast.success(message);
      }

      if (failed > 0 && successful === 0) {
        toast.error("All selected items already exist in the dataroom.");
      }

      setSelectedDocuments([]);
      setSelectedFolders([]);
      setOpen(false);
    } catch (error) {
      console.error("Error adding items to dataroom:", error);
      toast.error("Failed to add items to dataroom. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setSelectedDocuments([]);
      setSelectedFolders([]);
      setSearchQuery("");
      setCurrentPath([]);
    }
  }, [open]);

  useEffect(() => {
    setSelectedDocuments([]);
    setSelectedFolders([]);
  }, [currentPath]);

  const allItemsSelected =
    selectedDocuments.length === filteredDocuments.length &&
    selectedFolders.length === filteredFolders.length &&
    (filteredDocuments.length > 0 || filteredFolders.length > 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-h-[80vh] sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Add Items from All Documents</DialogTitle>
          <DialogDescription>
            Select documents and folders from your All Documents to add to this
            dataroom folder .
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-1 font-medium text-foreground hover:text-foreground"
              onClick={() => handleBreadcrumbClick(-1)}
            >
              <HomeIcon className="mr-1 h-3 w-3" />
              All Documents
            </Button>
            {currentPath.map((pathPart, index) => (
              <div key={index} className="flex items-center space-x-1">
                <ChevronRightIcon className="h-3 w-3" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 font-medium text-foreground hover:text-foreground"
                  onClick={() => handleBreadcrumbClick(index)}
                >
                  {pathPart}
                </Button>
              </div>
            ))}
          </div>

          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search folders and documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {(filteredDocuments.length > 0 || filteredFolders.length > 0) && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="select-all"
                checked={allItemsSelected}
                onCheckedChange={handleSelectAll}
              />
              <label
                htmlFor="select-all"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Select all ({filteredFolders.length + filteredDocuments.length}{" "}
                items)
              </label>
            </div>
          )}

          <ScrollArea className="h-96">
            {foldersLoading || documentsLoading ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                Loading...
              </div>
            ) : filteredFolders.length === 0 &&
              filteredDocuments.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-muted-foreground">
                {searchQuery
                  ? "No folders or documents found matching your search."
                  : "No items in this folder."}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFolders.map((folder) => (
                  <FolderItem
                    key={folder.id}
                    folder={folder}
                    isSelected={selectedFolders.includes(folder.id)}
                    onSelect={() => handleFolderSelect(folder.id)}
                    onClick={(event) => handleFolderClick(folder.name, event)}
                  />
                ))}

                {/* Documents */}
                {filteredDocuments.map((document) => (
                  <DocumentItem
                    key={document.id}
                    document={document}
                    isSelected={selectedDocuments.includes(document.id)}
                    onSelect={() => handleDocumentSelect(document.id)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAddToDataroom}
            disabled={totalSelectedItems === 0 || loading}
            loading={loading}
          >
            Add {totalSelectedItems > 0 ? `${totalSelectedItems} ` : ""}
            Item{totalSelectedItems !== 1 ? "s" : ""} to Dataroom
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FolderItem({
  folder,
  isSelected,
  onSelect,
  onClick,
}: {
  folder: {
    id: string;
    name: string;
    _count: { documents: number; childFolders: number };
  };
  isSelected: boolean;
  onSelect: () => void;
  onClick: (event: React.MouseEvent) => void;
}) {
  return (
    <div
      className={`flex cursor-pointer items-center space-x-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
        isSelected ? "border-primary bg-muted" : ""
      }`}
      onClick={onClick}
    >
      <div className="folder-checkbox" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={isSelected} onCheckedChange={onSelect} />
      </div>
      <div className="flex h-8 w-8 items-center justify-center">
        <FolderIcon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{folder.name}</div>
        <div className="text-sm text-muted-foreground">
          {folder._count.documents} document
          {folder._count.documents !== 1 ? "s" : ""} •{" "}
          {folder._count.childFolders} folder
          {folder._count.childFolders !== 1 ? "s" : ""}
        </div>
      </div>
      <div className="flex items-center space-x-2">
        {isSelected && <CheckIcon className="h-4 w-4 text-primary" />}
        <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
      </div>
    </div>
  );
}

function DocumentItem({
  document,
  isSelected,
  onSelect,
}: {
  document: DocumentWithLinksAndLinkCountAndViewCount;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const iconElement = fileIcon({ fileType: document.type || "pdf" });

  return (
    <div
      className={`flex cursor-pointer items-center space-x-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
        isSelected ? "border-primary bg-muted" : ""
      }`}
      onClick={onSelect}
    >
      <div className="document-checkbox" onClick={(e) => e.stopPropagation()}>
        <Checkbox checked={isSelected} onCheckedChange={onSelect} />
      </div>
      <div className="flex h-8 w-8 items-center justify-center">
        {iconElement}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{document.name}</div>
        <div className="text-sm text-muted-foreground">
          {timeAgo(document.createdAt)}
        </div>
      </div>
      {isSelected && <CheckIcon className="h-4 w-4 text-primary" />}
    </div>
  );
}
