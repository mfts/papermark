import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

import { useEffect, useRef, useState } from "react";

import { TeamContextType } from "@/context/team-context";
import {
  FolderInputIcon,
  Layers2Icon,
  MoreVertical,
  TrashIcon,
} from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { mutate } from "swr";

import BarChart from "@/components/shared/icons/bar-chart";
import Check from "@/components/shared/icons/check";
import Copy from "@/components/shared/icons/copy";
import NotionIcon from "@/components/shared/icons/notion";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DocumentWithLinksAndLinkCountAndViewCount } from "@/lib/types";
import { nFormatter, timeAgo } from "@/lib/utils";
import { useCopyToClipboard } from "@/lib/utils/use-copy-to-clipboard";

import { MoveToFolderModal } from "./move-folder-modal";

type DocumentsCardProps = {
  document: DocumentWithLinksAndLinkCountAndViewCount;
  teamInfo: TeamContextType | null;
};
export default function DocumentsCard({
  document: prismaDocument,
  teamInfo,
}: DocumentsCardProps) {
  const router = useRouter();
  const { theme, systemTheme } = useTheme();
  const isLight =
    theme === "light" || (theme === "system" && systemTheme === "light");

  const { isCopied, copyToClipboard } = useCopyToClipboard({});
  const [isFirstClick, setIsFirstClick] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [moveFolderOpen, setMoveFolderOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  /** current folder name */
  const currentFolderPath = router.query.name as string[] | undefined;

  function handleCopyToClipboard(id: string) {
    copyToClipboard(
      `${process.env.NEXT_PUBLIC_BASE_URL}/view/${id}`,
      "Link copied to clipboard.",
    );
  }

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

    if (isFirstClick) {
      handleDeleteDocument(documentId);
      setIsFirstClick(false);
      setMenuOpen(false); // Close the dropdown after deleting
    } else {
      setIsFirstClick(true);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    // Prevent the first click from deleting the document
    if (!isFirstClick) {
      setIsFirstClick(true);
      return;
    }

    toast.promise(
      fetch(`/api/teams/${teamInfo?.currentTeam?.id}/documents/${documentId}`, {
        method: "DELETE",
      }).then(() => {
        mutate(`/api/teams/${teamInfo?.currentTeam?.id}/documents`, null, {
          populateCache: (_, docs) => {
            return docs.filter(
              (doc: DocumentWithLinksAndLinkCountAndViewCount) =>
                doc.id !== documentId,
            );
          },
          revalidate: false,
        });
      }),
      {
        loading: "Deleting document...",
        success: "Document deleted successfully.",
        error: "Failed to delete document. Try again.",
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

  const handleDuplicateDocument = async (event: any) => {
    event.stopPropagation();
    event.preventDefault();

    toast.promise(
      fetch(
        `/api/teams/${teamInfo?.currentTeam?.id}/documents/${prismaDocument.id}/duplicate`,
        {
          method: "POST",
        },
      ).then(() => {
        mutate(`/api/teams/${teamInfo?.currentTeam?.id}/documents`);
        mutate(
          `/api/teams/${teamInfo?.currentTeam?.id}/folders/documents/${currentFolderPath?.join("/")}`,
        );
      }),
      {
        loading: "Duplicating document...",
        success: "Document duplicated successfully.",
        error: "Failed to duplicate document. Try again.",
      },
    );
  };

  return (
    <>
      <li className="group/row relative flex items-center justify-between rounded-lg border-0 p-3 ring-1 ring-gray-200 transition-all hover:bg-secondary hover:ring-gray-300 dark:bg-secondary dark:ring-gray-700 hover:dark:ring-gray-500 sm:p-4">
        <div className="flex min-w-0 shrink items-center space-x-2 sm:space-x-4">
          <div className="mx-0.5 flex w-8 items-center justify-center text-center sm:mx-1">
            {prismaDocument.type === "notion" ? (
              <NotionIcon className="h-8 w-8" />
            ) : (
              <Image
                src={`/_icons/${prismaDocument.type}${isLight ? "-light" : ""}.svg`}
                alt="File icon"
                width={50}
                height={50}
              />
            )}
          </div>

          <div className="flex-col">
            <div className="flex items-center">
              <h2 className="min-w-0 max-w-[150px] truncate text-sm font-semibold leading-6 text-foreground sm:max-w-md">
                <Link
                  href={`/documents/${prismaDocument.id}`}
                  className="w-full truncate"
                >
                  <span>{prismaDocument.name}</span>
                  <span className="absolute inset-0" />
                </Link>
              </h2>
              <div className="ml-2 flex">
                <button
                  className="group z-10 rounded-md bg-gray-200 p-1 transition-all duration-75 hover:scale-105 hover:bg-emerald-100 active:scale-95 dark:bg-gray-700 hover:dark:bg-emerald-200"
                  onClick={() =>
                    handleCopyToClipboard(prismaDocument.links[0].id)
                  }
                  title="Copy to clipboard"
                >
                  {isCopied ? (
                    <Check className="size-3 text-muted-foreground group-hover:text-emerald-700" />
                  ) : (
                    <Copy className="size-3 text-muted-foreground group-hover:text-emerald-700" />
                  )}
                </button>
              </div>
            </div>
            <div className="mt-1 flex items-center space-x-1 text-xs leading-5 text-muted-foreground">
              <p className="truncate">{timeAgo(prismaDocument.createdAt)}</p>
              <p>•</p>
              <p className="truncate">
                {prismaDocument._count.links}{" "}
                {prismaDocument._count.links === 1 ? "Link" : "Links"}
              </p>
              {prismaDocument._count.versions > 1 ? (
                <>
                  <p>•</p>
                  <p className="truncate">{`${prismaDocument._count.versions} Versions`}</p>
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
            href={`/documents/${prismaDocument.id}`}
            className="z-10 flex items-center space-x-1 rounded-md bg-gray-200 px-1.5 py-0.5 transition-all duration-75 hover:scale-105 active:scale-100 dark:bg-gray-700 sm:px-2"
          >
            <BarChart className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
            <p className="whitespace-nowrap text-xs text-muted-foreground sm:text-sm">
              {nFormatter(prismaDocument._count.views)}
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
              <DropdownMenuItem onClick={() => setMoveFolderOpen(true)}>
                <FolderInputIcon className="mr-2 h-4 w-4" />
                Move to folder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => handleDuplicateDocument(e)}>
                <Layers2Icon className="mr-2 h-4 w-4" />
                Duplicate document
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(event) => handleButtonClick(event, prismaDocument.id)}
                className="text-destructive duration-200 focus:bg-destructive focus:text-destructive-foreground"
              >
                {isFirstClick ? (
                  "Really delete?"
                ) : (
                  <>
                    <TrashIcon className="mr-2 h-4 w-4" /> Delete document
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </li>
      {moveFolderOpen ? (
        <MoveToFolderModal
          open={moveFolderOpen}
          setOpen={setMoveFolderOpen}
          documentId={prismaDocument.id}
          documentName={prismaDocument.name}
        />
      ) : null}
    </>
  );
}
