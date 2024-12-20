// INFO: for numeric values,`null` means unlimited

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
};

export const FREE_PLAN_LIMITS = {
  users: 1,
  links: 10,
  documents: 10,
  domains: 0,
  datarooms: 0,
  customDomainOnPro: false,
  customDomainInDataroom: false,
  advancedLinkControlsOnPro: false,
};

export const PRO_PLAN_LIMITS = {
  users: 2,
  links: null,
  documents: 100,
  domains: 2,
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
  datarooms: 1,
  customDomainOnPro: true,
  customDomainInDataroom: false,
  advancedLinkControlsOnPro: false,
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
};
