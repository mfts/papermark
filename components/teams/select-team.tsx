import Link from "next/link";
import { useRouter } from "next/router";

import { TeamContextType, useTeam } from "@/context/team-context";
import { DropdownMenuSeparator } from "@radix-ui/react-dropdown-menu";
import { Check, Plus } from "lucide-react";
import { ChevronsUpDown as ChevronUpDownIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Skeleton } from "@/components/ui/skeleton";

import { Team } from "@/lib/types";
import { cn } from "@/lib/utils";

const SelectTeam = ({ teams, currentTeam, isLoading }: TeamContextType) => {
  const router = useRouter();
  const userTeam = useTeam();

  const switchTeam = (team: Team) => {
    localStorage.setItem("currentTeamId", team.id);
    userTeam?.setCurrentTeam(team);
    router.push("/documents");
  };

  return (
    <>
      {isLoading ? (
        <SidebarMenuButton
          size="sm"
          className="flex cursor-pointer items-center justify-between p-5 px-[10px] opacity-90 hover:bg-muted"
        >
          <div className="flex aspect-square items-center space-x-4">
            <Skeleton className="h-6 w-6 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        </SidebarMenuButton>
      ) : (
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg">
                    <Avatar className="h-[25px] w-[25px] text-[10px]">
                      <AvatarFallback>
                        {currentTeam?.name?.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <p className="text-sm">{currentTeam?.name}</p>
                  </div>
                  <ChevronUpDownIcon className="h-4 w-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                sideOffset={4}
                className="z-50 w-64 w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                align="start"
                side="right"
              >
                <DropdownMenuLabel className="text-xs text-muted-foreground">
                  Teams
                </DropdownMenuLabel>
                {teams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => switchTeam(team)}
                    className={cn(
                      `flex w-full cursor-pointer items-center justify-between truncate px-3 py-2 text-sm font-normal transition-all duration-75 hover:bg-gray-200 hover:dark:bg-gray-900`,
                      team.id === currentTeam?.id && "font-medium",
                    )}
                  >
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-7 w-7 text-xs">
                        <AvatarFallback>
                          {team.name?.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <p>{team.name}</p>
                    </div>

                    {team.id === currentTeam?.id && (
                      <Check
                        className="h-4 w-4 text-black dark:text-white"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                ))}

                <DropdownMenuSeparator className="-mx-1 my-1 h-px bg-muted" />
                <DropdownMenuItem className="gap-2 p-2">
                  <Link
                    href="/settings/people"
                    className="flex items-center gap-2 text-sm hover:cursor-pointer"
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                      <Plus className="size-4" />
                    </div>
                    <div className="font-medium text-muted-foreground">
                      Invite Members
                    </div>
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      )}
    </>
  );
};

export default SelectTeam;
