import { FileTree } from "@/components/ui/nextra-filetree";
import { memo, useMemo } from "react";
import { buildNestedFolderStructure } from "./utils";
import {
  DataroomFolderWithDocuments,
  useDataroomFoldersTree,
} from "@/lib/swr/use-dataroom";

const FolderComponentSelection = memo(
  ({
    folder,
    selectedFolderId,
    setFolderId,
  }: {
    folder: DataroomFolderWithDocuments;
    selectedFolderId: string;
    setFolderId: React.Dispatch<React.SetStateAction<string>>;
  }) => {
    // Recursively render child folders if they exist
    const childFolders = useMemo(
      () =>
        folder.childFolders.map((childFolder) => (
          <FolderComponentSelection
            key={childFolder.id}
            folder={childFolder}
            selectedFolderId={selectedFolderId}
            setFolderId={setFolderId}
          />
        )),
      [folder.childFolders, selectedFolderId, setFolderId],
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
          active={folder.id === selectedFolderId}
        >
          {childFolders}
        </FileTree.Folder>
      </div>
    );
  },
);
FolderComponentSelection.displayName = "FolderComponentSelection";

const SidebarFoldersSelectipon = ({
  folders,
  selectedFolderId,
  setFolderId,
}: {
  folders: DataroomFolderWithDocuments[];
  selectedFolderId: string;
  setFolderId: React.Dispatch<React.SetStateAction<string>>;
}) => {
  const nestedFolders = useMemo(() => {
    if (folders) {
      return buildNestedFolderStructure(folders);
    }
    return [];
  }, [folders]);

  return (
    <FileTree>
      {nestedFolders.map((folder) => (
        <FolderComponentSelection
          key={folder.id}
          folder={folder}
          selectedFolderId={selectedFolderId}
          setFolderId={setFolderId}
        />
      ))}
    </FileTree>
  );
};

export function SidebarFolderTreeSelection({
  dataroomId,
  selectedFolderId,
  setFolderId,
}: {
  dataroomId: string;
  selectedFolderId: string;
  setFolderId: React.Dispatch<React.SetStateAction<string>>;
}) {
  const { folders, error } = useDataroomFoldersTree({ dataroomId });

  if (!folders || error) return null;

  return (
    <SidebarFoldersSelectipon
      folders={folders}
      selectedFolderId={selectedFolderId}
      setFolderId={setFolderId}
    />
  );
}
