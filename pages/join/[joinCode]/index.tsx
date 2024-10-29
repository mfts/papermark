import { useRouter } from "next/router";

import React, { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { useSession } from "next-auth/react";

export default function JoinCodePage() {
  const router = useRouter();
  const { joinCode } = router.query;
  const teamInfo = useTeam();

  const { joinCode, isPending, error, generateNewJoinCode, isGeneratingNewCode } =
    useTeamInfo();

  console.log("teamInfo :", teamInfo);

  useEffect(() => {
    handleGetTeamInfo();
  }, []);

  const handleJoinTeam = async () => {
    try {
      const response = await fetch(`/api/teams/${teamInfo?.currentTeam?.id}/joincode/accept`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to join team");
      }

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error);
      }

      router.push(`/documents`);
    } catch (error) {
      console.error("Error joining team:", error);
    }
  };

  const handleGetTeamInfo = async () => {
    try {
      const response = await fetch(`/api/teams/${joinCode}/joincode`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to get team info");
      }

      const result = await response.json();
      setTeamName(result.teamName);
      setTeamId(result.teamId);
    } catch (error) {
      console.error("Error getting team info:", error);
    }
  };

  return (
    <div>
      <p>Team Name: {teamInfo?.currentTeam?.name}</p>
      <p>Team ID: {teamInfo?.currentTeam?.id}</p>
      <button onClick={handleJoinTeam}>Join Team</button>
    </div>
  );
}
