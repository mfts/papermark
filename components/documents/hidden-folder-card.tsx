import { useRouter } from "next/router";

import { useState } from "react";

import { TeamContextType } from "@/context/team-context";
import {
  EyeIcon,
  FolderIcon,
  MoreVertical,
  TrashIcon,
} from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

import { FolderWithCount } from "@/lib/swr/use-documents";
import { timeAgo } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type HiddenFolderCardProps = {
  folder: FolderWithCount;
  teamInfo: TeamContextType | null;
  isSelected?: boolean;
  onSelect?: () => void;
  onDelete?: (folderId: string) => void;
};

export function HiddenFolderCard({
  folder,
  teamInfo,
  isSelected,
  onSelect,
  onDelete,
}: HiddenFolderCardProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);

  const folderPath = `/documents/tree${folder.path}`;

  const handleCardClick = (e: React.MouseEvent) => {
    router.push(folderPath);
  };

  const handleUnhideFolder = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    toast.promise(
      fetch(`/api/teams/${teamInfo?.currentTeam?.id}/folders/hide`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          folderIds: [folder.id],
          hidden: false,
        }),
      }).then(async (res) => {
        if (!res.ok) {
          const error = await res.json();
          throw new Error(error.message || "Failed to unhide folder");
        }
        // Revalidate the folders and documents
        mutate(`/api/teams/${teamInfo?.currentTeam?.id}/folders?root=true`);
        mutate(`/api/teams/${teamInfo?.currentTeam?.id}/folders`);
        mutate(`/api/teams/${teamInfo?.currentTeam?.id}/documents`);
        mutate(`/api/teams/${teamInfo?.currentTeam?.id}/documents/hidden`);
        setMenuOpen(false);
      }),
      {
        loading: "Unhiding folder...",
        success: "Folder is now visible in All Documents.",
        error: (err) => err.message || "Failed to unhide folder. Try again.",
      },
    );
  };

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group/row relative flex cursor-pointer items-center justify-between rounded-lg border-0 bg-white p-3 ring-1 ring-gray-400 transition-all hover:bg-secondary hover:ring-gray-500 dark:bg-secondary dark:ring-gray-500 hover:dark:ring-gray-400 sm:p-4 ${isSelected ? "ring-2 ring-primary" : ""}`}
    >
      <div className="flex min-w-0 shrink items-center space-x-2 sm:space-x-4">
        {isSelected || isHovered ? (
          <div
            className="mx-0.5 flex w-8 items-center justify-center sm:mx-1"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onSelect?.();
            }}
          >
            <Checkbox
              checked={isSelected}
              className="h-5 w-5"
              aria-label={isSelected ? "Deselect folder" : "Select folder"}
            />
          </div>
        ) : (
          <div className="mx-0.5 flex w-8 items-center justify-center text-center sm:mx-1">
            <FolderIcon className="h-8 w-8" strokeWidth={1} />
          </div>
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
        <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="z-10 h-8 w-8 border-gray-200 bg-transparent p-0 hover:bg-gray-200 dark:border-gray-700 hover:dark:bg-gray-700 lg:h-9 lg:w-9"
            >
              <span className="sr-only">Open menu</span>
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleUnhideFolder}>
              <EyeIcon className="mr-2 h-4 w-4" />
              Show in All Documents
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
              <TrashIcon className="mr-2 h-4 w-4" /> Delete Folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
