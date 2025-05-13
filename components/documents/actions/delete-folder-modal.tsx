import { useCallback, useMemo, useState } from "react";

import { toast } from "sonner";
import { mutate } from "swr";

import { DataroomFolderWithCount } from "@/lib/swr/use-dataroom";
import { FolderWithCount } from "@/lib/swr/use-documents";

import { DeleteFolderModal } from "../delete-folder-modal";

export function useDeleteFolderModal(
  teamInfo: any,
  isDataroom?: boolean,
  dataroomId?: string,
) {
  const [deleteModalOpen, setDeleteModalOpen] = useState<boolean>(false);
  const [folderToDelete, setFolderToDelete] = useState<
    FolderWithCount | DataroomFolderWithCount | null
  >(null);
  const parentFolderPath = folderToDelete?.path.substring(
    0,
    folderToDelete?.path.lastIndexOf("/"),
  );

  const DeleteFolderModalCallback = useCallback(() => {
    if (!deleteModalOpen || !folderToDelete) return null;

    const handleDeleteFolder = async (folderId: string) => {
      const endpointTargetType =
        isDataroom && dataroomId
          ? `datarooms/${dataroomId}/folders`
          : "folders";

      toast.promise(
        fetch(
          `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}/manage/${folderId}`,
          {
            method: "DELETE",
          },
        ),
        {
          loading: isDataroom ? "Removing folder..." : "Deleting folder...",
          success: () => {
            mutate(
              `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}?root=true`,
            );
            mutate(
              `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}`,
            );
            mutate(
              `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}${parentFolderPath}`,
            );
            return isDataroom
              ? "Folder removed successfully."
              : `Folder deleted successfully with ${folderToDelete?._count.documents} documents and ${folderToDelete?._count.childFolders} folders`;
          },
          error: isDataroom
            ? "Failed to remove folder."
            : "Failed to delete folder. Move documents first.",
        },
      );
    };

    return (
      <DeleteFolderModal
        folderId={folderToDelete.id}
        open={deleteModalOpen}
        setOpen={setDeleteModalOpen}
        folderName={folderToDelete.name}
        documents={folderToDelete._count.documents}
        childFolders={folderToDelete._count.childFolders}
        isDataroom={isDataroom}
        handleButtonClick={(event, folderId) => {
          event.stopPropagation();
          event.preventDefault();
          setDeleteModalOpen(false);
          handleDeleteFolder(folderId);
        }}
      />
    );
  }, [
    deleteModalOpen,
    folderToDelete,
    teamInfo,
    isDataroom,
    dataroomId,
    parentFolderPath,
  ]);

  return useMemo(
    () => ({
      setDeleteModalOpen,
      setFolderToDelete,
      DeleteFolderModal: DeleteFolderModalCallback,
    }),
    [DeleteFolderModalCallback],
  );
}
