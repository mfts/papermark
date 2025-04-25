import { useRouter } from "next/router";

import { useState } from "react";

import { useTeam } from "@/context/team-context";
import { PlanEnum } from "@/ee/stripe/constants";
import { BadgeInfoIcon, MoreVerticalIcon, XIcon } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { mutate } from "swr";

import { useAnalytics } from "@/lib/analytics";
import { usePlan } from "@/lib/swr/use-billing";
import { useInvitations } from "@/lib/swr/use-invitations";
import useLimits from "@/lib/swr/use-limits";
import { useOrgMembers } from "@/lib/swr/use-org-members";
import { useGetTeam } from "@/lib/swr/use-team";
import { useTeams } from "@/lib/swr/use-teams";
import { CustomUser } from "@/lib/types";
import { getEmailDomain } from "@/lib/utils/email-domain";

import { AddSeatModal } from "@/components/billing/add-seat-modal";
import { UpgradePlanModal } from "@/components/billing/upgrade-plan-modal";
import AppLayout from "@/components/layouts/app";
import { SettingsHeader } from "@/components/settings/settings-header";
import Folder from "@/components/shared/icons/folder";
import { AddTeamMembers } from "@/components/teams/add-team-member-modal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { BadgeTooltip, ButtonTooltip } from "@/components/ui/tooltip";

