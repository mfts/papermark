import { useRouter } from "next/router";

import {
  Dispatch,
  SetStateAction,
  useCallback,
  useMemo,
  useState,
} from "react";

import { TeamContextType, useTeam } from "@/context/team-context";
import { signOut } from "next-auth/react";
import { toast } from "sonner";
import { mutate } from "swr";

import { Button } from "@/components/ui/button";
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";

import { useAnalytics } from "@/lib/analytics";
import { useMediaQuery } from "@/lib/utils/use-media-query";

function DeleteTeamModal({
  showDeleteTeamModal,
  setShowDeleteTeamModal,
}: {
  showDeleteTeamModal: boolean;
  setShowDeleteTeamModal: Dispatch<SetStateAction<boolean>>;
}) {
  const router = useRouter();
  const teamInfo = useTeam();
  const analytics = useAnalytics();

  const [deleting, setDeleting] = useState(false);
  const [isValid, setIsValid] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    // Check if the input matches the pattern
    if (value === "confirm delete team") {
      setIsValid(true);
    } else {
      setIsValid(false);
    }
  };

  async function deleteTeam() {
    const teamsCount = teamInfo?.teams.length ?? 1;

    return new Promise((resolve, reject) => {
      setDeleting(true);

      fetch(`/api/teams/${teamInfo?.currentTeam?.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      }).then(async (res) => {
        if (res.ok) {
          analytics.capture("Account Deleted", {
            teamName: teamInfo?.currentTeam?.name,
            teamId: teamInfo?.currentTeam?.id,
          });
          await mutate("/api/teams");
          console.log("teamsCount", teamsCount);
          teamsCount > 1 ? router.push("/documents") : signOut();
          resolve(null);
        } else {
          setDeleting(false);
          const error = await res.json();
          reject(error.message);
        }
      });
    });
  }

  const { isMobile } = useMediaQuery();

  return (
    <Modal
      showModal={showDeleteTeamModal}
      setShowModal={setShowDeleteTeamModal}
    >
      <div className="flex flex-col items-center justify-center space-y-3 border-b border-border bg-white px-4 py-4 pt-8 dark:border-gray-900 dark:bg-gray-900 sm:px-8">
        <CardTitle>Delete Team</CardTitle>
        <CardDescription>
          Warning: This will permanently delete your team, custom domains,
          documents and all associated links and their respective views.
        </CardDescription>
      </div>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          toast.promise(deleteTeam(), {
            loading: "Deleting team...",
            success: "Team deleted successfully!",
            error: (err) => err,
          });
        }}
        className="flex flex-col space-y-6 bg-muted px-4 py-8 text-left dark:bg-gray-900 sm:px-8"
      >
        <div>
          <label
            htmlFor="team-name"
            className="block text-sm font-medium text-muted-foreground"
          >
            Enter the team name{" "}
            <span className="font-semibold text-foreground">
              {teamInfo?.currentTeam?.name}
            </span>{" "}
            to continue:
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <Input
              type="text"
              name="team-name"
              id="team-name"
              autoFocus={!isMobile}
              autoComplete="off"
              required
              pattern={teamInfo?.currentTeam?.name}
              className="bg-white dark:border-gray-500 dark:bg-gray-800 focus:dark:bg-transparent"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="verification"
            className="block text-sm text-muted-foreground"
          >
            To verify, type{" "}
            <span className="font-semibold text-foreground">
              confirm delete team
            </span>{" "}
            below
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <Input
              type="text"
              name="verification"
              id="verification"
              pattern="confirm delete team"
              required
              autoComplete="off"
              className="bg-white dark:border-gray-500 dark:bg-gray-800 focus:dark:bg-transparent"
              onInput={handleInputChange}
            />
          </div>
        </div>

        <Button variant="destructive" loading={deleting} disabled={!isValid}>
          Confirm delete team
        </Button>
      </form>
    </Modal>
  );
}

export function useDeleteTeamModal() {
  const [showDeleteTeamModal, setShowDeleteTeamModal] = useState(false);

  const DeleteTeamModalCallback = useCallback(() => {
    return (
      <DeleteTeamModal
        showDeleteTeamModal={showDeleteTeamModal}
        setShowDeleteTeamModal={setShowDeleteTeamModal}
      />
    );
  }, [showDeleteTeamModal, setShowDeleteTeamModal]);

  return useMemo(
    () => ({
      setShowDeleteTeamModal,
      DeleteTeamModal: DeleteTeamModalCallback,
    }),
    [setShowDeleteTeamModal, DeleteTeamModalCallback],
  );
}
