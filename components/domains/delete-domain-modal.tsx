import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

import { useAnalytics } from "@/lib/analytics";

function DeleteDomainModal({
  showDeleteDomainModal,
  setShowDeleteDomainModal,
  domain,
  onDelete,
}: {
  showDeleteDomainModal: boolean;
  setShowDeleteDomainModal: Dispatch<SetStateAction<boolean>>;
  domain: string;
  onDelete: (deletedDomain: string) => void;
}) {
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

  async function deleteDomain() {
    return new Promise(async (resolve, reject) => {
      setDeleting(true);

      try {
        const response = await fetch(
          `/api/teams/${teamInfo?.currentTeam?.id}/domains/${domain}`,
          {
            method: "DELETE",
          },
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        analytics.capture("Domain Deleted", {
          slug: domain,
          teamId: teamInfo?.currentTeam?.id,
        });

        // Update local data by filtering out the deleted domain
        onDelete(domain);
        setDeleting(false);
        resolve(null);
      } catch (error) {
        setDeleting(false);
        reject((error as Error).message);
      } finally {
        setShowDeleteDomainModal(false);
      }
    });
  }

  return (
    <Modal
      showModal={showDeleteDomainModal}
      setShowModal={setShowDeleteDomainModal}
      noBackdropBlur
    >
      <div className="flex flex-col items-center justify-center space-y-3 border-b border-border bg-white px-4 py-4 pt-8 dark:border-gray-900 dark:bg-gray-900 sm:px-8">
        <DialogTitle className="text-2xl">Delete Domain</DialogTitle>
        <DialogDescription>
          This will permanently delete your domain. Links using this domain will
          be reset to <span className="font-medium">papermark.com</span> links.
          This action cannot be undone.
          <div className="mt-3 text-sm font-medium text-foreground">
            {domain}{" "}
            <span className="text-muted-foreground">→ papermark.com</span>
          </div>
        </DialogDescription>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          toast.promise(deleteDomain(), {
            loading: "Deleting domain...",
            success: "Domain deleted successfully!",
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
          Confirm delete domain
        </Button>
      </form>
    </Modal>
  );
}

export function useDeleteDomainModal({
  domain,
  onDelete,
}: {
  domain: string;
  onDelete: (deletedDomain: string) => void;
}) {
  const [showDeleteDomainModal, setShowDeleteDomainModal] = useState(false);

  const DeleteDomainModalCallback = useCallback(() => {
    return (
      <DeleteDomainModal
        showDeleteDomainModal={showDeleteDomainModal}
        setShowDeleteDomainModal={setShowDeleteDomainModal}
        domain={domain}
        onDelete={onDelete}
      />
    );
  }, [showDeleteDomainModal, setShowDeleteDomainModal, domain, onDelete]);

  return useMemo(
    () => ({
      setShowDeleteDomainModal,
      DeleteDomainModal: DeleteDomainModalCallback,
    }),
    [setShowDeleteDomainModal, DeleteDomainModalCallback],
  );
}
