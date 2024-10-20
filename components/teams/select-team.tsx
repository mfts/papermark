import Link from "next/link";
import { useRouter } from "next/router";

import { TeamContextType, useTeam } from "@/context/team-context";
import { Check, Loader, PlusIcon } from "lucide-react";
import { ChevronsUpDown as ChevronUpDownIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

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
        <div className="flex items-center gap-2 text-sm">
          <Loader className="h-5 w-5 animate-spin" /> Loading teams...
        </div>
      ) : (
        <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
          {/* <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
            <div className="flex cursor-pointer items-center justify-between rounded-md border px-[10px] py-2 opacity-90 duration-200 hover:bg-muted">
              <div className="flex items-center space-x-2">
                <Avatar className="h-[25px] w-[25px] text-[10px]">
                  <AvatarFallback>
                    {currentTeam?.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <p className="text-sm">{currentTeam?.name}</p>
              </div>
              <ChevronUpDownIcon className="h-4 w-4" />
            </div>
            </SidebarMenuButton> */}

<SidebarMenuButton
              size="lg"
              className=" p-5 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Avatar className="h-[25px] w-[25px] text-[10px]">
              <AvatarFallback>
                    {currentTeam?.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                  </Avatar>
              </div>
              
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">
                 Sample Value
                </span>
                <span className="truncate text-xs">Dummy</span>
              </div>
              <ChevronUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent sideOffset={4} className="w-64">
            {teams.map((team) => (
              <div
                key={team.id}
                onClick={() => switchTeam(team)}
                className={cn(
                  `flex w-full cursor-pointer items-center justify-between truncate px-3 py-2 text-sm font-normal transition-all duration-75 hover:bg-gray-200 hover:dark:bg-gray-800`,
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

            <Link
              href="/settings/people"
              className="mx-auto mb-1 mt-3 flex w-[92%] items-center rounded-sm border px-[10px] py-2 text-sm duration-100 hover:cursor-pointer hover:bg-gray-200 hover:dark:bg-gray-800"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Invite Members
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
        </SidebarMenuItem>
        </SidebarMenu>
      )}
    </>
  );
};

export default SelectTeam;
