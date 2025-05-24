import { useRouter } from "next/router";

import { useRef, useState } from "react";

import { TeamContextType } from "@/context/team-context";
import {
  FolderIcon,
  FolderInputIcon,
  MoreVertical,
  TrashIcon,
  UndoIcon,
} from "lucide-react";

import { cn, timeAgo } from "@/lib/utils";

import DeleteConfirmationDialog from "@/components/datarooms/trash/delete-confirmation-dialog";
import { useTrashOperations } from "@/components/datarooms/trash/hooks/use-trash-operations";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { MoveTrashToDataroomFolderModal } from "./move-trash-to-dataroom-modal";
import { TrashItem } from "./types";

interface TrashFolderCardProps {
  item: TrashItem;
  teamInfo: TeamContextType | null;
  dataroomId: string;
  isSelected?: boolean;
  isHovered?: boolean;
  root?: boolean;
}

export default function TrashFolderCard({
  item,
  teamInfo,
  dataroomId,
  isSelected,
  isHovered,
  root,
}: TrashFolderCardProps) {
  const router = useRouter();
  const { name } = router.query as { name: string[] };
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [moveFolderOpen, setMoveFolderOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { handleDelete, handleRestore } = useTrashOperations({
    teamInfo,
    dataroomId,
    root,
    name,
  });

  if (!item.dataroomFolder) return null;
  const folderPath = `/datarooms/${dataroomId}/trash${item.trashPath}`;

  const handleCardClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(folderPath);
  };

  const handleMenuStateChange = (open: boolean) => {
    setMenuOpen(open);
  };

  const onDelete = () => {
    handleDelete(item.id, "folder", {
      onSuccess: () => setShowDeleteAlert(false),
    });
  };

  const onRestore = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleRestore(item.id, "folder");
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Download folder");
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className={cn(
          "group/row relative flex items-center justify-between rounded-lg border-0 bg-white p-3 ring-1 ring-gray-400 transition-all hover:bg-secondary hover:ring-gray-500 dark:bg-secondary dark:ring-gray-500 hover:dark:ring-gray-400 sm:p-4",
          isSelected && "bg-secondary ring-gray-500 dark:ring-gray-400",
          isHovered && "bg-secondary ring-gray-500 dark:ring-gray-400",
        )}
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
                {item.dataroomFolder.name}
              </h2>
            </div>
            <div className="mt-1 flex items-center space-x-1 text-xs leading-5 text-muted-foreground">
              <p className="truncate">
                {timeAgo(new Date(item.dataroomFolder.removedAt))}
              </p>
            </div>
          </div>
        </div>

        <div
          className="flex flex-row space-x-2"
          onClick={(e) => e.stopPropagation()}
        >
          <DropdownMenu open={menuOpen} onOpenChange={handleMenuStateChange}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="z-10 h-8 w-8 border-gray-200 bg-transparent p-0 hover:bg-gray-200 dark:border-gray-700 hover:dark:bg-gray-700 lg:h-9 lg:w-9"
              >
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" ref={dropdownRef}>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={onRestore}>
                <UndoIcon className="mr-2 h-4 w-4" />
                Restore folder
              </DropdownMenuItem>
              {/* <DropdownMenuItem onClick={handleDownload}>
                <DownloadIcon className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem> */}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setMoveFolderOpen(true);
                }}
              >
                <FolderInputIcon className="mr-2 h-4 w-4" />
                Move to folder
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setShowDeleteAlert(true);
                  setMenuOpen(false);
                }}
                className="text-destructive duration-200 focus:bg-destructive focus:text-destructive-foreground"
              >
                <TrashIcon className="mr-2 h-4 w-4" /> Delete permanently
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <DeleteConfirmationDialog
        isOpen={showDeleteAlert}
        onClose={() => setShowDeleteAlert(false)}
        onConfirm={onDelete}
        itemType="folder"
        itemName={item.dataroomFolder.name}
      />

      {moveFolderOpen ? (
        <MoveTrashToDataroomFolderModal
          open={moveFolderOpen}
          setOpen={setMoveFolderOpen}
          dataroomId={dataroomId}
          itemName={item.dataroomFolder.name}
          documentIds={[]}
          folderIds={[item.id]}
          root={root}
          name={name}
        />
      ) : null}
    </>
  );
}
