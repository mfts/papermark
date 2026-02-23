import { get } from "@vercel/edge-config";

export const isTrustedTeam = async (teamId: string): Promise<boolean> => {
  if (!process.env.EDGE_CONFIG) {
    return false;
  }

  let trustedTeams: string[] = [];
  try {
    const result = await get("trustedTeams");
    trustedTeams = Array.isArray(result)
      ? result.filter((item): item is string => typeof item === "string")
      : [];
  } catch (e) {
    // Already initialized as empty array
  }

  if (trustedTeams.length === 0) return false;
  return trustedTeams.includes(teamId);
};
