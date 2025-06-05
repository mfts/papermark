import { useRouter } from "next/router";

import { useRef, useState } from "react";

import { TeamContextType } from "@/context/team-context";
import {
  FolderInputIcon,
  MoreVertical,
  TrashIcon,
  UndoIcon,
} from "lucide-react";
import { useTheme } from "next-themes";

import { cn, timeAgo } from "@/lib/utils";
import { fileIcon } from "@/lib/utils/get-file-icon";

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

interface TrashDocumentCardProps {
  item: TrashItem;
  teamInfo: TeamContextType | null;
  dataroomId: string;
  isSelected?: boolean;
  isHovered?: boolean;
  root?: boolean;
}

export default function TrashDocumentCard({
  item,
  teamInfo,
  dataroomId,
  isSelected,
  isHovered,
  root,
}: TrashDocumentCardProps) {
  const router = useRouter();
  const { name } = router.query as { name: string[] };
  const { theme, systemTheme } = useTheme();
  const isLight =
    theme === "light" || (theme === "system" && systemTheme === "light");
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [moveFolderOpen, setMoveFolderOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const { handleDelete, handleRestore } = useTrashOperations({
    teamInfo,
    dataroomId,
    root,
    name,
  });

  if (!item.dataroomDocument) return null;

  const handleMenuStateChange = (open: boolean) => {
    setMenuOpen(open);
  };

  const onDelete = () => {
    handleDelete(item.id, "document", {
      onSuccess: () => setShowDeleteAlert(false),
    });
  };

  const onRestore = () => {
    handleRestore(item.id, "document");
  };
  // TODO: Add download functionality
  const handleDownload = () => {
    console.log("Download document");
  };

  return (
    <>
      <div
        className={cn(
          "group/row relative flex flex-col rounded-lg border-0 bg-white ring-1 ring-gray-200 transition-all hover:bg-secondary hover:ring-gray-300 dark:bg-secondary dark:ring-gray-700 hover:dark:ring-gray-500",
          isSelected && "bg-secondary ring-gray-300 dark:ring-gray-500",
          isHovered && "bg-secondary ring-gray-300 dark:ring-gray-500",
        )}
      >
        <div className="flex items-center justify-between p-3 sm:p-4">
          <div className="flex min-w-0 shrink items-center space-x-2 sm:space-x-4">
            {!isSelected && !isHovered ? (
              <div className="mx-0.5 flex w-8 items-center justify-center text-center sm:mx-1">
                {fileIcon({
                  fileType: item.dataroomDocument.document.type ?? "",
                  className: "h-8 w-8",
                  isLight,
                })}
              </div>
            ) : (
              <div className="mx-0.5 w-8 sm:mx-1"></div>
            )}

            <div className="flex-col">
              <div className="flex items-center">
                <h2 className="min-w-0 max-w-[150px] truncate text-sm font-semibold leading-6 text-foreground sm:max-w-md">
                  {item.dataroomDocument.document.name}
                </h2>
              </div>
              <div className="mt-1 flex items-center space-x-1 text-xs leading-5 text-muted-foreground">
                <p className="truncate">
                  {timeAgo(new Date(item.dataroomDocument.removedAt))}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-row space-x-2">
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
                  Restore document
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
      </div>

      <DeleteConfirmationDialog
        isOpen={showDeleteAlert}
        onClose={() => setShowDeleteAlert(false)}
        onConfirm={onDelete}
        itemType="document"
        itemName={item.dataroomDocument.document.name}
      />

      {moveFolderOpen ? (
        <MoveTrashToDataroomFolderModal
          open={moveFolderOpen}
          setOpen={setMoveFolderOpen}
          dataroomId={dataroomId}
          folderIds={[]}
          documentIds={[item.id]}
          itemName={item.dataroomDocument.document.name}
          root={root}
          name={name}
        />
      ) : null}
    </>
  );
}
