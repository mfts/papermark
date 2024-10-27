import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

import { useEffect, useRef, useState } from "react";

import { TeamContextType } from "@/context/team-context";
import {
  ArchiveXIcon,
  BetweenHorizontalStartIcon,
  FolderInputIcon,
  MoreVertical,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { mutate } from "swr";

import BarChart from "@/components/shared/icons/bar-chart";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { type DataroomFolderDocument } from "@/lib/swr/use-dataroom";
import { type DocumentWithLinksAndLinkCountAndViewCount } from "@/lib/types";
import { cn, nFormatter, timeAgo } from "@/lib/utils";
import { fileIcon } from "@/lib/utils/get-file-icon";

import { AddToDataroomModal } from "../documents/add-document-to-dataroom-modal";
import { MoveToDataroomFolderModal } from "./move-dataroom-folder-modal";

type DocumentsCardProps = {
  document: DataroomFolderDocument;
  teamInfo: TeamContextType | null;
  dataroomId: string;
  isDragging?: boolean;
  isSelected?: boolean;
  isHovered?: boolean;
};
export default function DataroomDocumentCard({
  document: dataroomDocument,
  teamInfo,
  dataroomId,
  isDragging,
  isSelected,
  isHovered,
}: DocumentsCardProps) {
  const { theme, systemTheme } = useTheme();
  const isLight =
    theme === "light" || (theme === "system" && systemTheme === "light");
  const router = useRouter();

  const [isFirstClick, setIsFirstClick] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [moveFolderOpen, setMoveFolderOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [addDataRoomOpen, setAddDataRoomOpen] = useState<boolean>(false);

  /** current folder name */
  const currentFolderPath = router.query.name as string[] | undefined;

  // https://github.com/radix-ui/primitives/issues/1241#issuecomment-1888232392
  useEffect(() => {
    if (!moveFolderOpen) {
      setTimeout(() => {
        document.body.style.pointerEvents = "";
      });
    }
  }, [moveFolderOpen]);

  useEffect(() => {
    function handleClickOutside(event: { target: any }) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setMenuOpen(false);
        setIsFirstClick(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleButtonClick = (event: any, documentId: string) => {
    event.stopPropagation();
    event.preventDefault();

    console.log("isFirstClick", isFirstClick);
    if (isFirstClick) {
      handleRemoveDocument(documentId);
      setIsFirstClick(false);
      setMenuOpen(false); // Close the dropdown after deleting
    } else {
      setIsFirstClick(true);
    }
  };

  const handleRemoveDocument = async (documentId: string) => {
    // Prevent the first click from deleting the document
    if (!isFirstClick) {
      setIsFirstClick(true);
      return;
    }

    const endpoint = currentFolderPath
      ? `/folders/documents/${currentFolderPath.join("/")}`
      : "/documents";

    toast.promise(
      fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/documents/${documentId}`,
        {
          method: "DELETE",
        },
      ).then(() => {
        mutate(
          `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}${endpoint}`,
          null,
          {
            populateCache: (_, docs) => {
              return docs.filter(
                (doc: DocumentWithLinksAndLinkCountAndViewCount) =>
                  doc.id !== documentId,
              );
            },
            revalidate: false,
          },
        );
      }),
      {
        loading: "Removing document...",
        success: "Document removed successfully.",
        error: "Failed to remove document. Try again.",
      },
    );
  };

  const handleMenuStateChange = (open: boolean) => {
    if (isFirstClick) {
      setMenuOpen(true); // Keep the dropdown open on the first click
      return;
    }

    // If the menu is closed, reset the isFirstClick state
    if (!open) {
      setIsFirstClick(false);
      setMenuOpen(false); // Ensure the dropdown is closed
    } else {
      setMenuOpen(true); // Open the dropdown
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isDragging) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    router.push(`/documents/${dataroomDocument.document.id}`);
  };

  return (
    <>
      <div
        onClick={handleCardClick}
        className={cn(
          "group/row relative flex items-center justify-between rounded-lg border-0 bg-white p-3 ring-1 ring-gray-200 transition-all hover:bg-secondary hover:ring-gray-300 dark:bg-secondary dark:ring-gray-700 hover:dark:ring-gray-500 sm:p-4",
          isDragging ? "cursor-grabbing" : "cursor-pointer",
          isHovered && "bg-secondary ring-gray-300 dark:ring-gray-500",
        )}
      >
        <div className="flex min-w-0 shrink items-center space-x-2 sm:space-x-4">
          {!isSelected && !isHovered ? (
            <div className="mx-0.5 flex w-8 items-center justify-center text-center sm:mx-1">
              {fileIcon({
                fileType: dataroomDocument.document.type ?? "",
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
                {dataroomDocument.document.name}
              </h2>
            </div>
            <div className="mt-1 flex items-center space-x-1 text-xs leading-5 text-muted-foreground">
              <p className="truncate">{timeAgo(dataroomDocument.createdAt)}</p>
              {dataroomDocument.document._count.versions > 1 ? (
                <>
                  <p>•</p>
                  <p className="truncate">{`${dataroomDocument.document._count.versions} Versions`}</p>
                </>
              ) : null}
            </div>
          </div>
        </div>

        <div className="flex flex-row space-x-2">
          <Link
            onClick={(e) => {
              e.stopPropagation();
            }}
            href={`/documents/${dataroomDocument.document.id}`}
            className="z-10 flex items-center space-x-1 rounded-md bg-gray-200 px-1.5 py-0.5 transition-all duration-75 hover:scale-105 active:scale-100 dark:bg-gray-700 sm:px-2"
          >
            <BarChart className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
            <p className="whitespace-nowrap text-xs text-muted-foreground sm:text-sm">
              {nFormatter(dataroomDocument.document._count.views)}
              <span className="ml-1 hidden sm:inline-block">views</span>
            </p>
          </Link>

          <DropdownMenu open={menuOpen} onOpenChange={handleMenuStateChange}>
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
            <DropdownMenuContent align="end" ref={dropdownRef}>
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setMoveFolderOpen(true);
                }}
              >
                <FolderInputIcon className="mr-2 h-4 w-4" />
                Move to folder
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setAddDataRoomOpen(true);
                }}
              >
                <BetweenHorizontalStartIcon className="mr-2 h-4 w-4" />
                Copy to other dataroom
              </DropdownMenuItem>
              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={(event) =>
                  handleButtonClick(event, dataroomDocument.id)
                }
                className="text-destructive duration-200 focus:bg-destructive focus:text-destructive-foreground"
              >
                {isFirstClick ? (
                  "Really remove?"
                ) : (
                  <>
                    <ArchiveXIcon className="mr-2 h-4 w-4" /> Remove document
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {addDataRoomOpen ? (
        <AddToDataroomModal
          open={addDataRoomOpen}
          setOpen={setAddDataRoomOpen}
          documentId={dataroomDocument.document.id}
          documentName={dataroomDocument.document.name}
          dataroomId={dataroomId}
        />
      ) : null}
      {moveFolderOpen ? (
        <MoveToDataroomFolderModal
          open={moveFolderOpen}
          setOpen={setMoveFolderOpen}
          dataroomId={dataroomDocument.dataroomId}
          documentIds={[dataroomDocument.id]}
          documentName={dataroomDocument.document.name}
        />
      ) : null}
    </>
  );
}
