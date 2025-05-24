import { useRouter } from "next/router";

import { memo, useMemo } from "react";

import { HomeIcon, Trash2 } from "lucide-react";

import {
  DataroomFolderWithDocuments,
  useDataroomFoldersTree,
} from "@/lib/swr/use-dataroom";
import { cn } from "@/lib/utils";

import { FileTree } from "@/components/ui/nextra-filetree";

import { buildNestedFolderStructure } from "./utils";

const FolderComponent = memo(
  ({
    dataroomId,
    folder,
    trash = false,
  }: {
    dataroomId: string;
    folder: DataroomFolderWithDocuments;
    trash?: boolean;
  }) => {
    const router = useRouter();

    // Memoize the rendering of the current folder's documents
    const documents = useMemo(
      () =>
        folder.documents.map((doc) => (
          <FileTree.File
            key={doc.id}
            name={doc.document.name}
            onToggle={() => router.push(`/documents/${doc.document.id}`)}
          />
        )),
      [folder.documents, dataroomId, router.query.name],
    );

    // Recursively render child folders if they exist
    const childFolders = useMemo(
      () =>
        folder.childFolders.map((childFolder) => (
          <FolderComponent
            key={childFolder.id}
            dataroomId={dataroomId}
            folder={childFolder}
            trash={trash}
          />
        )),
      [folder.childFolders, dataroomId, trash],
    );

    const isActive =
      folder.path === "/" + (router.query.name as string[])?.join("/");
    const isChildActive = folder.childFolders.some(
      (childFolder) =>
        childFolder.path === "/" + (router.query.name as string[])?.join("/"),
    );

    const handleFolderClick = () => {
      const basePath = trash
        ? `/datarooms/${dataroomId}/trash`
        : `/datarooms/${dataroomId}/documents`;
      router.push(`${basePath}${folder.path}`, `${basePath}${folder.path}`, {
        scroll: false,
      });
    };

    return (
      <FileTree.Folder
        name={folder.name}
        key={folder.id}
        active={isActive}
        childActive={isChildActive}
        onToggle={handleFolderClick}
      >
        {childFolders}
        {documents}
      </FileTree.Folder>
    );
  },
);
FolderComponent.displayName = "FolderComponent";

const SidebarFolders = ({
  dataroomId,
  folders,
  trash = false,
}: {
  dataroomId: string;
  folders: DataroomFolderWithDocuments[];
  trash?: boolean;
}) => {
  const nestedFolders = useMemo(() => {
    if (folders) {
      return buildNestedFolderStructure(folders);
    }
    return [];
  }, [folders, dataroomId]);

  return (
    <FileTree>
      <SidebarLink
        href={`/datarooms/${dataroomId}/documents`}
        label={"Dataroom Home"}
        icon={<HomeIcon className="h-5 w-5 shrink-0" aria-hidden="true" />}
      />
      {trash
        ? null
        : nestedFolders.map((folder) => (
            <FolderComponent
              key={folder.id}
              dataroomId={dataroomId}
              folder={folder}
              trash={trash}
            />
          ))}
      <SidebarLink
        href={`/datarooms/${dataroomId}/trash`}
        label={"Trash"}
        icon={<Trash2 className="h-5 w-5 shrink-0" aria-hidden="true" />}
      />
      {trash
        ? nestedFolders.map((folder) => (
            <FolderComponent
              key={folder.id}
              dataroomId={dataroomId}
              folder={folder}
              trash={trash}
            />
          ))
        : null}
    </FileTree>
  );
};

export function SidebarFolderTree({
  dataroomId,
  trash,
}: {
  dataroomId: string;
  trash?: boolean;
}) {
  const { folders, error } = useDataroomFoldersTree({
    dataroomId,
    trash,
  });

  if (!folders || error) return null;

  return (
    <SidebarFolders dataroomId={dataroomId} folders={folders} trash={trash} />
  );
}

export const SidebarLink = memo(
  ({
    href,
    label,
    icon,
  }: {
    href: string;
    label: string;
    icon: React.ReactNode;
  }) => {
    const router = useRouter();
    const isActive = router.asPath === href;

    return (
      <li
        className={cn(
          "flex list-none",
          "rounded-md text-foreground transition-all duration-200 ease-in-out",
          "hover:bg-gray-100 hover:shadow-sm hover:dark:bg-muted",
          "px-3 py-1.5 leading-6",
          isActive && "bg-gray-100 font-semibold dark:bg-muted",
        )}
      >
        <span
          className="inline-flex w-full cursor-pointer items-center"
          onClick={() => router.push(href)}
        >
          {icon}
          <span className="ml-2 w-fit truncate" title={label}>
            {label}
          </span>
        </span>
      </li>
    );
  },
);

SidebarLink.displayName = "SidebarLink";