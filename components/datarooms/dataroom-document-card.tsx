import Image from "next/image";
import Link from "next/link";

import { useEffect, useRef, useState } from "react";

import { TeamContextType } from "@/context/team-context";
import { FolderInputIcon, MoreVertical, TrashIcon } from "lucide-react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import { mutate } from "swr";

import { MoveToFolderModal } from "@/components/documents/move-folder-modal";
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

import { type DataroomFolderDocument } from "@/lib/swr/use-dataroom";
import { type DocumentWithLinksAndLinkCountAndViewCount } from "@/lib/types";
import { nFormatter, timeAgo } from "@/lib/utils";
import { useCopyToClipboard } from "@/lib/utils/use-copy-to-clipboard";

import { MoveToDataroomFolderModal } from "./move-dataroom-folder-modal";

type DocumentsCardProps = {
  document: DataroomFolderDocument;
  teamInfo: TeamContextType | null;
};
export default function DataroomDocumentCard({
  document,
  teamInfo,
}: DocumentsCardProps) {
  const { theme, systemTheme } = useTheme();
  const isLight =
    theme === "light" || (theme === "system" && systemTheme === "light");

  const { isCopied, copyToClipboard } = useCopyToClipboard({});
  const [isFirstClick, setIsFirstClick] = useState<boolean>(false);
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [moveFolderOpen, setMoveFolderOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  return (
    <>
      <li className="group/row relative flex items-center justify-between rounded-lg border-0 p-3 ring-1 ring-gray-200 transition-all hover:bg-secondary hover:ring-gray-300 dark:bg-secondary dark:ring-gray-700 hover:dark:ring-gray-500 sm:p-4">
        <div className="flex min-w-0 shrink items-center space-x-2 sm:space-x-4">
          <div className="mx-0.5 flex w-8 items-center justify-center text-center sm:mx-1">
            {document.document.type === "notion" ? (
              <NotionIcon className="h-8 w-8" />
            ) : (
              <Image
                src={`/_icons/${document.document.type}${isLight ? "-light" : ""}.svg`}
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
                  href={`/documents/${document.document.id}`}
                  className="w-full truncate"
                >
                  <span>{document.document.name}</span>
                  <span className="absolute inset-0" />
                </Link>
              </h2>
            </div>
            <div className="mt-1 flex items-center space-x-1 text-xs leading-5 text-muted-foreground">
              <p className="truncate">{timeAgo(document.createdAt)}</p>
              {document.document._count.versions > 1 ? (
                <>
                  <p>•</p>
                  <p className="truncate">{`${document.document._count.versions} Versions`}</p>
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
            href={`/documents/${document.document.id}`}
            className="z-10 flex items-center space-x-1 rounded-md bg-gray-200 px-1.5 py-0.5 transition-all duration-75 hover:scale-105 active:scale-100 dark:bg-gray-700 sm:px-2"
          >
            <BarChart className="h-3 w-3 text-muted-foreground sm:h-4 sm:w-4" />
            <p className="whitespace-nowrap text-xs text-muted-foreground sm:text-sm">
              {nFormatter(document.document._count.views)}
              <span className="ml-1 hidden sm:inline-block">views</span>
            </p>
          </Link>

          <DropdownMenu>
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
              <DropdownMenuSeparator />

              {/* <DropdownMenuItem
              onClick={(event) => handleButtonClick(event, prismaDocument.id)}
              className="text-destructive focus:bg-destructive focus:text-destructive-foreground duration-200"
            >
              {isFirstClick ? (
                "Really delete?"
              ) : (
                <>
                  <TrashIcon className="w-4 h-4 mr-2" /> Delete document
                </>
              )}
            </DropdownMenuItem> */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </li>
      {moveFolderOpen ? (
        <MoveToDataroomFolderModal
          open={moveFolderOpen}
          setOpen={setMoveFolderOpen}
          dataroomId={document.dataroomId}
          documentId={document.id}
          documentName={document.document.name}
        />
      ) : null}
    </>
  );
}
