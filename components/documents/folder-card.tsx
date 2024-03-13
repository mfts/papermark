import { timeAgo } from "@/lib/utils";
import Link from "next/link";
import { TeamContextType } from "@/context/team-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, FolderIcon } from "lucide-react";
import { useRef } from "react";
import { FolderWithCount } from "@/lib/swr/use-documents";

type FolderCardProps = {
  folder: FolderWithCount;
  teamInfo: TeamContextType | null;
};
export default function FolderCard({ folder, teamInfo }: FolderCardProps) {
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  return (
    <li className="group/row relative rounded-lg p-3 border-0  dark:bg-secondary ring-2 ring-gray-400 dark:ring-gray-500 transition-all hover:ring-gray-500 hover:dark:ring-gray-400 hover:bg-secondary sm:p-4 flex justify-between items-center">
      <div className="min-w-0 flex shrink items-center space-x-2 sm:space-x-4">
        <div className="w-8 mx-0.5 sm:mx-1 text-center flex justify-center items-center">
          <FolderIcon className="w-8 h-8" />
        </div>

        <div className="flex-col">
          <div className="flex items-center">
            <h2 className="min-w-0 text-sm font-semibold leading-6 text-foreground truncate max-w-[150px] sm:max-w-md">
              <Link
                href={`/documents/tree${folder.path}`}
                className="truncate w-full"
              >
                <span>{folder.name}</span>
                <span className="absolute inset-0" />
              </Link>
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
          <BarChart className="h-3 sm:h-4 w-3 sm:w-4 text-muted-foreground" />
          <p className="whitespace-nowrap text-xs sm:text-sm text-muted-foreground">
            {nFormatter(prismaDocument._count.views)}
            <span className="ml-1 hidden sm:inline-block">views</span>
          </p>
        </Link> */}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              // size="icon"
              variant="outline"
              className="h-8 lg:h-9 w-8 lg:w-9 p-0 z-10 bg-transparent border-gray-200 dark:border-gray-700 hover:bg-gray-200 hover:dark:bg-gray-700"
            >
              <span className="sr-only">Open menu</span>
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" ref={dropdownRef}>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
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
  );
}
