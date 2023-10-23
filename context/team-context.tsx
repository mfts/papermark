import { useTeams } from "@/lib/swr/use-teams";
import { Team } from "@/lib/types";
import { createContext, useContext, useMemo } from "react";

interface TeamContextProps {
  children: React.ReactNode;
}

export type TeamContextType = {
  teams: Team[];
  currentTeam: Team | null;
  isLoading: boolean;
};

export const initialState = {
  teams: [],
  currentTeam: null,
  isLoading: false,
};

const TeamContext = createContext<TeamContextType | null>(initialState);

export const TeamProvider = ({ children }: TeamContextProps): JSX.Element => {
  const { teams, loading } = useTeams();

  const currentTeamId =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("currentTeamId")
      : null;

  const value = useMemo(
    () => ({
      teams: teams || [],
      currentTeam:
        (teams || []).find((team) => team.id === currentTeamId) ||
        (teams || [])[0],
      isLoading: loading,
    }),
    [teams, currentTeamId, loading]
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};

export const useTeam = () => useContext(TeamContext);
