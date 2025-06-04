import { useRouter } from "next/router";

import { useEffect, useRef, useState } from "react";

import { TeamContextType } from "@/context/team-context";
import {
  BetweenHorizontalStartIcon,
  ClipboardCopyIcon,
  CopyIcon,
  FolderIcon,
  FolderInputIcon,
  FolderPenIcon,
  MoreVertical,
  PackagePlusIcon,
  Pin,
  TrashIcon,
} from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

import { usePins } from "@/lib/context/pin-context";
import { DataroomFolderWithCount } from "@/lib/swr/use-dataroom";
import { FolderWithCount } from "@/lib/swr/use-documents";
import { cn, timeAgo } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { MoveToDataroomFolderModal } from "../datarooms/move-dataroom-folder-modal";
import { EditFolderModal } from "../folders/edit-folder-modal";
import { AddFolderToDataroomModal } from "./add-folder-to-dataroom-modal";
import { MoveToFolderModal } from "./move-folder-modal";

type FolderCardProps = {
  folder: FolderWithCount | DataroomFolderWithCount;
  teamInfo: TeamContextType | null;
  isDataroom?: boolean;
  dataroomId?: string;
  isDragging?: boolean;
  isOver?: boolean;
  isHovered?: boolean;
  isSelected?: boolean;
  onDelete?: (folderId: string) => void;
};

