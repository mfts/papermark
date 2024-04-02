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
import { DataroomFolderWithCount } from "@/lib/swr/use-dataroom";
import { DataroomFolder } from "@prisma/client";

type FolderCardProps = {
  folder: DataroomFolder;
  dataroomId: string;
  setFolderId: (id: string) => void;
};
export default function FolderCard({
  folder,
  dataroomId,
  setFolderId,
}: FolderCardProps) {
  return (
    <li className="group/row relative rounded-lg p-3 border-0 dark:bg-secondary ring-1 ring-gray-400 dark:ring-gray-500 transition-all hover:ring-gray-500 hover:dark:ring-gray-400 hover:bg-secondary sm:p-4 flex justify-between items-center">
      <div className="min-w-0 flex shrink items-center space-x-2 sm:space-x-4">
        <div className="w-8 mx-0.5 sm:mx-1 text-center flex justify-center items-center">
          <FolderIcon className="w-8 h-8 " strokeWidth={1} />
        </div>

        <div className="flex-col">
          <div className="flex items-center">
            <h2 className="min-w-0 text-sm font-semibold leading-6 text-foreground truncate max-w-[150px] sm:max-w-md">
              <div
                onClick={() => setFolderId(folder.id)}
                className="truncate w-full"
              >
                <span>{folder.name}</span>
                <span className="absolute inset-0" />
              </div>
            </h2>
          </div>
        </div>
      </div>
    </li>
  );
}
