import { useRouter } from "next/router";
import { FileTree } from "@/components/ui/nextra-filetree";
import { memo, useMemo } from "react";
import {
  useDataroomFoldersTree,
  type DRFolderWithDocuments,
} from "@/lib/swr/use-dataroom";

// Helper function to build nested folder structure
const buildNestedFolderStructure = (folders: DRFolderWithDocuments[]) => {
  const folderMap = new Map();

  // Initialize every folder with an additional childFolders property
  folders.forEach((folder) => {
    folderMap.set(folder.id, { ...folder, childFolders: [] });
  });

  const rootFolders: DRFolderWithDocuments[] = [];

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

const FolderComponent = memo(
  ({ folder }: { folder: DRFolderWithDocuments }) => {
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
      [folder.documents, router.query.name],
    );

    // Recursively render child folders if they exist
    const childFolders = useMemo(
      () =>
        folder.childFolders.map((childFolder) => (
          <FolderComponent key={childFolder.id} folder={childFolder} />
        )),
      [folder.childFolders],
    );

    return (
      <FileTree.Folder
        name={folder.name}
        key={folder.id}
        active={
          folder.path === "/" + (router.query.name as string[])?.join("/")
        }
        childActive={router.query.name?.includes(folder.name)}
        onToggle={() => router.push(`/documents/tree${folder.path}`)}
      >
        {childFolders}
        {documents}
      </FileTree.Folder>
    );
  },
);
FolderComponent.displayName = "FolderComponent";

const FolderComponentSelection = memo(
  ({
    folder,
    selectedFolderId,
    setFolderId,
    selectedDocumentId,
    setDocumentId,
  }: {
    folder: DRFolderWithDocuments;
    selectedFolderId: string;
    setFolderId: React.Dispatch<React.SetStateAction<string>>;
    selectedDocumentId?: string;
    setDocumentId?: React.Dispatch<React.SetStateAction<string>>;
  }) => {
    const router = useRouter();
    // Memoize the rendering of the current folder's documents
    const documents = useMemo(
      () =>
        folder.documents.map((doc) => (
          <div
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDocumentId(doc.id);
            }}
          >
            <FileTree.File
              key={doc.id}
              name={doc.document.name}
              // onToggle={() => router.push(`/documents/${doc.id}`)}
            />
          </div>
        )),
      [folder.documents, router.query.name, selectedDocumentId, setDocumentId],
    );
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
          {documents}
        </FileTree.Folder>
      </div>
    );
  },
);
FolderComponentSelection.displayName = "FolderComponentSelection";

const DataroomFolders = ({ folders }: { folders: DRFolderWithDocuments[] }) => {
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

export function DataroomFolderTree({ dataroomId }: { dataroomId: string }) {
  const { folders, error } = useDataroomFoldersTree({ dataroomId });

  if (!folders || error) return null;

  return <DataroomFolders folders={folders} />;
}

const DataroomFoldersSelection = ({
  folders,
  selectedFolderId,
  setFolderId,
  selectedDocumentId,
  setDocumentId,
}: {
  folders: DRFolderWithDocuments[];
  selectedFolderId: string;
  setFolderId: React.Dispatch<React.SetStateAction<string>>;
  selectedDocumentId?: string;
  setDocumentId?: React.Dispatch<React.SetStateAction<string>>;
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
          selectedDocumentId={selectedDocumentId}
          setDocumentId={setDocumentId}
        />
      ))}
    </FileTree>
  );
};

export function DataroomFolderTreeSelection({
  dataroomId,
  selectedFolderId,
  setFolderId,
  selectedDocumentId,
  setDocumentId,
}: {
  dataroomId: string;
  selectedFolderId: string;
  setFolderId: React.Dispatch<React.SetStateAction<string>>;
  selectedDocumentId?: string;
  setDocumentId?: React.Dispatch<React.SetStateAction<string>>;
}) {
  const { folders, error } = useDataroomFoldersTree({ dataroomId });

  if (!folders || error) return null;

  return (
    <DataroomFoldersSelection
      folders={folders}
      selectedFolderId={selectedFolderId}
      setFolderId={setFolderId}
      selectedDocumentId={selectedDocumentId}
      setDocumentId={setDocumentId}
    />
  );
}
