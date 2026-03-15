import { Currency } from "./utils";

export enum PlanEnum {
  Pro = "Pro",
  Business = "Business",
  DataRooms = "Data Rooms",
  DataRoomsPlus = "Data Rooms Plus",
  DataRoomsPremium = "Data Rooms Premium",
  DataRoomsUnlimited = "Data Rooms Unlimited",
}

export const PLAN_NAME_MAP: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  business: "Business",
  datarooms: "Data Rooms",
  "datarooms-plus": "Data Rooms Plus",
  "datarooms-premium": "Data Rooms Premium",
  "datarooms-unlimited": "Data Rooms Unlimited",
};

export type PeriodType = "monthly" | "yearly";

export interface Feature {
  id: string;
  text: string;
  highlight?: boolean;
  tooltip?: string;
  isCustomDomain?: boolean;
  isUsers?: boolean;
  usersIncluded?: number;
  isHighlighted?: boolean;
  isNotIncluded?: boolean;
}

export interface PlanFeatures {
  featureIntro: string;
  features: Feature[];
}

export const PLAN_PRICING: Record<
  string,
  {
    extraUserPrice: {
      eur: { monthly: string; yearly: string };
      usd: { monthly: string; yearly: string };
    };
  }
> = {
  Pro: {
    extraUserPrice: {
      eur: { monthly: "€29/month per additional team member", yearly: "€24/month per additional team member" },
      usd: { monthly: "$34/month per additional team member", yearly: "$29/month per additional team member" },
    },
  },
  Business: {
    extraUserPrice: {
      eur: { monthly: "€26.50/month per additional team member", yearly: "€19/month per additional team member" },
      usd: { monthly: "$30/month per additional team member", yearly: "$22/month per additional team member" },
    },
  },
  "Data Rooms": {
    extraUserPrice: {
      eur: { monthly: "€49/month per additional team member", yearly: "€33/month per additional team member" },
      usd: { monthly: "$57/month per additional team member", yearly: "$39/month per additional team member" },
    },
  },
  "Data Rooms Plus": {
    extraUserPrice: {
      eur: { monthly: "€69/month per additional team member", yearly: "€49/month per additional team member" },
      usd: { monthly: "$79/month per additional team member", yearly: "$57/month per additional team member" },
    },
  },
  "Data Rooms Premium": {
    extraUserPrice: {
      eur: { monthly: "€70/month per additional team member", yearly: "€55/month per additional team member" },
      usd: { monthly: "$80/month per additional team member", yearly: "$65/month per additional team member" },
    },
  },
  "Data Rooms Unlimited": {
    extraUserPrice: {
      eur: { monthly: "Unlimited team members included", yearly: "Unlimited team members included" },
      usd: { monthly: "Unlimited team members included", yearly: "Unlimited team members included" },
    },
  },
};

