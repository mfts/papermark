/**
 * This component is based on the nextra's filetree component from @shuding
 * https://github.com/shuding/nextra/blob/main/packages/nextra/src/components/file-tree.tsx
 *
 */
import { createContext, memo, useCallback, useContext, useState } from "react";
import type { ReactElement, ReactNode } from "react";

import {
  FileIcon,
  FolderClosedIcon,
  FolderIcon,
  FolderOpenIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

import ChevronDown from "../shared/icons/chevron-down";
import ChevronRight from "../shared/icons/chevron-right";

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
  }) => {
    const indent = useIndent();
    const [isOpen, setIsOpen] = useState(defaultOpen || active || childActive);

    const toggle = useCallback(() => {
      onToggle?.(!isOpen);
      setIsOpen(!isOpen);
    }, [isOpen, onToggle]);

    const isFolderOpen = open === undefined ? isOpen : open;

    return (
      <li className="flex w-full list-none flex-col">
        <button
          onClick={toggle}
          title={name}
          className={cn(
            "inline-flex w-full cursor-pointer items-center",
            "rounded-md text-foreground duration-100 hover:bg-gray-200 hover:dark:bg-muted",
            "px-3 py-1.5 leading-6",
            active && "bg-gray-200 font-semibold dark:bg-muted",
          )}
        >
          <Ident />
          <ChevronRight
            className={cn(
              "chevron mr-1 h-4 w-4 shrink-0 transition-transform duration-150",
              isFolderOpen && "rotate-90",
            )}
          />
          {/* <svg width="2em" height="1em" viewBox="0 0 24 24">
            <path
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d={
                isFolderOpen
                  ? "M5 19a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4l2 2h4a2 2 0 0 1 2 2v1M5 19h14a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2Z"
                  : "M3 7v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-6l-2-2H5a2 2 0 0 0-2 2Z"
              }
            />
          </svg> */}
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
        </button>
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
        "rounded-md text-foreground duration-100 hover:bg-gray-200 hover:dark:bg-muted",
        "px-3 py-1.5 leading-6",
        active && "bg-gray-200 font-semibold dark:bg-muted",
      )}
    >
      <span
        className="ml-5 inline-flex cursor-default items-center"
        onClick={toggle}
      >
        <Ident />
        {/* <svg width="1em" height="1em" viewBox="0 0 24 24">
        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z"
        />
      </svg> */}
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
