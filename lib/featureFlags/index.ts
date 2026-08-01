import { get } from "@vercel/edge-config";

export type BetaFeatures =
  | "tokens"
  | "incomingWebhooks"
  | "roomChangeNotifications"
  | "webhooks"
  | "conversations"
  | "dataroomUpload"
  | "inDocumentLinks"
  | "usStorage"
  | "dataroomIndex"
  | "dataroomFreeze"
  | "slack"
  | "annotations"
  | "dataroomInvitations"
  | "workflows"
  | "ai"
  | "sso"
  | "textSelection"
  | "redaction"
  | "requestList"
  | "logoOnAccessForm"
  | "htmlDocuments"
  | "hideFooterOnAccessForm";

type BetaFeaturesRecord = Record<BetaFeatures, string[]>;

export const getFeatureFlags = async ({ teamId }: { teamId?: string }) => {
  const teamFeatures: Record<BetaFeatures, boolean> = {
    tokens: false,
    incomingWebhooks: false,
    roomChangeNotifications: false,
    webhooks: false,
    conversations: false,
    dataroomUpload: false,
    inDocumentLinks: false,
    usStorage: false,
    dataroomIndex: false,
    dataroomFreeze: false,
    slack: false,
    annotations: false,
    dataroomInvitations: false,
    workflows: false,
    ai: false,
    sso: false,
    textSelection: false,
    redaction: false,
    requestList: false,
    logoOnAccessForm: false,
    htmlDocuments: false,
    hideFooterOnAccessForm: false,
  };

  // Return all features as false if edge config is not available
  if (!process.env.EDGE_CONFIG) {
    return Object.fromEntries(
      Object.entries(teamFeatures).map(([key, _v]) => [key, false]),
    );
  } else if (!teamId) {
    return teamFeatures;
  }

  let betaFeatures: BetaFeaturesRecord | undefined = undefined;

  try {
    betaFeatures = await get("betaFeatures");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Invalid or local EDGE_CONFIG tokens surface as Unauthorized; flags stay off.
    if (msg.includes("Unauthorized") || msg.includes("403")) {
      console.warn(
        "[featureFlags] Edge Config unavailable; beta flags default to off. Fix EDGE_CONFIG or unset it for local dev.",
      );
    } else {
      console.error(`Error getting beta features: ${e}`);
    }
  }

  if (betaFeatures) {
    for (const [featureFlag, teamIds] of Object.entries(betaFeatures)) {
      if (teamIds.includes(teamId)) {
        teamFeatures[featureFlag as BetaFeatures] = true;
      }
    }
  }

  return teamFeatures;
};
