import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type SelectionDropdownProps = {
  isAllSelected: boolean;
  onSelectAll: () => void;
  onSelectOnlyFiles?: () => void;
  onSelectOnlyFolders?: () => void;
  onSelectNone: () => void;
  className?: string;
  containerClassName?: string;
};

export const SelectionDropdown = ({
  isAllSelected,
  onSelectAll,
  onSelectOnlyFiles,
  onSelectOnlyFolders,
  onSelectNone,
  className = "",
  containerClassName = "",
}: SelectionDropdownProps) => {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Checkbox
        id="select-all"
        checked={isAllSelected}
        onCheckedChange={onSelectAll}
        className="h-5 w-5 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
        aria-label={isAllSelected ? "Deselect all" : "Select all"}
      />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 p-0 hover:bg-gray-200 hover:dark:bg-gray-700"
          >
            <ChevronDownIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          className={`w-48 rounded-md border border-gray-200 bg-white p-1 shadow-lg dark:border-gray-800 dark:bg-gray-900 ${containerClassName}`}
        >
          <DropdownMenuItem
            onClick={onSelectAll}
            className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-gray-200 hover:dark:bg-gray-700"
          >
            {isAllSelected ? "Deselect All" : "Select All"}
          </DropdownMenuItem>
          {onSelectOnlyFiles && (
            <DropdownMenuItem
              onClick={onSelectOnlyFiles}
              className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-gray-200 hover:dark:bg-gray-700"
            >
              Select Only Files
            </DropdownMenuItem>
          )}
          {onSelectOnlyFolders && (
            <DropdownMenuItem
              onClick={onSelectOnlyFolders}
              className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-gray-200 hover:dark:bg-gray-700"
            >
              Select Only Folders
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={onSelectNone}
            className="flex cursor-pointer items-center rounded-sm px-2 py-1.5 text-sm hover:bg-gray-200 hover:dark:bg-gray-700"
          >
            Select None
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
