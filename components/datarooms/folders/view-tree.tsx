import { useRouter } from "next/router";

import { memo, useMemo } from "react";

import { DataroomFolder } from "@prisma/client";
import { HomeIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  HIERARCHICAL_DISPLAY_STYLE,
  getHierarchicalDisplayName,
} from "@/lib/utils/hierarchical-display";

import { FileTree } from "@/components/ui/nextra-filetree";

import { buildNestedFolderStructureWithDocs } from "./utils";

const ViewerDocumentFileItem = memo(
  ({
    document,
    dataroomIndexEnabled,
  }: {
    document: DataroomDocumentWithVersion;
    dataroomIndexEnabled?: boolean;
  }) => {
    const documentDisplayName = getHierarchicalDisplayName(
      document.name,
      document.hierarchicalIndex,
      dataroomIndexEnabled || false,
    );

    return (
      <FileTree.File
        name={documentDisplayName}
        // onToggle={() => router.push(`/documents/${document.id}`)}
      />
    );
  },
);
ViewerDocumentFileItem.displayName = "ViewerDocumentFileItem";

type DataroomDocumentWithVersion = {
  dataroomDocumentId: string;
  folderId: string | null;
  id: string;
  name: string;
  hierarchicalIndex: string | null;
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
    hierarchicalIndex: string | null;
  }[];
};

type FolderPath = Set<string> | null;

function findFolderPath(
  folder: DataroomFolderWithDocuments,
  folderId: string,
  currentPath: Set<string> = new Set<string>(),
): FolderPath {
  if (folder.id === folderId) {
    return currentPath.add(folder.id);
  }

  for (const child of folder.childFolders) {
    const path = findFolderPath(child, folderId, currentPath.add(folder.id));
    if (path) {
      return path;
    }
  }

  return null;
}

const FolderComponent = memo(
  ({
    folder,
    folderId,
    setFolderId,
    folderPath,
    dataroomIndexEnabled,
  }: {
    folder: DataroomFolderWithDocuments;
    folderId: string | null;
    setFolderId: React.Dispatch<React.SetStateAction<string | null>>;
    folderPath: Set<string> | null;
    dataroomIndexEnabled?: boolean;
  }) => {
    const router = useRouter();

    // Get hierarchical display name for the folder
    const folderDisplayName = getHierarchicalDisplayName(
      folder.name,
      folder.hierarchicalIndex,
      dataroomIndexEnabled || false,
    );

    // Memoize the rendering of the current folder's documents
    const documents = useMemo(
      () =>
        folder.documents.map((doc) => (
          <ViewerDocumentFileItem
            key={doc.id}
            document={{
              ...doc,
              versions: [], // Not needed for display
            }}
            dataroomIndexEnabled={dataroomIndexEnabled}
          />
        )),
      [folder.documents, dataroomIndexEnabled],
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
            folderPath={folderPath}
            dataroomIndexEnabled={dataroomIndexEnabled}
          />
        )),
      [
        folder.childFolders,
        folderId,
        setFolderId,
        folderPath,
        dataroomIndexEnabled,
      ],
    );

    const isActive = folder.id === folderId;
    const isChildActive =
      folderPath?.has(folder.id) ||
      folder.childFolders.some((childFolder) => childFolder.id === folderId);

    return (
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setFolderId(folder.id);
        }}
      >
        <FileTree.Folder
          name={folderDisplayName}
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

const HomeLink = memo(
  ({
    folderId,
    setFolderId,
  }: {
    folderId: string | null;
    setFolderId: React.Dispatch<React.SetStateAction<string | null>>;
  }) => {
    return (
      <li
        className={cn(
          "flex list-none",
          "rounded-md text-foreground transition-all duration-200 ease-in-out",
          "hover:bg-gray-100 hover:shadow-sm hover:dark:bg-muted",
          "px-3 py-1.5 leading-6",
          folderId === null && "bg-gray-100 font-semibold dark:bg-muted",
        )}
      >
        <span
          className="inline-flex w-full cursor-pointer items-center"
          onClick={(e) => {
            e.preventDefault();
            setFolderId(null);
          }}
        >
          <HomeIcon className="h-5 w-5 shrink-0" aria-hidden="true" />
          <span className="ml-2 w-fit truncate" title="Home">
            Dataroom Home
          </span>
        </span>
      </li>
    );
  },
);
HomeLink.displayName = "HomeLink";

const SidebarFolders = ({
  folders,
  documents,
  folderId,
  setFolderId,
  dataroomIndexEnabled,
}: {
  folders: DataroomFolder[];
  documents: DataroomDocumentWithVersion[];
  folderId: string | null;
  setFolderId: React.Dispatch<React.SetStateAction<string | null>>;
  dataroomIndexEnabled?: boolean;
}) => {
  const nestedFolders = useMemo(() => {
    if (folders) {
      return buildNestedFolderStructureWithDocs(folders, documents);
    }
    return [];
  }, [folders, documents]);

  const folderPath = useMemo(() => {
    if (!folderId) {
      return null;
    }

    for (let i = 0; i < nestedFolders.length; i++) {
      const path = findFolderPath(nestedFolders[i], folderId);
      if (path) {
        return path;
      }
    }

    return null;
  }, [folders, documents, folderId]);

  return (
    <FileTree>
      <HomeLink folderId={folderId} setFolderId={setFolderId} />
      {nestedFolders.map((folder) => (
        <FolderComponent
          key={folder.id}
          folder={folder}
          folderId={folderId}
          setFolderId={setFolderId}
          folderPath={folderPath}
          dataroomIndexEnabled={dataroomIndexEnabled}
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
  dataroomIndexEnabled,
}: {
  folders: DataroomFolder[];
  documents: DataroomDocumentWithVersion[];
  setFolderId: React.Dispatch<React.SetStateAction<string | null>>;
  folderId: string | null;
  dataroomIndexEnabled?: boolean;
}) {
  if (!folders) return null;

  return (
    <SidebarFolders
      folders={folders}
      documents={documents}
      setFolderId={setFolderId}
      folderId={folderId}
      dataroomIndexEnabled={dataroomIndexEnabled}
    />
  );
}
