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
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

import { useAnalytics } from "@/lib/analytics";

function DeleteDocumentsModal({
  showDeleteDocumentsModal,
  setShowDeleteDocumentsModal,
  documentIds,
  setSelectedDocuments,
}: {
  showDeleteDocumentsModal: boolean;
  setShowDeleteDocumentsModal: Dispatch<SetStateAction<boolean>>;
  documentIds: string[];
  setSelectedDocuments: Dispatch<SetStateAction<string[]>>;
}) {
  const router = useRouter();
  const folderPathName = router.query.name as string[] | undefined;
  const teamInfo = useTeam();
  const analytics = useAnalytics();

  const [deleting, setDeleting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Check if the input matches the pattern
    if (value === "permanently delete") {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  };

  async function deleteDocuments(documentIds: string[]) {
    return new Promise(async (resolve, reject) => {
      setDeleting(true);

      try {
        const deletePromises = documentIds.map((documentId) =>
          fetch(
            `/api/teams/${teamInfo?.currentTeam?.id}/documents/${documentId}`,
            {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
            },
          ).then(async (res) => {
            if (!res.ok) {
              const error = await res.json();
              throw new Error(
                `Failed to delete document ${documentId}: ${error.message}`,
              );
            }
            analytics.capture("Document Deleted", {
              team: teamInfo?.currentTeam?.id,
              documentId,
            });
            return documentId; // Return the ID of the successfully deleted document
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
          `/api/teams/${teamInfo?.currentTeam?.id}/${folderPathName ? `folders/documents/${folderPathName.join("/")}` : "documents"}`,
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
        setShowDeleteDocumentsModal(false);
      }
    });
  }

  return (
    <Modal
      showModal={showDeleteDocumentsModal}
      setShowModal={setShowDeleteDocumentsModal}
      noBackdropBlur
    >
      <div className="flex flex-col items-center justify-center space-y-3 border-b border-border bg-white px-4 py-4 pt-8 dark:border-gray-900 dark:bg-gray-900 sm:px-8">
        <DialogTitle className="text-2xl">
          Delete {documentIds.length} Document{documentIds.length > 1 && "s"}
        </DialogTitle>
        <DialogDescription>
          Warning: This will permanently delete your selected documents, all
          associated links and their respective views.
        </DialogDescription>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          toast.promise(deleteDocuments(documentIds), {
            loading: "Deleting documents...",
            success: "Documents deleted successfully!",
            error: (err) => err,
          });
        }}
        className="flex flex-col space-y-6 bg-muted px-4 py-8 text-left dark:bg-gray-900 sm:px-8"
      >
        <div>
          <label
            htmlFor="verification"
            className="block text-sm text-muted-foreground"
          >
            To confirm deletion, type{" "}
            <span className="font-semibold text-foreground">
              permanently delete
            </span>{" "}
            below
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <Input
              type="text"
              name="verification"
              id="verification"
              pattern="permanently delete"
              required
              autoComplete="off"
              className="bg-white dark:border-gray-500 dark:bg-gray-800 focus:dark:bg-transparent"
              onInput={handleInputChange}
            />
          </div>
        </div>

        <Button variant="destructive" loading={deleting} disabled={!isValid}>
          Confirm delete documents
        </Button>
      </form>
    </Modal>
  );
}

export function useDeleteDocumentsModal({
  documentIds,
  setSelectedDocuments,
}: {
  documentIds: string[];
  setSelectedDocuments: Dispatch<SetStateAction<string[]>>;
}) {
  const [showDeleteDocumentsModal, setShowDeleteDocumentsModal] =
    useState(false);

  const DeleteDocumentsModalCallback = useCallback(() => {
    return (
      <DeleteDocumentsModal
        showDeleteDocumentsModal={showDeleteDocumentsModal}
        setShowDeleteDocumentsModal={setShowDeleteDocumentsModal}
        documentIds={documentIds}
        setSelectedDocuments={setSelectedDocuments}
      />
    );
  }, [
    showDeleteDocumentsModal,
    setShowDeleteDocumentsModal,
    documentIds,
    setSelectedDocuments,
  ]);

  return useMemo(
    () => ({
      setShowDeleteDocumentsModal,
      DeleteDocumentsModal: DeleteDocumentsModalCallback,
    }),
    [setShowDeleteDocumentsModal, DeleteDocumentsModalCallback],
  );
}
