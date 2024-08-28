export const FREE_PLAN_LIMITS = {
  users: 1,
  domains: 0,
  datarooms: 0,
  customDomainOnPro: false,
  customDomainInDataroom: false,
  advancedLinkControlsOnPro: false,
};

export const PRO_PLAN_LIMITS = {
  users: 2,
  domains: 5,
  datarooms: 0,
  customDomainOnPro: false,
  customDomainInDataroom: false,
  advancedLinkControlsOnPro: false,
};

export const BUSINESS_PLAN_LIMITS = {
  users: 3,
  domains: 5,
  datarooms: 1,
  customDomainOnPro: true,
  customDomainInDataroom: false,
  advancedLinkControlsOnPro: false,
};

export const DATAROOMS_PLAN_LIMITS = {
  users: 3,
  domains: 10,
  datarooms: 100,
  customDomainOnPro: true,
  customDomainInDataroom: true,
  advancedLinkControlsOnPro: false,
};
