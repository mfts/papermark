import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useTeams } from "@/lib/swr/use-teams";
import { Team } from "@/lib/types";

interface TeamContextProps {
  children: React.ReactNode;
}

export type TeamContextType = {
  teams: Team[];
  currentTeam: Team | null;
  currentTeamId: string | null;
  isLoading: boolean;
  setCurrentTeam: (team: Team) => void;
};

export const initialState = {
  teams: [],
  currentTeam: null,
  currentTeamId: null,
  isLoading: false,
  setCurrentTeam: (team: Team) => {},
};

const TeamContext = createContext<TeamContextType>(initialState);

export const TeamProvider = ({ children }: TeamContextProps): JSX.Element => {
  const { teams, loading } = useTeams();
  const [currentTeam, setCurrentTeamState] = useState<Team | null>(null);

  // Effect to set initial currentTeam on mount
  useEffect(() => {
    if (!teams || teams.length === 0 || currentTeam) return;

    const savedTeamId =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("currentTeamId")
        : null;

    let teamToSet: Team | null = null;

    if (savedTeamId) {
      teamToSet = teams.find((team) => team.id === savedTeamId) || null;
    }

    if (!teamToSet && teams.length > 0) {
      teamToSet = teams[0];
    }

    if (teamToSet) {
      setCurrentTeamState(teamToSet);
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("currentTeamId", teamToSet.id);
      }
    }
  }, [teams, currentTeam]);

  const setCurrentTeam = useCallback((team: Team) => {
    setCurrentTeamState(team);
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("currentTeamId", team.id);
    }
  }, []);

  const value = useMemo(
    () => ({
      teams: teams || [],
      currentTeam,
      currentTeamId: currentTeam?.id || null,
      isLoading: loading,
      setCurrentTeam,
    }),
    [teams, currentTeam, loading, setCurrentTeam],
  );

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>;
};

export const useTeam = () => useContext(TeamContext);
