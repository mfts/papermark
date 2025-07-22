import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";



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

    // Update PostHog group association when team changes
    if (typeof window !== "undefined") {
      import("posthog-js").then((module) => {
        const posthog = module.default;
        if (posthog && posthog.isFeatureEnabled) {
          // Update user properties with new current team
          posthog.setPersonProperties({
            current_team_id: team.id,
            current_team_name: team.name,
            current_team_plan: team.plan,
          });

          // Associate with the new team group
          posthog.group("team", team.id, {
            name: team.name,
            plan: team.plan,
            created_at: team.createdAt,
            excel_advanced_mode: team.enableExcelAdvancedMode,
          });

          // Track team switch event
          posthog.capture("Team Switched", {
            team_id: team.id,
            team_name: team.name,
            team_plan: team.plan,
            $groups: { team: team.id },
          });
        }
      }).catch((error) => {
        console.error("Failed to update PostHog group on team switch:", error);
      });
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