export default function Billing() {
  const [isTeamMemberInviteModalOpen, setTeamMemberInviteModalOpen] =
    useState<boolean>(false);
  const [isAddSeatModalOpen, setAddSeatModalOpen] = useState<boolean>(false);
  const [leavingUserId, setLeavingUserId] = useState<string>("");
  const [invitedMemberIds, setInvitedMemberIds] = useState<string[]>([]);
  const [invitingMemberId, setInvitingMemberId] = useState<string>("");
  const { data: session } = useSession();
  const { team, loading } = useGetTeam()!;
  const teamInfo = useTeam();
  const { plan: userPlan, isFree } = usePlan();
  const { limits } = useLimits();
  const { teams } = useTeams();
  const analytics = useAnalytics();

  const { invitations } = useInvitations();
  const { members } = useOrgMembers(teamInfo?.currentTeam?.id ?? "");
  const domain = session?.user?.email
    ? getEmailDomain(session.user.email)
    : null;

  const router = useRouter();

  const numUsers = (team && team.users.length) ?? 1;
  const numInvitations = (invitations && invitations.length) ?? 0;

  const getUserDocumentCount = (userId: string) => {
    const documents = team?.documents.filter(
      (document) => document.owner?.id === userId,
    );
    return documents?.length;
  };

  const isCurrentUser = (userId: string) => {
    if ((session?.user as CustomUser)?.id === userId) {
      return true;
    }
    return false;
  };

  const isCurrentUserAdmin = () => {
    return team?.users.some(
      (user) =>
        user.role === "ADMIN" &&
        user.userId === (session?.user as CustomUser)?.id,
    );
  };

  const changeRole = async (teamId: string, userId: string, role: string) => {
    const response = await fetch(`/api/teams/${teamId}/change-role`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userToBeChanged: userId,
        role: role,
      }),
    });

    if (response.status !== 204) {
      const error = await response.json();
      toast.error(error);
      return;
    }

    await mutate(`/api/teams/${teamId}`);
    await mutate("/api/teams");

    analytics.capture("Team Member Role Changed", {
      userId: userId,
      teamId: teamId,
      role: role,
    });

    toast.success("Role changed successfully!");
  };

  const removeTeammate = async (teamId: string, userId: string) => {
    setLeavingUserId(userId);
    const response = await fetch(`/api/teams/${teamId}/remove-teammate`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userToBeDeleted: userId,
      }),
    });

    if (response.status !== 204) {
      const error = await response.json();
      toast.error(error);
      setLeavingUserId("");
      return;
    }

    await mutate(`/api/teams/${teamInfo?.currentTeam?.id}`);
    await mutate("/api/teams");

    setLeavingUserId("");
    if (isCurrentUser(userId)) {
      toast.success(`Successfully leaved team ${teamInfo?.currentTeam?.name}`);
      teamInfo?.setCurrentTeam({ id: teams![0].id });
      router.push("/documents");
      return;
    }

    analytics.capture("Team Member Removed", {
      userId: userId,
      teamId: teamInfo?.currentTeam?.id,
    });

    toast.success("Teammate removed successfully!");
  };

  // resend invitation function
  const resendInvitation = async (invitation: { email: string } & any) => {
    const response = await fetch(
      `/api/teams/${teamInfo?.currentTeam?.id}/invitations/resend`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: invitation.email as string,
        }),
      },
    );

    if (response.status !== 200) {
      const errorData = await response.json();
      const errorMessage =
        typeof errorData === "string"
          ? errorData
          : "Failed to resend invitation";
      toast.error(errorMessage);
      return;
    }

    analytics.capture("Team Member Invitation Resent", {
      email: invitation.email as string,
      teamId: teamInfo?.currentTeam?.id,
    });

    toast.success("Invitation resent successfully!");
  };

  // revoke invitation function
  const revokeInvitation = async (invitation: { email: string } & any) => {
    const response = await fetch(
      `/api/teams/${teamInfo?.currentTeam?.id}/invitations`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: invitation.email as string,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        typeof errorData === "string"
          ? errorData
          : "Failed to revoke invitation";
      toast.error(errorMessage);
      return;
    }

    analytics.capture("Team Member Invitation Revoked", {
      email: invitation.email as string,
      teamId: teamInfo?.currentTeam?.id,
    });

    const memberToRestore = members?.find(
      (member) => member.email === invitation.email,
    );

    if (memberToRestore) {
      setInvitedMemberIds((prev) =>
        prev.filter((id) => id !== memberToRestore.id),
      );
    }

    mutate(`/api/teams/${teamInfo?.currentTeam?.id}/invitations`);

    toast.success("Invitation revoked successfully!");
  };

  const handleInviteToTeam = async (email: string, memberId: string) => {
    setInvitingMemberId(memberId);
    const response = await fetch(
      `/api/teams/${teamInfo?.currentTeam?.id}/invite`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email,
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        typeof errorData === "string" ? errorData : "Failed to send invitation";
      setInvitingMemberId("");
      toast.error(errorMessage);
      return;
    }

    analytics.capture("Team Member Invitation Sent", {
      email: email,
      teamId: teamInfo?.currentTeam?.id,
    });

    setInvitedMemberIds((prev) => [...prev, memberId]);

    mutate(`/api/teams/${teamInfo?.currentTeam?.id}/invitations`);

    toast.success("An invitation email has been sent!");
    setInvitingMemberId("");
  };

  const getMemberStatus = (member: any) => {
    if (team?.users.some((user) => user.userId === member.id)) {
      return "team_member";
    }
    if (invitations?.some((invitation) => invitation.email === member.email)) {
      return "invited";
    }
    if (invitedMemberIds.includes(member.id)) {
      return "just_invited";
    }
    return "can_invite";
  };

  const tooltipContent = isFree
    ? "Upgrade to see who is using Papermark from your domain and invite them to your team"
    : "These users from your domain are already on Papermark, invite them to your team to start collaborating.";

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <SettingsHeader />
        <div>
          <div className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
            <div className="space-y-1">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                Team Members
              </h3>
              <p className="text-sm text-muted-foreground">
                Manage your team members
              </p>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between gap-x-1 rounded-lg border border-border bg-secondary p-4 sm:p-10">
              <div className="flex flex-col space-y-1 sm:space-y-3">
                <h2 className="text-xl font-medium">People</h2>
                <p className="text-sm text-secondary-foreground">
                  Teammates that have access to this project.
                </p>
              </div>
              {userPlan === "free" ? (
                <UpgradePlanModal
                  clickedPlan={PlanEnum.Pro}
                  trigger={"invite_team_members"}
                >
                  <Button className="whitespace-nowrap px-1 text-xs sm:px-4 sm:text-sm">
                    Upgrade to invite members
                  </Button>
                </UpgradePlanModal>
              ) : limits === null ||
                (limits && limits.users! > numUsers + numInvitations) ? (
                <AddTeamMembers
                  open={isTeamMemberInviteModalOpen}
                  setOpen={setTeamMemberInviteModalOpen}
                >
                  <Button>Invite</Button>
                </AddTeamMembers>
              ) : (
                <AddSeatModal
                  open={isAddSeatModalOpen}
                  setOpen={setAddSeatModalOpen}
                >
                  <Button className="whitespace-nowrap px-1 text-xs sm:px-4 sm:text-sm">
                    Add a seat to invite member
                  </Button>
                </AddSeatModal>
              )}
            </div>
          </div>

          <ul className="mt-6 divide-y rounded-lg border">
            {loading && (
              <div className="flex items-center justify-between px-10 py-4">
                <div className="flex items-center gap-12">
                  <div className="space-y-2">
                    <Skeleton className="h-6 w-36" />
                    <Skeleton className="h-4 w-36" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex gap-12">
                  <Skeleton className="h-6 w-14" />
                  <Skeleton className="h-6 w-4" />
                </div>
              </div>
            )}
            {team?.users.map((member, index) => (
              <li
                className="flex items-center justify-between gap-12 overflow-auto px-10 py-4"
                key={index}
              >
                <div className="flex items-center gap-12">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">
                      {member.user.name}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {member.user.email}
                    </p>
                  </div>
                  <div className="text-sm">
                    <div className="flex items-center gap-2">
                      <Folder />
                      <span className="text-nowrap text-xs text-foreground">
                        {getUserDocumentCount(member.userId)}{" "}
                        {getUserDocumentCount(member.userId) === 1
                          ? "document"
                          : "documents"}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-12">
                  <span className="text-sm capitalize text-foreground">
                    {member.role.toLowerCase()}
                  </span>
                  {leavingUserId === member.userId ? (
                    <span className="text-xs">leaving...</span>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVerticalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        {isCurrentUser(member.userId) && (
                          <DropdownMenuItem
                            onClick={() =>
                              removeTeammate(member.teamId, member.userId)
                            }
                            className="text-red-500 hover:cursor-pointer focus:bg-destructive focus:text-destructive-foreground"
                          >
                            Leave team
                          </DropdownMenuItem>
                        )}
                        {isCurrentUserAdmin() &&
                        !isCurrentUser(member.userId) ? (
                          <>
                            <DropdownMenuItem
                              onClick={() =>
                                changeRole(
                                  member.teamId,
                                  member.userId,
                                  member.role === "MEMBER"
                                    ? "MANAGER"
                                    : "MEMBER",
                                )
                              }
                              className="text-red-500 hover:cursor-pointer focus:bg-destructive focus:text-destructive-foreground"
                            >
                              Change role to{" "}
                              {member.role === "MEMBER" ? "MANAGER" : "MEMBER"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                removeTeammate(member.teamId, member.userId)
                              }
                              className="text-red-500 hover:cursor-pointer focus:bg-destructive focus:text-destructive-foreground"
                            >
                              Remove teammate
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <DropdownMenuItem
                            disabled
                            className="text-red-500 focus:bg-destructive focus:text-destructive-foreground"
                          >
                            Remove teammate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </li>
            ))}
            {invitations &&
              invitations.map((invitation, index) => (
                <li
                  className="flex items-center justify-between px-10 py-4"
                  key={index}
                >
                  <div className="flex items-center gap-12">
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold">
                        {invitation.email}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {invitation.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-12">
                    <span
                      className="text-sm text-foreground"
                      title={`Expires on ${new Date(
                        invitation.expires,
                      ).toLocaleString()}`}
                    >
                      {new Date(invitation.expires) >= new Date(Date.now())
                        ? "Pending"
                        : "Expired"}
                    </span>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreVerticalIcon className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => resendInvitation(invitation)}
                          className="text-red-500 hover:cursor-pointer focus:bg-destructive focus:text-destructive-foreground"
                        >
                          Resend
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => revokeInvitation(invitation)}
                          className="text-red-500 hover:cursor-pointer focus:bg-destructive focus:text-destructive-foreground"
                        >
                          Revoke invitation
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </li>
              ))}
          </ul>

          <div className="space-y-4 md:mt-8 lg:mt-12">
            {members && members.length > 0 && (
              <div className="flex items-center justify-between">
                <h4 className="flex flex-row items-center gap-2 text-sm font-semibold text-foreground">
                  {members.length} {members.length === 1 ? "person" : "people"}{" "}
                  from {domain} {members.length === 1 ? "is" : "are"} already on
                  Papermark{" "}
                  <BadgeTooltip content={tooltipContent} key="internal">
                    <BadgeInfoIcon className="h-4 w-4 cursor-help" />
                  </BadgeTooltip>
                </h4>
                <div className="flex items-center gap-4">
                  {userPlan === "free" ? (
                    <UpgradePlanModal
                      clickedPlan={PlanEnum.Pro}
                      trigger={"people_section"}
                    >
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                      >
                        Upgrade
                      </Button>
                    </UpgradePlanModal>
                  ) : null}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {members &&
                members.map((member) => {
                  const status = getMemberStatus(member);
                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-4">
                        {isFree ? (
                          <Avatar className="h-10 w-10 border border-border">
                            <AvatarFallback className="text-lg text-secondary-foreground">
                              ?
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={member?.image || ""} />
                            <AvatarFallback className="text-lg font-bold capitalize">
                              {member.name?.charAt(0) ||
                                member.email?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div>
                          {isFree ? (
                            <>
                              <div className="mb-1 h-4 w-24 rounded-sm bg-secondary"></div>
                              <div className="flex items-center">
                                <div className="mr-1 h-3 w-12 rounded-sm bg-secondary"></div>
                                <span className="text-xs text-muted-foreground">
                                  @{domain}
                                </span>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-medium text-foreground">
                                {member.name || member.email}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {member.email}
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                      {isFree ? (
                        <UpgradePlanModal
                          clickedPlan={PlanEnum.Pro}
                          trigger={"add_org_member"}
                        >
                          <Button variant="default" size="sm">
                            Upgrade to see
                          </Button>
                        </UpgradePlanModal>
                      ) : status === "can_invite" ? (
                        limits === null ||
                        (limits &&
                          limits.users! > numUsers + numInvitations) ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              handleInviteToTeam(member.email, member.id)
                            }
                            disabled={invitingMemberId === member.id}
                            className="transition-all duration-200 hover:bg-primary hover:text-primary-foreground"
                          >
                            {invitingMemberId === member.id
                              ? "Inviting..."
                              : "Invite"}
                          </Button>
                        ) : (
                          <AddSeatModal
                            open={isAddSeatModalOpen}
                            setOpen={setAddSeatModalOpen}
                          >
                            <Button variant="outline" size="sm">
                              Add seat
                            </Button>
                          </AddSeatModal>
                        )
                      ) : status === "invited" || status === "just_invited" ? (
                        <div className="flex items-center gap-4">
                          <Badge variant="secondary">Invited</Badge>
                          <ButtonTooltip content="Revoke invitation">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() =>
                                revokeInvitation({ email: member.email })
                              }
                            >
                              <span className="sr-only">Revoke invitation</span>
                              <XIcon className="h-4 w-4" />
                            </Button>
                          </ButtonTooltip>
                        </div>
                      ) : (
                        <Badge variant="secondary">Team member</Badge>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