export const BASE_FEATURES: Record<PlanEnum, PlanFeatures> = {
  [PlanEnum.Pro]: {
    featureIntro: "Everything in Free, plus:",
    features: [
      { id: "users", text: "1 team member included", isUsers: true, usersIncluded: 1 },
      { id: "documents", text: "300 documents" },
      { id: "links", text: "Unlimited links" },
      { id: "folder", text: "Folder organization" },
      { id: "uploads", text: "Large file uploads" },
      { id: "video", text: "Video sharing and analytics" },
      { id: "visitors", text: "Visitors analytics" },
      { id: "file-types-basic", text: "More file types: ppt, docx, excel" },
      { id: "branding", text: "Remove Papermark branding" },
      { id: "custom-branding", text: "Custom branding" },
      { id: "no-datarooms", text: "No datarooms included", isNotIncluded: true },
    ],
  },
  [PlanEnum.Business]: {
    featureIntro: "Everything in Pro, plus:",
    features: [
      { id: "users", text: "1 team member included", isUsers: true, usersIncluded: 1 },
      { id: "datarooms", text: "Multi-file sharing", tooltip: "Allow you to share multiple files and folders in a single links. Simplified data rooms settings for sharing multiple files and folders. " },
      { id: "documents", text: "1000 documents" },
      { id: "custom-domain", text: "Custom domain for documents", isCustomDomain: true },
      { id: "custom-social-cards", text: "Custom social media cards" },
      { id: "screenshot", text: "Screenshot protection" },
      { id: "email-verify", text: "Require email verification" },
      { id: "allow-block", text: "Allow/Block list" },
      { id: "webhooks", text: "Webhooks" },
      { id: "retention", text: "2-year analytics retention" },
    ],
  },
  [PlanEnum.DataRooms]: {
    featureIntro: "Everything in Business, plus:",
    features: [
      { id: "users", text: "1 team member included", isUsers: true, usersIncluded: 1 },
      { id: "datarooms", text: "Unlimited data rooms" },
      { id: "folder-levels", text: "Unlimited folder levels" },
      { id: "custom-domain", text: "Custom domain for data rooms", isCustomDomain: true },
      { id: "dataroom-branding", text: "Data room branding" },
      { id: "analytics", text: "Data room analytics" },
      { id: "nda", text: "NDA agreements" },
      { id: "watermark", text: "Dynamic watermark" },
      { id: "permissions", text: "Granular file level permissions" },
      { id: "groups", text: "Data room groups" },
      { id: "onboarding", text: "Priority support" },
    ],
  },
  [PlanEnum.DataRoomsPlus]: {
    featureIntro: "Everything in Data Rooms, plus:",
    features: [
      { id: "users", text: "1 team member included", isUsers: true, usersIncluded: 1 },
      { id: "documents", text: "Unlimited documents in data rooms" },
      { id: "custom-domain", text: "Unlimited custom domains for data rooms", isCustomDomain: true, highlight: true },
      { id: "audit", text: "Audit log for visitors" },
      { id: "email-invite", text: "Email invite viewers" },
      { id: "qa", text: "Q&A module with custom permissions" },
      { id: "requests", text: "File requests with permissions" },
      { id: "indexing", text: "Automatic file indexing" },
      { id: "invite", text: "Dataroom update notifications" },
      { id: "soc2", text: "SOC 2 Type II certified" },
      { id: "account-manager", text: "Dedicated account manager" },
      { id: "support", text: "24/7 priority support" },
    ],
  },
  [PlanEnum.DataRoomsPremium]: {
    featureIntro: "Everything in Data Rooms Plus, plus:",
    features: [
      { id: "teams", text: "Multiple teams (up to 5 teams)" },
      { id: "users", text: "1 team member included", isUsers: true, usersIncluded: 1 },
      { id: "storage", text: "Unlimited encrypted storage", highlight: true },
      { id: "file-size", text: "No file size limit" },
      { id: "workflows", text: "Workflows" },
      { id: "assign", text: "Assign team members" },
      { id: "sso", text: "SSO (Single Sign-On) on request" },
      { id: "whitelabel", text: "Whitelabeling" },
      { id: "api", text: "Full API access" },
      { id: "security", text: "Advanced security and certification" },
      { id: "onboarding", text: "Priority onboarding & training" },
      { id: "support", text: "Dedicated support team" },
    ],
  },
  [PlanEnum.DataRoomsUnlimited]: {
    featureIntro: "Everything in Data Rooms Premium, plus:",
    features: [
      { id: "users", text: "Unlimited team members", isUsers: true, usersIncluded: 100 },
      { id: "teams", text: "Unlimited teams" },
      { id: "storage", text: "Unlimited encrypted storage", highlight: true },
      { id: "file-size", text: "No file size limit" },
      { id: "sla", text: "Custom SLA" },
      { id: "sso", text: "SSO (Single Sign-On)" },
      { id: "whitelabel", text: "Full whitelabeling" },
      { id: "api", text: "Full API access" },
      { id: "security", text: "Advanced security and certification" },
      { id: "onboarding", text: "Dedicated onboarding & training" },
      { id: "support", text: "Dedicated support team" },
    ],
  },
};

interface FeatureOptions {
  period?: PeriodType;
  currency?: Currency;
  showHighlighted?: boolean;
  maxFeatures?: number;
  excludeFeatures?: string[];
  includeFeatures?: string[];
  highlightFeatures?: string[];
  showDataRoomsPlus?: boolean;
}

export function getPlanFeatures(
  plan: PlanEnum,
  options: FeatureOptions = {},
): PlanFeatures {
  const {
    period = "monthly",
    currency = "eur",
    showHighlighted = false,
    maxFeatures,
    excludeFeatures = [],
    includeFeatures = [],
    highlightFeatures = [],
    showDataRoomsPlus = false,
  } = options;

  let effectivePlan = plan;
  if (showDataRoomsPlus && plan === PlanEnum.DataRooms) {
    effectivePlan = PlanEnum.DataRoomsPlus;
  }

  const basePlanFeatures = BASE_FEATURES[effectivePlan];
  let features = [...basePlanFeatures.features];

  if (includeFeatures.length > 0) {
    features = features.filter((feature) =>
      includeFeatures.includes(feature.id),
    );
  }

  if (excludeFeatures.length > 0) {
    features = features.filter(
      (feature) => !excludeFeatures.includes(feature.id),
    );
  }

  features = features.map((feature) => {
    const newFeature = { ...feature };

    if (feature.isUsers && PLAN_PRICING[effectivePlan]) {
      newFeature.tooltip =
        PLAN_PRICING[effectivePlan].extraUserPrice[currency][period];
    }

    if (highlightFeatures.includes(feature.id)) {
      newFeature.isHighlighted = true;
    }

    return newFeature;
  });

  if (showHighlighted) {
    features = features.filter((feature) => feature.highlight);
  }

  if (maxFeatures) {
    features = features.slice(0, maxFeatures);
  }

  return {
    featureIntro: basePlanFeatures.featureIntro,
    features,
  };
}
