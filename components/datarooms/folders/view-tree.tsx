import { useRouter } from "next/router";

import { memo, useMemo } from "react";

import { DataroomDocument, DataroomFolder } from "@prisma/client";

import { FileTree } from "@/components/ui/nextra-filetree";

import { buildNestedFolderStructureWithDocs } from "./utils";

type DataroomDocumentWithVersion = {
  dataroomDocumentId: string;
  folderId: string | null;
  id: string;
  name: string;
  versions: {
    id: string;
    versionNumber: number;
    hasPages: boolean;
  }[];
};

type DataroomFolderWithDocuments = DataroomFolder & {
  childFolders: DataroomFolderWithDocuments[];
  documents: {
    dataroomDocumentId: string;
    folderId: string | null;
    id: string;
    name: string;
  }[];
};

const FolderComponent = memo(
  ({
    folder,
    folderId,
    setFolderId,
  }: {
    folder: DataroomFolderWithDocuments;
    folderId: string | null;
    setFolderId: React.Dispatch<React.SetStateAction<string | null>>;
  }) => {
    const router = useRouter();

    // Memoize the rendering of the current folder's documents
    const documents = useMemo(
      () =>
        folder.documents.map((doc) => (
          <FileTree.File
            key={doc.id}
            name={doc.name}
            // onToggle={() => router.push(`/documents/${doc.id}`)}
          />
        )),
      [folder.documents, router.query.name],
    );

    // Recursively render child folders if they exist
    const childFolders = useMemo(
      () =>
        folder.childFolders.map((childFolder) => (
          <FolderComponent
            key={childFolder.id}
            folder={childFolder}
            folderId={folderId}
            setFolderId={setFolderId}
          />
        )),
      [folder.childFolders, folderId, setFolderId],
    );

    const isActive = folder.id === folderId;
    const isChildActive = folder.childFolders.some(
      (childFolder) => childFolder.id === folderId,
    );

    return (
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setFolderId(folder.id);
        }}
      >
        <FileTree.Folder
          name={folder.name}
          key={folder.id}
          active={isActive}
          childActive={isChildActive}
          onToggle={() => setFolderId(folder.id)}
        >
          {childFolders}
          {documents}
        </FileTree.Folder>
      </div>
    );
  },
);
FolderComponent.displayName = "FolderComponent";

const SidebarFolders = ({
  folders,
  documents,
  folderId,
  setFolderId,
}: {
  folders: DataroomFolder[];
  documents: DataroomDocumentWithVersion[];
  folderId: string | null;
  setFolderId: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  const nestedFolders = useMemo(() => {
    if (folders) {
      return buildNestedFolderStructureWithDocs(folders, documents);
    }
    return [];
  }, [folders, documents]);

  return (
    <FileTree>
      {nestedFolders.map((folder) => (
        <FolderComponent
          key={folder.id}
          folder={folder}
          folderId={folderId}
          setFolderId={setFolderId}
        />
      ))}
    </FileTree>
  );
};

export function ViewFolderTree({
  folders,
  documents,
  setFolderId,
  folderId,
}: {
  folders: DataroomFolder[];
  documents: DataroomDocumentWithVersion[];
  setFolderId: React.Dispatch<React.SetStateAction<string | null>>;
  folderId: string | null;
}) {
  if (!folders) return null;

  return (
    <SidebarFolders
      folders={folders}
      documents={documents}
      setFolderId={setFolderId}
      folderId={folderId}
    />
  );
}
