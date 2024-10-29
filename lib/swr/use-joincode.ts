import { useRouter } from "next/router";
import { useMemo } from "react";
import { useTeam } from "@/context/team-context";
import { useSWR } from "swr";
import { generateCode } from "@/lib/utils";

export function useJoinCode(dataroomId: string, groupId: string) {
  const router = useRouter();
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;

  const { data: joinCode, error } = useSWR(
    teamId && dataroomId && groupId && `/api/teams/${teamId}/datarooms/${dataroomId}/groups/${groupId}/join-code`,
    async () => {
      const response = await fetch(
        `/api/teams/${teamId}/datarooms/${dataroomId}/groups/${groupId}/join-code`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "An error occurred while fetching join code."
        );
      }

      const data = await response.json();

      if (!data.joinCode) {
        const newJoinCode = generateCode();
        await fetch(
          `/api/teams/${teamId}/datarooms/${dataroomId}/groups/${groupId}/join-code`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              joinCode: newJoinCode,
            }),
          }
        );
        return newJoinCode;
      }

      return data.joinCode;
    },
    { dedupingInterval: 10000 }
  );

  return {
    joinCode,
    loading: !error && !joinCode,
    error,
  };
}

