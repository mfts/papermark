import { Check, Loader, PlusIcon } from "lucide-react";
import { TeamContextType, useTeam } from "@/context/team-context";
import { ChevronsUpDown as ChevronUpDownIcon } from "lucide-react";
import { Team } from "@/lib/types";
import { useRouter } from "next/router";
import Link from "next/link";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Loader className="animate-spin h-5 w-5" /> Loading teams...
        </div>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="w-full py-2 px-[10px] border rounded-md flex opacity-90 items-center justify-between mb-5 cursor-pointer hover:bg-muted duration-200">
              <div className="flex items-center space-x-2">
                <Avatar className="w-[25px] h-[25px] text-[10px]">
                  <AvatarFallback>
                    {currentTeam?.name?.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <p className="text-sm">{currentTeam?.name}</p>
              </div>
              <ChevronUpDownIcon className="h-4 w-4" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[250px] sm:w-[270px] lg:w-[240px] xl:w-[270px] px-0 pt-2 pb-1.5">
            {teams.map((team) => (
              <div
                key={team.id}
                onClick={() => switchTeam(team)}
                className={cn(
                  `w-full flex items-center justify-between px-3 py-2 hover:bg-gray-200 hover:dark:bg-gray-800 cursor-pointer transition-all duration-75 truncate text-sm font-normal `,
                  team.id === currentTeam?.id && "font-medium",
                )}
              >
                <div className="flex items-center space-x-2">
                  <Avatar className="w-7 h-7 text-xs">
                    <AvatarFallback>
                      {team.name?.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <p>{team.name}</p>
                </div>

                {team.id === currentTeam?.id && (
                  <Check
                    className="h-4 w-4 dark:text-white text-black"
                    aria-hidden="true"
                  />
                )}
              </div>
            ))}

            <Link
              href="/settings/people"
              className="w-[92%] mx-auto mb-1 mt-3 flex items-center text-sm rounded-sm border px-[10px] py-2 hover:bg-gray-200 hover:dark:bg-gray-800 duration-100 hover:cursor-pointer"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Invite Members
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
};

export default SelectTeam;
