export enum PlanEnum {
  Pro = "Pro",
  Business = "Business",
  DataRooms = "Data Rooms",
  DataRoomsPlus = "Data Rooms Plus",
}

export const PLAN_NAME_MAP: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
  business: "Business",
  datarooms: "Data Rooms",
  "datarooms-plus": "Data Rooms Plus",
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

export const PLAN_PRICING = {
  Pro: {
    extraUserPrice: {
      monthly: "€29/month per additional user",
      yearly: "€24/month per additional user",
    },
  },
  Business: {
    extraUserPrice: {
      monthly: "€26/month per additional user",
      yearly: "€19/month per additional user",
    },
  },
  "Data Rooms": {
    extraUserPrice: {
      monthly: "€49/month per additional user",
      yearly: "€33/month per additional user",
    },
  },
  "Data Rooms Plus": {
    extraUserPrice: {
      monthly: "€69/month per additional user",
      yearly: "€49/month per additional user",
    },
  },
} as const;

export const BASE_FEATURES: Record<PlanEnum, PlanFeatures> = {
  [PlanEnum.Pro]: {
    featureIntro: "Everything in Free, plus:",
    features: [
      { id: "users", text: "1 user included", isUsers: true, usersIncluded: 1 },
      { id: "documents", text: "300 documents" },
      { id: "links", text: "Unlimited links" },
      { id: "folder", text: "Folder organization" },
      { id: "uploads", text: "Large file uploads" },
      { id: "video", text: "Video sharing and analytics" },
      { id: "visitors", text: "Visitors analytics" },
      { id: "file-types-basic", text: "More file types: ppt, docx, excel" },
      { id: "branding", text: "Remove Papermark branding" },
      { id: "custom-branding", text: "Custom branding" },
      { id: "retention", text: "1-year analytics retention" },
      { id: "no-datarooms", text: "No datarooms included", isNotIncluded: true },
    ],
  },
  [PlanEnum.Business]: {
    featureIntro: "Everything in Pro, plus:",
    features: [
      {
        id: "users",
        text: "3 users included",
        isUsers: true,
        usersIncluded: 3,
      },
      { 
        id: "datarooms", 
        text: "Unlimited light data rooms",
        tooltip: "Light data rooms include only basic security settings for sharing your data room, described in Business plan. "
      },
      { id: "documents", text: "1000 documents per data room" },
      {
        id: "custom-domain",
        text: "Custom domain for documents",
        isCustomDomain: true,
      },
      { id: "folder-levels", text: "Unlimited folder levels" },
      { id: "multi-file", text: "Multi-file sharing" },
      { id: "custom-social-cards", text: "Custom social media cards" },
      { id: "screenshot", text: "Screenshot protection" },
      { id: "email-verify", text: "Require email verification" },
      { id: "allow-block", text: "Allow/Block list" },
      { id: "dataroom-branding", text: "Dataroom branding" },
      { id: "webhooks", text: "Webhooks" },
      { id: "file-types-advanced", text: "More file types: dwg, kml, zip" },
      { id: "retention", text: "2-year analytics retention" },
    ],
  },
  [PlanEnum.DataRooms]: {
    featureIntro: "Everything in Business, plus:",
    features: [
      {
        id: "users",
        text: "3 users included",
        isUsers: true,
        usersIncluded: 3,
      },
      { id: "datarooms", text: "Unlimited data rooms" },
      { id: "documents", text: "Unlimited documents" },
      {
        id: "custom-domain",
        text: "Custom domain for data rooms",
        isCustomDomain: true,
      },
      { id: "analytics", text: "Data rooms analytics" },
      { id: "nda", text: "NDA agreements" },
      { id: "watermark", text: "Dynamic watermark" },
      { id: "permissions", text: "Granular user/group permissions" },
      { id: "audit", text: "Audit log for viewers" },
      { id: "support", text: "24h priority support" },
      { id: "onboarding", text: "Custom onboarding" },
      { id: "retention", text: "2-year analytics retention" },
    ],
  },
  [PlanEnum.DataRoomsPlus]: {
    featureIntro: "Everything in Data Rooms, plus:",
    features: [
      {
        id: "users",
        text: "5 users included",
        isUsers: true,
        usersIncluded: 5,
      },
      { id: "storage", text: "Unlimited encrypted storage", highlight: true },
      { id: "file-size", text: "No file size limit" },
      {
        id: "custom-domain",
        text: "Unlimited custom domains for data rooms",
        isCustomDomain: true,
        highlight: true,
      },
      { id: "qa", text: "Q&A module with custom permissions" },
      { id: "requests", text: "File requests with permissions" },
      { id: "indexing", text: "Automatic file indexing" },
      { id: "assign", text: "Assign users to particular data room" },
      { id: "invite", text: "Dataroom update notifications" },
      { id: "account-manager", text: "Dedicated account manager" },
      { id: "white-label", text: "Add-on: Full white-labeling" },
      { id: "retention", text: "3-year analytics retention" },
    ],
  },
};

interface FeatureOptions {
  period?: PeriodType;
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
    showHighlighted = false,
    maxFeatures,
    excludeFeatures = [],
    includeFeatures = [],
    highlightFeatures = [],
    showDataRoomsPlus = false,
  } = options;

  // If showing Data Rooms Plus features instead of Data Rooms
  let effectivePlan = plan;
  if (showDataRoomsPlus && plan === PlanEnum.DataRooms) {
    effectivePlan = PlanEnum.DataRoomsPlus;
  }

  const basePlanFeatures = BASE_FEATURES[effectivePlan];
  let features = [...basePlanFeatures.features];

  // Filter features based on options
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

  // Add pricing tooltip for user features and handle highlighting
  features = features.map((feature) => {
    const newFeature = { ...feature };

    if (feature.isUsers) {
      // Use the pricing from the effective plan
      newFeature.tooltip = PLAN_PRICING[effectivePlan].extraUserPrice[period];
    }

    // Add isHighlighted property if feature is in highlightFeatures
    if (highlightFeatures.includes(feature.id)) {
      newFeature.isHighlighted = true;
    }

    return newFeature;
  });

  // Only show highlighted features if specified
  if (showHighlighted) {
    features = features.filter((feature) => feature.highlight);
  }

  // Limit number of features if specified
  if (maxFeatures) {
    features = features.slice(0, maxFeatures);
  }

  return {
    featureIntro: basePlanFeatures.featureIntro,
    features,
  };
}