export default function FolderCard({
  folder,
  teamInfo,
  isDataroom,
  dataroomId,
  isDragging,
  isOver,
  isSelected,
  isHovered,
  onDelete,
}: FolderCardProps) {
  const router = useRouter();
  const [moveFolderOpen, setMoveFolderOpen] = useState<boolean>(false);
  const [openFolder, setOpenFolder] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [addDataroomOpen, setAddDataroomOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const { pinnedItems, addPinnedItem, removePinnedItem } = usePins();

  const folderPath =
    isDataroom && dataroomId
      ? `/datarooms/${dataroomId}/documents${folder.path}`
      : `/documents/tree${folder.path}`;
  const parentFolderPath = folder.path.substring(
    0,
    folder.path.lastIndexOf("/"),
  );

  const isPinned =
    pinnedItems && Array.isArray(pinnedItems)
      ? pinnedItems.some((item) =>
          isDataroom
            ? item.dataroomFolderId === folder.id
            : item.folderId === folder.id,
        )
      : false;

  const handlePin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (isPinned) {
        const pinToRemove = pinnedItems.find((item) =>
          isDataroom
            ? item.dataroomFolderId === folder.id
            : item.folderId === folder.id,
        );
        if (pinToRemove?.id) {
          await removePinnedItem(pinToRemove.id);
          toast.success("Folder unpinned");
        }
      } else {
        await addPinnedItem({
          pinType: isDataroom ? "DATAROOM_FOLDER" : "FOLDER",
          ...(isDataroom
            ? { dataroomFolderId: folder.id, dataroomId }
            : { folderId: folder.id }),
          name: folder.name,
          path: folder.path,
        });
        toast.success("Folder pinned");
      }
    } catch (error) {
      console.error(error);
    }
    setMenuOpen(false);
  };

  // https://github.com/radix-ui/primitives/issues/1241#issuecomment-1888232392
  useEffect(() => {
    if (!openFolder || !addDataroomOpen) {
      setTimeout(() => {
        document.body.style.pointerEvents = "";
      });
    }
  }, [openFolder, addDataroomOpen]);

  const handleCreateDataroom = (e: any, folderId: string) => {
    e.stopPropagation();
    e.preventDefault();

    toast.promise(
      fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/create-from-folder`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            folderId: folderId,
          }),
        },
      ).then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "An error occurred while creating dataroom.",
          );
        }
        return response.json();
      }),
      {
        loading: "Creating dataroom...",
        success: (data) => {
          toast.dismiss();
          setMenuOpen(false);
          mutate(`/api/teams/${teamInfo?.currentTeam?.id}/datarooms`);
          toast.success(`Successfully created!`, {
            description: `${folder.name} → ${data.name}`,
            action: {
              label: "Open Dataroom",
              onClick: () => router.push(`/datarooms/${data.id}/documents`),
            },
            duration: 10000,
          });
          return null;
        },
        error: (error) => {
          return error.message;
        },
      },
    );
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    router.push(folderPath);
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className="group/row relative flex items-center justify-between rounded-lg border-0 bg-white p-3 ring-1 ring-gray-400 transition-all hover:bg-secondary hover:ring-gray-500 dark:bg-secondary dark:ring-gray-500 hover:dark:ring-gray-400 sm:p-4"
      >
        <div className="flex min-w-0 shrink items-center space-x-2 sm:space-x-4">
          {!isSelected && !isHovered ? (
            <div className="mx-0.5 flex w-8 items-center justify-center text-center sm:mx-1">
              <FolderIcon className="h-8 w-8" strokeWidth={1} />
            </div>
          ) : (
            <div className="mx-0.5 w-8 sm:mx-1"></div>
          )}

          <div className="flex-col">
            <div className="flex items-center">
              <h2 className="min-w-0 max-w-[150px] truncate text-sm font-semibold leading-6 text-foreground sm:max-w-md">
                {folder.name}
              </h2>
            </div>
            <div className="mt-1 flex items-center space-x-1 text-xs leading-5 text-muted-foreground">
              <p className="truncate">{timeAgo(folder.createdAt)}</p>
              <p>•</p>
              <p className="truncate">
                {folder._count.documents}{" "}
                {folder._count.documents === 1 ? "Document" : "Documents"}
              </p>
              <p>•</p>
              <p className="truncate">
                {folder._count.childFolders}{" "}
                {folder._count.childFolders === 1 ? "Folder" : "Folders"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-row space-x-2">
          {/* <Link
          onClick={(e) => {
            e.stopPropagation();
          }}
          href={`/documents/${prismaDocument.id}`}
          className="flex items-center z-10 space-x-1 rounded-md bg-gray-200 dark:bg-gray-700 px-1.5 sm:px-2 py-0.5 transition-all duration-75 hover:scale-105 active:scale-100"
        >
          <BarChart className="w-3 h-3 sm:h-4 sm:w-4 text-muted-foreground" />
          <p className="text-xs whitespace-nowrap sm:text-sm text-muted-foreground">
            {nFormatter(prismaDocument._count.views)}
            <span className="hidden ml-1 sm:inline-block">views</span>
          </p>
        </Link> */}

          <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                // size="icon"
                variant="outline"
                className="z-10 h-8 w-8 border-gray-200 bg-transparent p-0 hover:bg-gray-200 dark:border-gray-700 hover:dark:bg-gray-700 lg:h-9 lg:w-9"
              >
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" ref={dropdownRef} className="w-64">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={handlePin} className="group/pin">
                <Pin
                  className={cn("mr-2 h-4 w-4", isPinned && "fill-current")}
                />
                {isPinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpenFolder(true);
                }}
              >
                <FolderPenIcon className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMoveFolderOpen(true);
                }}
              >
                <FolderInputIcon className="mr-2 h-4 w-4" />
                Move to Folder
              </DropdownMenuItem>
              {!isDataroom ? (
                <DropdownMenuItem
                  onClick={(e) => handleCreateDataroom(e, folder.id)}
                >
                  <PackagePlusIcon className="mr-2 h-4 w-4" />
                  Create dataroom from folder
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setAddDataroomOpen(true);
                }}
              >
                <BetweenHorizontalStartIcon className="mr-2 h-4 w-4" />
                {isDataroom
                  ? "Copy folder to other dataroom"
                  : "Add folder to dataroom"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  navigator.clipboard.writeText(folder.id);
                  toast.success("Folder ID copied to clipboard");
                }}
                className="group/folderid"
              >
                <CopyIcon className="mr-2 h-4 w-4" />
                <span className="inline group-hover/folderid:hidden">
                  Copy Folder ID
                </span>
                <span className="hidden group-hover/folderid:inline group-hover/folderid:cursor-copy">
                  {folder.id}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onDelete?.(folder.id);
                  setMenuOpen(false);
                }}
                className="text-destructive duration-200 focus:bg-destructive focus:text-destructive-foreground"
              >
                <TrashIcon className="mr-2 h-4 w-4" />{" "}
                {isDataroom ? "Remove Folder" : "Delete Folder"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        {/* only used for drag and drop */}
        {isOver && !isDragging && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black bg-opacity-20 dark:bg-white dark:bg-opacity-20">
            <span className="font-semibold text-black dark:text-gray-100">
              Drop to move
            </span>
          </div>
        )}
      </div>

      {openFolder ? (
        <EditFolderModal
          open={openFolder}
          setOpen={setOpenFolder}
          folderId={folder.id}
          name={folder.name}
          isDataroom={isDataroom}
          dataroomId={dataroomId}
        />
      ) : null}
      {addDataroomOpen ? (
        <AddFolderToDataroomModal
          open={addDataroomOpen}
          setOpen={setAddDataroomOpen}
          folderId={folder.id}
          folderName={folder.name}
          dataroomId={dataroomId}
        />
      ) : null}
      {moveFolderOpen && !isDataroom ? (
        <MoveToFolderModal
          open={moveFolderOpen}
          setOpen={setMoveFolderOpen}
          folderIds={[folder.id]}
          itemName={folder.name}
          documentIds={[]}
          folderParentId={folder.parentId!}
        />
      ) : null}
      {moveFolderOpen && isDataroom && dataroomId ? (
        <MoveToDataroomFolderModal
          open={moveFolderOpen}
          setOpen={setMoveFolderOpen}
          dataroomId={dataroomId}
          documentIds={[]}
          folderIds={[folder.id]}
          folderParentId={folder.parentId!}
          itemName={folder.name}
        />
      ) : null}
    </>
  );
}
