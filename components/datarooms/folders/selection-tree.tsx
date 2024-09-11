import { memo, useMemo } from "react";

import { TSelectedFolder } from "@/components/documents/move-folder-modal";
import { FileTree } from "@/components/ui/nextra-filetree";

import {
  DataroomFolderWithDocuments,
  useDataroomFoldersTree,
} from "@/lib/swr/use-dataroom";

import { buildNestedFolderStructure } from "./utils";

const FolderComponentSelection = memo(
  ({
    folder,
    selectedFolder,
    setSelectedFolder,
  }: {
    folder: DataroomFolderWithDocuments;
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
          />
        )),
      [folder.childFolders, selectedFolder, setSelectedFolder],
    );

    const isActive = folder.id === selectedFolder?.id;
    const isChildActive = folder.childFolders.some(
      (childFolder) => childFolder.id === selectedFolder?.id,
    );

    return (
      <div
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSelectedFolder({ id: folder.id, name: folder.name });
        }}
      >
        <FileTree.Folder
          name={folder.name}
          key={folder.id}
          active={isActive}
          childActive={isChildActive}
          onToggle={() =>
            setSelectedFolder({ id: folder.id, name: folder.name })
          }
        >
          {childFolders}
        </FileTree.Folder>
      </div>
    );
  },
);
FolderComponentSelection.displayName = "FolderComponentSelection";

const SidebarFoldersSelection = ({
  folders,
  selectedFolder,
  setSelectedFolder,
}: {
  folders: DataroomFolderWithDocuments[];
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
  const homeFolder: Partial<DataroomFolderWithDocuments> = {
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
      />
      {/* ))} */}
    </FileTree>
  );
};

export function SidebarFolderTreeSelection({
  dataroomId,
  selectedFolder,
  setSelectedFolder,
}: {
  dataroomId: string;
  selectedFolder: TSelectedFolder;
  setSelectedFolder: React.Dispatch<React.SetStateAction<TSelectedFolder>>;
}) {
  const { folders, error } = useDataroomFoldersTree({ dataroomId });

  if (!folders || error) return null;

  return (
    <SidebarFoldersSelection
      folders={folders}
      selectedFolder={selectedFolder}
      setSelectedFolder={setSelectedFolder}
    />
  );
}
