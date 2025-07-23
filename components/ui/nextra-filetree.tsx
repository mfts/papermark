"use client";

/**
 * This component is based on the nextra's filetree component from @shuding
 * https://github.com/shuding/nextra/blob/main/packages/nextra/src/components/file-tree.tsx
 *
 */
import React, {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
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
  className?: string;
  children: ReactNode;
  disable?: boolean;
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
      <div className="block space-y-1 rounded-lg">{children}</div>
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
    className,
    disable,
  }) => {
    const indent = useIndent();
    const [isOpen, setIsOpen] = useState(defaultOpen || childActive);

    useEffect(() => {
      if (childActive) {
        setIsOpen(true);
      }
    }, [childActive]);

    const handleFolderClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggle?.(!isOpen);
      },
      [isOpen, onToggle],
    );

    const handleChevronClick = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(!isOpen);
      },
      [isOpen],
    );

    const isFolderOpen = open === undefined ? isOpen : open;
    const hasChildren = React.Children.count(children) > 0;

    return (
      <li
        className={cn(
          "flex w-full list-none flex-col",
          hasChildren && "space-y-1",
        )}
      >
        <div
          title={name}
          className={cn(
            "inline-flex w-full cursor-pointer items-center overflow-hidden",
            "rounded-md text-foreground duration-100 hover:bg-gray-100 hover:dark:bg-muted",
            "px-3 py-1.5 leading-6",
            active && "bg-gray-100 font-semibold dark:bg-muted",
            disable && "pointer-events-none cursor-auto opacity-50",
            className,
          )}
          onClick={handleFolderClick}
        >
          <Ident />
          <div
            className="-m-1 -ml-2 flex h-full items-center justify-center rounded p-2"
            onClick={handleChevronClick}
          >
            <ChevronRightIcon
              className={cn(
                "chevron h-4 w-4 shrink-0 transition-transform duration-150",
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
            className="ml-2 truncate whitespace-nowrap"
            style={{
              maxWidth: `${Math.max(150, 300 - indent * 30)}px`,
            }}
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
  const indent = useIndent();
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
        className="ml-5 inline-flex w-full cursor-default items-center overflow-hidden"
        onClick={toggle}
      >
        <Ident />
        <FileIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
        <span
          className="ml-2 truncate whitespace-nowrap"
          style={{
            maxWidth: `${Math.max(150, 280 - indent * 30)}px`,
          }}
          title={(label ?? name) as string}
        >
          {label ?? name}
        </span>
      </span>
    </li>
  );
});
File.displayName = "File";

export const FileTree = Object.assign(Tree, { Folder, File });
