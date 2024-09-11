import { DataroomFolder } from "@prisma/client";
import { FolderIcon } from "lucide-react";

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
    <li className="group/row relative flex items-center justify-between rounded-lg border-0 p-3 ring-1 ring-gray-400 transition-all hover:bg-secondary hover:ring-gray-500 dark:bg-secondary dark:ring-gray-500 hover:dark:ring-gray-400 sm:p-4">
      <div className="flex min-w-0 shrink items-center space-x-2 sm:space-x-4">
        <div className="mx-0.5 flex w-8 items-center justify-center text-center sm:mx-1">
          <FolderIcon className="h-8 w-8" strokeWidth={1} />
        </div>

        <div className="flex-col">
          <div className="flex items-center">
            <h2 className="min-w-0 max-w-[300px] truncate text-sm font-semibold leading-6 text-foreground sm:max-w-lg">
              <div
                onClick={() => setFolderId(folder.id)}
                className="w-full truncate"
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
