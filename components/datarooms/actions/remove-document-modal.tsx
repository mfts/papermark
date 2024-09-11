import { useRouter } from "next/router";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import { mutate } from "swr";

import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Modal } from "@/components/ui/modal";

import { useAnalytics } from "@/lib/analytics";

function RemoveDataroomDocumentsModal({
  showRemoveDataroomDocumentsModal,
  setShowRemoveDataroomDocumentsModal,
  documentIds,
  dataroomId,
  setSelectedDocuments,
}: {
  showRemoveDataroomDocumentsModal: boolean;
  setShowRemoveDataroomDocumentsModal: Dispatch<SetStateAction<boolean>>;
  documentIds: string[];
  dataroomId: string;
  setSelectedDocuments: Dispatch<SetStateAction<string[]>>;
}) {
  const router = useRouter();
  const folderPathName = router.query.name as string[] | undefined;
  const teamInfo = useTeam();
  const analytics = useAnalytics();

  const [deleting, setDeleting] = useState(false);

  async function removeDocuments(documentIds: string[]) {
    return new Promise(async (resolve, reject) => {
      setDeleting(true);

      try {
        const deletePromises = documentIds.map((documentId) =>
          fetch(
            `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}/documents/${documentId}`,
            { method: "DELETE" },
          ).then(async (res) => {
            if (!res.ok) {
              const error = await res.json();
              throw new Error(
                `Failed to remove dataroom document ${documentId}: ${error.message}`,
              );
            }
            analytics.capture("Dataroom Document Removed", {
              team: teamInfo?.currentTeam?.id,
              documentId,
            });
            return documentId; // Return the ID of the successfully removed document
          }),
        );

        const results = await Promise.allSettled(deletePromises);

        const successfullyDeletedDocuments = results
          .filter((result) => result.status === "fulfilled")
          .map((result) => (result as PromiseFulfilledResult<string>).value);

        const errors = results
          .filter((result) => result.status === "rejected")
          .map((result) => (result as PromiseRejectedResult).reason);

        // Deselect only the successfully deleted documents
        setSelectedDocuments((prevSelected) =>
          prevSelected.filter(
            (id) => !successfullyDeletedDocuments.includes(id),
          ),
        );

        // Call mutate only once, after all deletions
        await mutate(
          `/api/teams/${teamInfo?.currentTeam?.id}/datarooms/${dataroomId}${folderPathName ? `/folders/documents/${folderPathName.join("/")}` : "/documents"}`,
        );

        setDeleting(false);

        if (errors.length) {
          reject(errors);
        } else {
          resolve(null);
        }
      } catch (error) {
        setDeleting(false);
        reject((error as Error).message);
      } finally {
        setShowRemoveDataroomDocumentsModal(false);
      }
    });
  }

  return (
    <Modal
      showModal={showRemoveDataroomDocumentsModal}
      setShowModal={setShowRemoveDataroomDocumentsModal}
    >
      <div className="flex flex-col items-center justify-center space-y-3 border-b border-border bg-white px-4 py-4 pt-8 dark:border-gray-900 dark:bg-gray-900 sm:px-8">
        <DialogTitle className="text-2xl">
          Remove {documentIds.length} Document{documentIds.length > 1 && "s"}
        </DialogTitle>
        <DialogDescription>
          Existing views will not be affected. You can always add removed
          documents back to the dataroom.
        </DialogDescription>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          toast.promise(removeDocuments(documentIds), {
            loading: "Removing documents...",
            success: "Documents removed successfully!",
            error: (err) => err,
          });
        }}
        className="flex flex-col space-y-6 bg-muted px-4 py-8 text-left dark:bg-gray-900 sm:px-8"
      >
        <Button variant="destructive" loading={deleting}>
          Remove documents
        </Button>
      </form>
    </Modal>
  );
}

export function useRemoveDataroomDocumentsModal({
  documentIds,
  dataroomId,
  setSelectedDocuments,
}: {
  documentIds: string[];
  dataroomId: string;
  setSelectedDocuments: Dispatch<SetStateAction<string[]>>;
}) {
  const [
    showRemoveDataroomDocumentsModal,
    setShowRemoveDataroomDocumentsModal,
  ] = useState(false);

  const RemoveDataroomDocumentsModalCallback = useCallback(() => {
    return (
      <RemoveDataroomDocumentsModal
        showRemoveDataroomDocumentsModal={showRemoveDataroomDocumentsModal}
        setShowRemoveDataroomDocumentsModal={
          setShowRemoveDataroomDocumentsModal
        }
        documentIds={documentIds}
        dataroomId={dataroomId}
        setSelectedDocuments={setSelectedDocuments}
      />
    );
  }, [
    showRemoveDataroomDocumentsModal,
    setShowRemoveDataroomDocumentsModal,
    documentIds,
    dataroomId,
    setSelectedDocuments,
  ]);

  return useMemo(
    () => ({
      setShowRemoveDataroomDocumentsModal,
      RemoveDataroomDocumentsModal: RemoveDataroomDocumentsModalCallback,
    }),
    [setShowRemoveDataroomDocumentsModal, RemoveDataroomDocumentsModalCallback],
  );
}
