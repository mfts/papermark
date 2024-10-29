import { useRouter } from "next/router";

import { useMemo, useState } from "react";

import { useTeam } from "@/context/team-context";
import useSWR from "swr";
import { mutate } from "swr";

import { generateCode } from "@/lib/utils";

export function useJoinCode() {
  const router = useRouter();
  const teamInfo = useTeam();
  const [isGeneratingNewCode, setIsGeneratingNewCode] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const teamId = teamInfo?.currentTeam?.id;

  const { data: joinCode, error } = useSWR(
    `/api/teams/${teamId}/joincode`,
    async () => {
      setIsPending(true);
      const response = await fetch(`/api/teams/${teamId}/joincode`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "An error occurred while fetching join code.",
        );
      }

      const data = await response.json();

      setIsPending(false);

      return data.joinCode;
    },
    { dedupingInterval: 10000 },
  );

  const generateNewJoinCode = async () => {
    setIsGeneratingNewCode(true);
    const newJoinCode = generateCode();

    await mutate(`/api/teams/${teamId}/joincode`, async () => {
      await fetch(`/api/teams/${teamId}/joincode`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          teamId,
        }),
      });
      setIsGeneratingNewCode(false);
      return newJoinCode;
    });
  };

  return {
    joinCode,
    isPending,
    error,
    generateNewJoinCode,
    isGeneratingNewCode,
  };
}
