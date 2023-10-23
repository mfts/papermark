import React, { Fragment, useEffect, useRef, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, CheckIcon, Loader, PlusIcon } from "lucide-react";
import { TeamContextType } from "@/context/team-context";
import { AddTeamModal } from "./add-team-modal";
import { Listbox, Transition } from "@headlessui/react";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";

const SelectTeam = ({ teams, currentTeam, isLoading }: TeamContextType) => {
  const [selectTeamOpen, setSelectTeamOpen] = useState<boolean>(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleDocumentClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event?.target as Node)) {
        setSelectTeamOpen(false);
      }
    }

    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, []);

  return (
    <>
      {isLoading ? (
        <h2 className="flex items-center gap-2 mb-6 text-sm">
          <Loader className="animate-spin h-5 w-5" /> Loading teams...
        </h2>
      ) : (
        <>
          <div
            className="relative h-10 mb-6 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background select-none"
            ref={ref}>
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setSelectTeamOpen(!selectTeamOpen)}>
              {currentTeam?.name}
              <ChevronUpDownIcon className="h-4 w-4" />
            </div>

            {selectTeamOpen && (
              <div className="z-50 bg-popover text-popover-foreground shadow-md absolute top-12 left-0 max-h-72 w-full space-y-0.5 border overflow-auto rounded-md text-base sm:w-60 sm:text-sm sm:shadow-lg">
                <div className="py-2 px-4 text-sm text-gray-400">
                  Custom Projects
                </div>
                {teams.map((team) => (
                  <div
                    key={team.id}
                    className={`relative flex w-full items-center space-x-2 rounded-md px-4 py-2 hover:bg-gray-800 duration-100 cursor-pointer ${
                      team.id === currentTeam?.id ? "font-medium" : ""
                    } transition-all duration-75`}
                    onClick={() => setSelectTeamOpen(false)}>
                    <span
                      className={`block truncate text-sm ${
                        team.id === currentTeam?.id
                          ? "font-medium"
                          : "font-normal"
                      }`}>
                      {team.name}
                    </span>
                    {team.id === currentTeam?.id ? (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-black">
                        <Check
                          className="h-5 w-5 text-white"
                          aria-hidden="true"
                        />
                      </span>
                    ) : null}
                  </div>
                ))}
                <AddTeamModal>
                  <div className="flex mt-1 gap-2 items-center border-t p-3 text-sm hover:bg-gray-800 duration-100 hover:cursor-pointer">
                    <PlusIcon className="h-5 w-5" />
                    Create Team
                  </div>
                </AddTeamModal>
              </div>
            )}
          </div>
        </>
        // <>
        //   <Select
        //     defaultValue={currentTeam?.name}
        //     onOpenChange={() => setVisible(!visible)}>
        //     <SelectTrigger className="w-full mb-6">
        //       <SelectValue placeholder="Select project" />
        //     </SelectTrigger>
        //     <SelectContent>
        //       <div className="max-h-48 overflow-y-scroll">
        //         {teams.map((team) => (
        //           <SelectItem key={team.id} value={team.name}>
        //             {team.name}
        //           </SelectItem>
        //         ))}
        //       </div>
        //     </SelectContent>
        //     {visible && (
        //       <div className="absolute">
        // <AddTeamModal>
        //   <div className="flex gap-2 items-center border-t p-2 text-sm hover:bg-gray-800 duration-100 hover:cursor-pointer">
        //     <PlusIcon className="h-5 w-5" />
        //     Create Team
        //   </div>
        // </AddTeamModal>
        //       </div>
        //     )}
        //   </Select>
        // </>
      )}
    </>
  );
};

export default SelectTeam;
