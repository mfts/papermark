import React, { useEffect, useState } from "react";

import { initialState } from "@/context/team-context";
import { useTeam } from "@/context/team-context";
import { TeamContextType } from "@/context/team-context";
import { PlanEnum } from "@/ee/stripe/constants";
import { InfoIcon, ShieldAlertIcon } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

import { usePlan } from "@/lib/swr/use-billing";
import { useGetTeam } from "@/lib/swr/use-team";
import { useTeams } from "@/lib/swr/use-teams";
import { CustomUser } from "@/lib/types";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

import { UpgradePlanModal } from "../billing/upgrade-plan-modal";
import { AddTeamModal } from "../teams/add-team-modal";

export const BlockingModal = () => {
  const { isFree, isTrial } = usePlan();
  const { data: session } = useSession();
  const { team } = useGetTeam()!;
  const { setCurrentTeam }: TeamContextType = useTeam() || initialState;
  const { teams } = useTeams();

  const currentUserId = (session?.user as CustomUser)?.id;
  const isAdmin = team?.users.some(
    (user) => user.userId === currentUserId && user.role === "ADMIN",
  );

  const userTeam = teams?.find((t) => t.id !== team?.id);
  const multipleUsers = team?.users?.length && team?.users?.length > 1;

  // const shouldShowBanner = isFree && !isTrial && isAdmin && multipleUsers;
  const [showModal, setShowModal] = useState(false);

  // Check if current user is blocked due to trial expiration
  const currentUserTeam = team?.users.find(
    (user) => user.userId === currentUserId,
  );

  const isBlockedDueToTrial =
    currentUserTeam?.status === "BLOCKED_TRIAL_EXPIRED";

  const shouldShowModal =
    (isFree && !isTrial && !isAdmin && multipleUsers && showModal) ||
    isBlockedDueToTrial;

  useEffect(() => {
    if (
      (isFree && !isTrial && !isAdmin && multipleUsers) ||
      isBlockedDueToTrial
    ) {
      setShowModal(true);
    }
  }, [isFree, isTrial, isAdmin, multipleUsers, isBlockedDueToTrial]);

  useEffect(() => {
    if (shouldShowModal) {
      const preventRightClick = (e: MouseEvent) => {
        e.preventDefault();
        return false;
      };

      const preventKeyboardShortcuts = (e: KeyboardEvent) => {
        if (e.key === "F12") {
          e.preventDefault();
          return false;
        }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "I") {
          e.preventDefault();
          return false;
        }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "C") {
          e.preventDefault();
          return false;
        }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === "J") {
          e.preventDefault();
          return false;
        }
        if (e.key === "ContextMenu") {
          e.preventDefault();
          return false;
        }
      };

      document.addEventListener("contextmenu", preventRightClick);
      document.addEventListener("keydown", preventKeyboardShortcuts);

      return () => {
        document.removeEventListener("contextmenu", preventRightClick);
        document.removeEventListener("keydown", preventKeyboardShortcuts);
      };
    }
  }, [shouldShowModal]);

  const handleSwitchTeam = () => {
    if (userTeam) {
      localStorage.setItem("currentTeamId", userTeam.id);
      setCurrentTeam(userTeam);
      setShowModal(false);
    }
  };

  return (
    <>
      {/* <div className="flex w-full px-4">
        {shouldShowBanner && (
          <div className="flex w-full items-center gap-3 rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm dark:border-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-100">
            <div className="flex-shrink-0">
              <InfoIcon className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="font-medium">
                You&apos;re now on the free solo plan
              </p>
              <p className="mt-1 text-yellow-700 dark:text-yellow-200">
                To continue collaborating with your team, please upgrade your
                plan.
              </p>
            </div>
            <UpgradePlanModal
              clickedPlan={PlanEnum.Pro}
              trigger="trial_end_blocking_modal"
            >
              <Button type="button" variant="orange">
                Upgrade
              </Button>
            </UpgradePlanModal>
            <Button type="button" variant="outline">
              Dismiss
            </Button>
          </div>
        )}
      </div> */}
      <AlertDialog open={!!shouldShowModal} onOpenChange={setShowModal}>
        <AlertDialogContent
          className="w-full max-w-lg"
          overlayClassName="backdrop-blur"
          onContextMenu={(e) => e.preventDefault()}
        >
          <AlertDialogHeader className="flex flex-col items-center text-center">
            <div className="mb-4 rounded-full bg-red-100/80 p-4 dark:bg-red-900/30">
              <ShieldAlertIcon className="h-10 w-10 text-red-500 dark:text-red-400" />
            </div>
            <AlertDialogTitle className="text-2xl font-semibold">
              Account Access Limited
            </AlertDialogTitle>
            <AlertDialogDescription className="mt-2 space-y-2 text-muted-foreground">
              <div>
                Your team is now on a free solo plan. Your access to this team
                has been limited.
              </div>
              <div>
                Contact your team owner, upgrade the team or{" "}
                {userTeam ? (
                  <span>
                    switch to another team to continue using the platform.
                  </span>
                ) : (
                  <span>create a new team to continue using the platform.</span>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant="link"
              className="w-full sm:w-auto"
              onClick={() => signOut()}
            >
              Log out
            </Button>
            <UpgradePlanModal
              clickedPlan={PlanEnum.Business}
              trigger="trial_end_blocking_modal_for_team_member"
            >
              <Button className="w-full sm:w-auto" type="button">
                Upgrade
              </Button>
            </UpgradePlanModal>
            {userTeam ? (
              <Button
                variant="outline"
                className="w-full gap-0 sm:w-auto"
                onClick={handleSwitchTeam}
              >
                Switch to &quot;
                <span className="w-[15ch] max-w-fit truncate">
                  {userTeam.name}
                </span>
                &quot;
              </Button>
            ) : (
              <AddTeamModal setCurrentTeam={setCurrentTeam}>
                <Button variant="outline" className="w-full sm:w-auto">
                  Create New Team
                </Button>
              </AddTeamModal>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BlockingModal;
