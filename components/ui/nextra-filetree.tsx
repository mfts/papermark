/**
 * This component is based on the nextra's filetree component from @shuding
 * https://github.com/shuding/nextra/blob/main/packages/nextra/src/components/file-tree.tsx
 *
 */
import { createContext, memo, useCallback, useContext, useState } from "react";
import type { ReactElement, ReactNode } from "react";

import {
  ChevronRightIcon,
  FileIcon,
  FolderIcon,
  FolderOpenIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const ctx = createContext(0);

function useIndent() {
  return useContext(ctx);
}

interface FolderProps {
  name: string;
  label?: ReactElement;
  open?: boolean;
  defaultOpen?: boolean;
  active?: boolean;
  childActive?: boolean;
  onToggle?: (open: boolean) => void;
  onChevronClick?: (e: React.MouseEvent) => void; // New prop
  children: ReactNode;
}

interface FileProps {
  name: string;
  label?: ReactElement;
  active?: boolean;
  onToggle?: (active: boolean) => void;
}

function Tree({ children }: { children: ReactNode }): ReactElement {
  return (
    <div className={cn("nextra-filetree !mt-0 w-full select-none text-sm")}>
      <div className="block rounded-lg">{children}</div>
    </div>
  );
}

function Ident(): ReactElement {
  const length = useIndent();
  return (
    <>
      {Array.from({ length }, (_, i) => (
        <span className="w-5" key={i} />
      ))}
    </>
  );
}

const Folder = memo<FolderProps>(
  ({
    label,
    name,
    open,
    children,
    active,
    childActive,
    defaultOpen = false,
    onToggle,
    onChevronClick,
  }) => {
    const indent = useIndent();
    const [isOpen, setIsOpen] = useState(defaultOpen || active || childActive);

    const toggle = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggle?.(!isOpen);
      },
      [isOpen, onToggle],
    );

    const isFolderOpen = open === undefined ? isOpen : open;

    return (
      <li className="flex w-full list-none flex-col">
        <div
          title={name}
          className={cn(
            "inline-flex w-full cursor-pointer items-center",
            "rounded-md text-foreground duration-100 hover:bg-gray-100 hover:dark:bg-muted",
            "px-3 py-1.5 leading-6",
            "group",
            active && "bg-gray-100 font-semibold dark:bg-muted",
          )}
          onClick={toggle}
        >
          <Ident />
          <div
            className="mr-2 rounded p-1 hover:bg-gray-300 group-hover:bg-gray-300 dark:group-hover:bg-muted"
            onClick={(e) => {
              e.stopPropagation();
              onChevronClick?.(e); // Call the new prop if provided
              setIsOpen(!isOpen);
            }}
          >
            <ChevronRightIcon
              className={cn(
                "chevron h-4 w-4 shrink-0  transition-transform duration-150 ",
                isFolderOpen && "rotate-90",
              )}
            />
          </div>
          {isFolderOpen ? (
            <FolderOpenIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          ) : (
            <FolderIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          )}
          <span
            className="ml-2 w-fit truncate"
            title={(label ?? name) as string}
          >
            {label ?? name}
          </span>
        </div>
        {isFolderOpen && (
          <ul>
            <ctx.Provider value={indent + 1}>{children}</ctx.Provider>
          </ul>
        )}
      </li>
    );
  },
);
Folder.displayName = "Folder";

const File = memo<FileProps>(({ label, name, active, onToggle }) => {
  const toggle = useCallback(() => {
    onToggle?.(!active);
  }, [onToggle]);

  return (
    <li
      className={cn(
        "flex list-none",
        "rounded-md text-foreground duration-100 hover:bg-gray-100 hover:dark:bg-muted",
        "px-3 py-1.5 leading-6",
        active && "bg-gray-100 font-semibold dark:bg-muted",
      )}
    >
      <span
        className="ml-5 inline-flex cursor-default items-center"
        onClick={toggle}
      >
        <Ident />
        <FileIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span className="ml-2 w-fit truncate" title={(label ?? name) as string}>
          {label ?? name}
        </span>
      </span>
    </li>
  );
});
File.displayName = "File";

export const FileTree = Object.assign(Tree, { Folder, File });
