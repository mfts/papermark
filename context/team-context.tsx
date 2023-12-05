import { createContext, useContext, useMemo, useState } from "react";
import { useTeams } from "@/lib/swr/use-teams";
import { Team } from "@/lib/types";

interface TeamContextProps {
  children: React.ReactNode;
}

export type TeamContextType = {
  teams: Team[];
  currentTeam: Team | null;
  isLoading: boolean;
  setCurrentTeam: (team: Team) => void;
};

export const initialState = {
  teams: [],
  currentTeam: null,
  isLoading: false,
  setCurrentTeam: (team: Team) => {},
};

const TeamContext = createContext<TeamContextType | null>(initialState);

export const TeamProvider = ({ children }: TeamContextProps): JSX.Element => {
  const { teams, loading } = useTeams();
  const [currentTeam, setCurrentTeam] = useState<Team | null>(null);

  const currentTeamId = currentTeam
    ? currentTeam.id
    : typeof localStorage !== "undefined"
      ? localStorage.getItem("currentTeamId")
      : null;

  const value = useMemo(
    () => ({
      teams: teams || [],
      currentTeam:
        (teams || []).find((team) => team.id === currentTeamId) ||
        (teams || [])[0],
      isLoading: loading,
      setCurrentTeam,
    }),
    [teams, currentTeam, loading],
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};

export const useTeam = () => useContext(TeamContext);
