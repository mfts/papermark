// INFO: for numeric values,`null` means unlimited

/**
 * Invitation rate limits for email invitations
 */
export type TInvitationLimits = {
  maxEmailsPerRequest: number;
  maxInvitationsPerHour: number;
  maxInvitationsPerDay: number;
};

/**
 * Default invitation limits applied to all plans
 * These can be overridden per team via the team's limits configuration
 */
export const DEFAULT_INVITATION_LIMITS: TInvitationLimits = {
  maxEmailsPerRequest: 30,
  maxInvitationsPerHour: 50,
  maxInvitationsPerDay: 200,
};

export type TPlanLimits = {
  users: number;
  links: number | null;
  documents: number | null;
  domains: number;
  datarooms: number;
  customDomainOnPro: boolean;
  customDomainInDataroom: boolean;
  advancedLinkControlsOnPro: boolean | null;
  watermarkOnBusiness?: boolean | null;
  agreementOnBusiness?: boolean | null;
  invitations?: TInvitationLimits;
};

export const FREE_PLAN_LIMITS = {
  users: 1,
  links: 50,
  documents: 50,
  domains: 0,
  datarooms: 0,
  customDomainOnPro: false,
  customDomainInDataroom: false,
  advancedLinkControlsOnPro: false,
};

export const PRO_PLAN_LIMITS = {
  users: 1,
  links: null,
  documents: 300,
  domains: 0,
  datarooms: 0,
  customDomainOnPro: false,
  customDomainInDataroom: false,
  advancedLinkControlsOnPro: false,
};

export const BUSINESS_PLAN_LIMITS = {
  users: 3,
  links: null,
  documents: null,
  domains: 5,
  datarooms: 100,
  customDomainOnPro: true,
  customDomainInDataroom: false,
  advancedLinkControlsOnPro: false,
  fileSizeLimits: {
    maxFiles: 500,
  },
};

export const DATAROOMS_PLAN_LIMITS = {
  users: 3,
  links: null,
  documents: null,
  domains: 10,
  datarooms: 100,
  customDomainOnPro: true,
  customDomainInDataroom: true,
  advancedLinkControlsOnPro: false,
  fileSizeLimits: {
    maxFiles: 1000,
  },
};

export const DATAROOMS_PLUS_PLAN_LIMITS = {
  users: 5,
  links: null,
  documents: null,
  domains: 1000,
  datarooms: 1000,
  customDomainOnPro: true,
  customDomainInDataroom: true,
  conversationsInDataroom: true,
  advancedLinkControlsOnPro: false,
  fileSizeLimits: {
    maxFiles: 5000,
    maxPages: 1000,
  },
};

export const DATAROOMS_PREMIUM_PLAN_LIMITS = {
  users: 10,
  links: null,
  documents: null,
  domains: 1000,
  datarooms: 1000,
  customDomainOnPro: true,
  customDomainInDataroom: true,
  conversationsInDataroom: true,
  advancedLinkControlsOnPro: false,
  fileSizeLimits: {
    maxFiles: 5000,
    maxPages: 1000,
  },
};

export const PAUSED_PLAN_LIMITS = {
  // During pause: keep all data accessible but restrict new creations and views
  canCreateLinks: false,
  canReceiveViews: false,
  canCreateDocuments: false,
  canCreateDatarooms: false,
  // Keep existing access
  canViewAnalytics: true,
  canAccessExistingContent: true,
};
