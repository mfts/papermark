import { useState } from "react";
import AppLayout from "@/components/layouts/app";
import Navbar from "@/components/settings/navbar";
import { Button } from "@/components/ui/button";
import MoreVertical from "@/components/shared/icons/more-vertical";
import Folder from "@/components/shared/icons/folder";
import { useGetTeam } from "@/lib/swr/use-team";
import { Skeleton } from "@/components/ui/skeleton";
import { AddTeamMembers } from "@/components/teams/add-team-member-modal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSession } from "next-auth/react";
import { CustomUser } from "@/lib/types";

export default function Billing() {
  const [isTeamMemberInviteModalOpen, setTeamMemberInviteModalOpen] =
    useState<boolean>(false);

  const { data: session } = useSession();
  const { team, loading } = useGetTeam();

  const getUserDocumentCount = (userId: string) => {
    const documents = team?.documents.filter(
      (document) => document.owner.id === userId
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
        user.userId === (session?.user as CustomUser)?.id
    );
  };

  return (
    <AppLayout>
      <Navbar current="People" />
      <div className="p-4 sm:p-4 sm:m-4">
        <div className="flex items-center justify-between mb-4 md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <h3 className="text-2xl text-foreground font-semibold tracking-tight">
              Team Members
            </h3>
            <p className="text-sm text-muted-foreground">
              Manage your team members
            </p>
          </div>
        </div>
        <div>
          <div className="flex justify-between items-center p-10 rounded-lg border border-border bg-secondary">
            <div className="flex flex-col space-y-3">
              <h2 className="text-xl font-medium">People</h2>
              <p className="text-sm text-secondary-foreground">
                Teammates that have access to this project.
              </p>
            </div>
            <AddTeamMembers
              open={isTeamMemberInviteModalOpen}
              setOpen={setTeamMemberInviteModalOpen}>
              <Button>Invite</Button>
            </AddTeamMembers>
          </div>
        </div>

        <ul className="mt-6 border rounded-lg divide-y">
          {loading && (
            <div className="flex justify-between items-center py-4 px-10">
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
          {team?.users.map((member) => (
            <li className="flex py-4 px-10 justify-between items-center">
              <div className="flex items-center gap-12">
                <div className="space-y-1">
                  <h4 className="font-semibold text-sm">{member.user.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {member.user.email}
                  </p>
                </div>
                <div className="text-sm">
                  <div className="flex items-center gap-2">
                    <Folder />
                    <span className="text-xs text-foreground">
                      {getUserDocumentCount(member.userId)}{" "}
                      {getUserDocumentCount(member.userId) === 1
                        ? "document"
                        : "documents"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-12">
                <span className="text-sm text-foreground capitalize">
                  {member.role.toLowerCase()}
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    {isCurrentUser(member.userId) && (
                      <DropdownMenuItem className="text-red-500 focus:bg-destructive focus:text-destructive-foreground">
                        Leave team
                      </DropdownMenuItem>
                    )}
                    {isCurrentUserAdmin() && !isCurrentUser(member.userId) ? (
                      <DropdownMenuItem className="text-red-500 focus:bg-destructive focus:text-destructive-foreground">
                        Remove teammate
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        disabled
                        className="text-red-500 focus:bg-destructive focus:text-destructive-foreground">
                        Remove teammate
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </AppLayout>
  );
}
