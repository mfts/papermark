import { useRouter } from "next/router";

import {
  Dispatch,
  FormEvent,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";

import { useTeam } from "@/context/team-context";
import { toast } from "sonner";
import { mutate } from "swr";

import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

import { useAnalytics } from "@/lib/analytics";
import { useMediaQuery } from "@/lib/utils/use-media-query";

function DeleteGroupModal({
  dataroomId,
  groupName,
  groupId,
  showDeleteGroupModal,
  setShowDeleteGroupModal,
}: {
  dataroomId: string;
  groupName: string;
  groupId: string;
  showDeleteGroupModal: boolean;
  setShowDeleteGroupModal: Dispatch<SetStateAction<boolean>>;
}) {
  const router = useRouter();
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;
  const analytics = useAnalytics();

  const [deleting, setDeleting] = useState(false);
  const [groupNameValue, setGroupNameValue] = useState('');

  async function deleteGroup() {
    return new Promise((resolve, reject) => {
      setDeleting(true);

      fetch(`/api/teams/${teamId}/datarooms/${dataroomId}/groups/${groupId}`, {
        method: "DELETE",
      }).then(async (res) => {
        if (res.ok) {
          analytics.capture("Group Deleted", {
            dataroomId: dataroomId,
            groupName: groupName,
            groupId: groupId,
          });
          await mutate(`/api/teams/${teamId}/datarooms/${dataroomId}/groups`);
          router.push(`/datarooms/${dataroomId}/groups`);
          resolve(null);
        } else {
          setDeleting(false);
          const error = await res.json();
          reject(error.message);
        }
      });
    });
  }

  const handleChange = (event: FormEvent<HTMLInputElement>) => {
    const inputValue = (event.target as HTMLInputElement).value;
    const trimmedValue = inputValue.replace(/\s+$/, ''); // Trim spaces at the end

    // Check if the trimmed value matches the groupName
    if (trimmedValue === groupName) {
      // If it matches the groupName, prevent further spaces
      setGroupNameValue(trimmedValue);
    } else if (groupName.startsWith(trimmedValue)) {
      // Allow spaces only when partially matching
      setGroupNameValue(inputValue);
    } else {
      // If it doesn't match or partially match, set the trimmed value
      setGroupNameValue(trimmedValue);
    }
  };

  const { isMobile } = useMediaQuery();

  return (
    <Modal
      showModal={showDeleteGroupModal}
      setShowModal={setShowDeleteGroupModal}
    >
      <div className="flex flex-col items-center justify-center space-y-3 border-b border-border bg-white px-4 py-4 pt-8 dark:border-gray-900 dark:bg-gray-900 sm:px-8">
        <CardTitle>Delete Group</CardTitle>
        <CardDescription>
          Warning: This will permanently delete your dataroom group, all
          associated links and their respective views.
        </CardDescription>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          toast.promise(deleteGroup(), {
            loading: "Deleting group...",
            success: "Group deleted successfully!",
            error: (err) => err,
          });
        }}
        className="flex flex-col space-y-6 bg-muted px-4 py-8 text-left dark:bg-gray-900 sm:px-8"
      >
        <div>
          <label
            htmlFor="group-name"
            className="block text-sm font-medium text-muted-foreground"
          >
            Enter the group name{" "}
            <span className="font-semibold text-foreground">{groupName}</span>{" "}
            to continue:
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <Input
              type="text"
              name="group-name"
              id="group-name"
              autoFocus={!isMobile}
              autoComplete="off"
              required
              value={groupNameValue}
              onChange={handleChange}
              className="bg-white dark:border-gray-500 dark:bg-gray-800 focus:dark:bg-transparent"
            />
          </div>
        </div>

        <Button variant="destructive" loading={deleting}>
          Confirm delete group
        </Button>
      </form>
    </Modal>
  );
}

export function useDeleteGroupModal({
  dataroomId,
  groupId,
  groupName,
}: {
  dataroomId: string;
  groupId: string;
  groupName: string;
}) {
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);

  const DeleteGroupModalCallback = useCallback(() => {
    return (
      <DeleteGroupModal
        dataroomId={dataroomId}
        groupId={groupId}
        groupName={groupName}
        showDeleteGroupModal={showDeleteGroupModal}
        setShowDeleteGroupModal={setShowDeleteGroupModal}
      />
    );
  }, [showDeleteGroupModal, setShowDeleteGroupModal]);

  return useMemo(
    () => ({
      setShowDeleteGroupModal,
      DeleteGroupModal: DeleteGroupModalCallback,
    }),
    [setShowDeleteGroupModal, DeleteGroupModalCallback],
  );
}
