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
import { LinkWithViews } from "@/lib/types";

function DeleteLinkModal({
  showDeleteLinkModal,
  setShowDeleteLinkModal,
  link,
  targetType,
}: {
  showDeleteLinkModal: boolean;
  setShowDeleteLinkModal: Dispatch<SetStateAction<boolean>>;
  link: LinkWithViews | null;
  targetType: "DOCUMENT" | "DATAROOM";
}) {
  const router = useRouter();
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

  async function deleteLink(linkId: string) {
    return new Promise(async (resolve, reject) => {
      setDeleting(true);

      try {
        const response = await fetch(`/api/links/${linkId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to delete link");
        }

        analytics.capture("Link Deleted", {
          team: teamInfo?.currentTeam?.id,
          linkId,
          linkType: link?.linkType,
          viewCount: link?._count.views || 0,
        });

        // Mutate the links cache based on target type
        const endpointTargetType = `${targetType.toLowerCase()}s`; // "documents" or "datarooms"
        const targetId = link?.documentId || link?.dataroomId;

        await mutate(
          `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}/${encodeURIComponent(
            targetId ?? "",
          )}/links`,
        );

        // If this is a group link, also mutate the group-specific links cache
        if (link?.groupId) {
          await mutate(
            `/api/teams/${teamInfo?.currentTeam?.id}/${endpointTargetType}/${encodeURIComponent(
              targetId ?? "",
            )}/groups/${link.groupId}/links`,
          );
        }

        setDeleting(false);
        setShowDeleteLinkModal(false);
        resolve(null);
      } catch (error) {
        setDeleting(false);
        reject((error as Error).message);
      }
    });
  }

  if (!link) return null;

  const viewCount = link._count.views || 0;

  return (
    <Modal
      showModal={showDeleteLinkModal}
      setShowModal={setShowDeleteLinkModal}
      noBackdropBlur
    >
      <div className="flex flex-col items-center justify-center space-y-3 border-b border-border bg-white px-4 py-4 pt-8 dark:border-gray-900 dark:bg-gray-900 sm:px-8">
        <DialogTitle className="text-2xl">Delete Link</DialogTitle>
        <DialogDescription className="space-y-2">
          <p>
            <strong>Warning</strong>: This will permanently delete the link{" "}
            <span className="font-semibold">
              {link.name || `Link #${link.id.slice(-5)}`}
            </span>{" "}
            and all associated data.
          </p>
          <p>
            This includes <strong>{viewCount} view{viewCount !== 1 ? "s" : ""}</strong> and all
            visitor analytics. This action cannot be undone.
          </p>
        </DialogDescription>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          toast.promise(deleteLink(link.id), {
            loading: "Deleting link...",
            success: "Link deleted successfully!",
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

        <Button
          variant="destructive"
          type="submit"
          loading={deleting}
          disabled={!isValid}
        >
          Confirm delete link
        </Button>
      </form>
    </Modal>
  );
}

export function useDeleteLinkModal({
  link,
  targetType,
}: {
  link: LinkWithViews | null;
  targetType: "DOCUMENT" | "DATAROOM";
}) {
  const [showDeleteLinkModal, setShowDeleteLinkModal] = useState(false);

  const DeleteLinkModalCallback = useCallback(() => {
    return (
      <DeleteLinkModal
        showDeleteLinkModal={showDeleteLinkModal}
        setShowDeleteLinkModal={setShowDeleteLinkModal}
        link={link}
        targetType={targetType}
      />
    );
  }, [showDeleteLinkModal, setShowDeleteLinkModal, link, targetType]);

  return useMemo(
    () => ({
      setShowDeleteLinkModal,
      DeleteLinkModal: DeleteLinkModalCallback,
    }),
    [setShowDeleteLinkModal, DeleteLinkModalCallback],
  );
}
