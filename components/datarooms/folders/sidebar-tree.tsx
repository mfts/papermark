import { useRouter } from "next/router";

import { memo, useMemo } from "react";

import { FileTree } from "@/components/ui/nextra-filetree";

import {
  DataroomFolderWithDocuments,
  useDataroomFoldersTree,
} from "@/lib/swr/use-dataroom";

import { buildNestedFolderStructure } from "./utils";

const FolderComponent = memo(
  ({
    dataroomId,
    folder,
  }: {
    dataroomId: string;
    folder: DataroomFolderWithDocuments;
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
          />
        )),
      [folder.childFolders, dataroomId],
    );

    const isActive =
      folder.path === "/" + (router.query.name as string[])?.join("/");
    const isChildActive = folder.childFolders.some(
      (childFolder) =>
        childFolder.path === "/" + (router.query.name as string[])?.join("/"),
    );

    const handleFolderClick = () => {
      router.push(
        `/datarooms/${dataroomId}/documents${folder.path}`,
        `/datarooms/${dataroomId}/documents${folder.path}`,
        {
          scroll: false,
        },
      );
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
}: {
  dataroomId: string;
  folders: DataroomFolderWithDocuments[];
}) => {
  const nestedFolders = useMemo(() => {
    if (folders) {
      return buildNestedFolderStructure(folders);
    }
    return [];
  }, [folders, dataroomId]);

  return (
    <FileTree>
      {nestedFolders.map((folder) => (
        <FolderComponent
          key={folder.id}
          dataroomId={dataroomId}
          folder={folder}
        />
      ))}
    </FileTree>
  );
};

export function SidebarFolderTree({ dataroomId }: { dataroomId: string }) {
  const { folders, error } = useDataroomFoldersTree({ dataroomId });

  if (!folders || error) return null;

  return <SidebarFolders dataroomId={dataroomId} folders={folders} />;
}
