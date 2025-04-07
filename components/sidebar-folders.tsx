import { useRouter } from "next/router";

import { memo, useMemo } from "react";

import { FileTree } from "@/components/ui/nextra-filetree";

import { FolderWithDocuments, useFolders } from "@/lib/swr/use-documents";
import { cn } from "@/lib/utils";

import { TSelectedFolder } from "./documents/move-folder-modal";

// Helper function to build nested folder structure
const buildNestedFolderStructure = (folders: FolderWithDocuments[]) => {
  const folderMap = new Map();

  // Initialize every folder with an additional childFolders property
  folders.forEach((folder) => {
    folderMap.set(folder.id, { ...folder, childFolders: [] });
  });

  const rootFolders: FolderWithDocuments[] = [];

  folderMap.forEach((folder, id) => {
    if (folder.parentId) {
      const parent = folderMap.get(folder.parentId);
      parent.childFolders.push(folder);
    } else {
      rootFolders.push(folder);
    }
  });

  return rootFolders;
};

const FolderComponent = memo(({ folder }: { folder: FolderWithDocuments }) => {
  const router = useRouter();

  // Memoize the rendering of the current folder's documents
  const documents = useMemo(
    () =>
      folder.documents.map((doc) => (
        <FileTree.File
          key={doc.id}
          name={doc.name}
          onToggle={() => router.push(`/documents/${doc.id}`)}
        />
      )),
    [folder.documents, router],
  );

  // Recursively render child folders if they exist
  const childFolders = useMemo(
    () =>
      folder.childFolders.map((childFolder) => (
        <FolderComponent key={childFolder.id} folder={childFolder} />
      )),
    [folder.childFolders],
  );

  const isActive =
    folder.path === "/" + (router.query.name as string[])?.join("/");
  const isChildActive = folder.childFolders.some(
    (childFolder) =>
      childFolder.path === "/" + (router.query.name as string[])?.join("/"),
  );

  const handleFolderClick = () => {
    router.push(
      `/documents/tree${folder.path}`,
      `/documents/tree${folder.path}`,
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
      className={cn("hover:bg-gray-200", isActive && "bg-gray-200")}
    >
      {childFolders}
      {documents}
    </FileTree.Folder>
  );
});
FolderComponent.displayName = "FolderComponent";

const FolderComponentSelection = memo(
  ({
    folder,
    selectedFolder,
    setSelectedFolder,
    disableId,
  }: {
    disableId?: string[];
    folder: FolderWithDocuments;
    selectedFolder: TSelectedFolder;
    setSelectedFolder: React.Dispatch<React.SetStateAction<TSelectedFolder>>;
  }) => {
    // Recursively render child folders if they exist
    const childFolders = useMemo(
      () =>
        folder.childFolders.map((childFolder) => (
          <FolderComponentSelection
            key={childFolder.id}
            folder={childFolder}
            selectedFolder={selectedFolder}
            setSelectedFolder={setSelectedFolder}
            disableId={disableId}
          />
        )),
      [folder.childFolders, selectedFolder, setSelectedFolder, disableId],
    );

    const isActive = folder.id === selectedFolder?.id;
    const isChildActive = folder.childFolders.some(
      (childFolder) => childFolder.id === selectedFolder?.id,
    );
    const isDisabled = disableId?.includes(folder.id);
    return (
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (isDisabled) return;
          setSelectedFolder({
            id: folder.id,
            name: folder.name,
            path: folder.path,
          });
        }}
      >
        <FileTree.Folder
          disable={isDisabled}
          name={folder.name}
          key={folder.id}
          active={isActive}
          childActive={isChildActive}
          onToggle={() => {
            if (isDisabled) return;
            setSelectedFolder({
              id: folder.id,
              name: folder.name,
              path: folder.path,
            });
          }}
        >
          {childFolders}
        </FileTree.Folder>
      </div>
    );
  },
);
FolderComponentSelection.displayName = "FolderComponentSelection";

const SidebarFolders = ({ folders }: { folders: FolderWithDocuments[] }) => {
  const nestedFolders = useMemo(() => {
    if (folders) {
      return buildNestedFolderStructure(folders);
    }
    return [];
  }, [folders]);

  return (
    <FileTree>
      {nestedFolders.map((folder) => (
        <FolderComponent key={folder.id} folder={folder} />
      ))}
    </FileTree>
  );
};

export default function SidebarFolderTree() {
  const { folders, error } = useFolders();

  if (!folders || error) return null;

  return <SidebarFolders folders={folders} />;
}

const SidebarFoldersSelection = ({
  folders,
  selectedFolder,
  setSelectedFolder,
  disableId,
}: {
  disableId?: string[];
  folders: FolderWithDocuments[];
  selectedFolder: TSelectedFolder;
  setSelectedFolder: React.Dispatch<React.SetStateAction<TSelectedFolder>>;
}) => {
  const nestedFolders = useMemo(() => {
    if (folders) {
      return buildNestedFolderStructure(folders);
    }
    return [];
  }, [folders]);

  // Create a virtual "Home" folder
  const homeFolder: Partial<FolderWithDocuments> = {
    // @ts-ignore
    id: null,
    name: "Home",
    path: "/",
    childFolders: nestedFolders,
    documents: [],
  };

  return (
    <FileTree>
      {/* {nestedFolders.map((folder) => ( */}
      <FolderComponentSelection
        // key={folder.id}
        // @ts-ignore
        folder={homeFolder}
        selectedFolder={selectedFolder}
        setSelectedFolder={setSelectedFolder}
        disableId={disableId}
      />
      {/* ))} */}
    </FileTree>
  );
};

export function SidebarFolderTreeSelection({
  selectedFolder,
  setSelectedFolder,
  disableId,
}: {
  selectedFolder: TSelectedFolder;
  disableId?: string[];
  setSelectedFolder: React.Dispatch<React.SetStateAction<TSelectedFolder>>;
}) {
  const { folders, error } = useFolders();

  if (!folders || error) return null;

  return (
    <SidebarFoldersSelection
      folders={folders}
      selectedFolder={selectedFolder}
      setSelectedFolder={setSelectedFolder}
      disableId={disableId}
    />
  );
}
