import { useRouter } from "next/router";
import { FileTree } from "@/components/ui/nextra-filetree";
import { memo, useMemo } from "react";
import { buildNestedFolderStructure } from "./utils";
import {
  DataroomFolderWithDocuments,
  useDataroomFoldersTree,
} from "@/lib/swr/use-dataroom";

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

    return (
      <FileTree.Folder
        name={folder.name}
        key={folder.id}
        active={
          folder.path === "/" + (router.query.name as string[])?.join("/")
        }
        childActive={router.query.name?.includes(folder.name)}
        onToggle={() =>
          router.push(`/datarooms/${dataroomId}/documents${folder.path}`)
        }
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
