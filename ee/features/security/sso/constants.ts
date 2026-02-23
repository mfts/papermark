export const SAML_PROVIDERS = [
  {
    name: "Okta",
    saml: "okta",
    samlModalCopy: "Metadata URL",
    scim: "okta-scim-v2",
    scimModalCopy: {
      url: "SCIM 2.0 Base URL",
      token: "OAuth Bearer Token",
    },
  },
  {
    name: "Entra ID (formerly Azure AD)",
    saml: "azure",
    samlModalCopy: "App Federation Metadata URL",
    scim: "azure-scim-v2",
    scimModalCopy: {
      url: "Tenant URL",
      token: "Secret Token",
    },
  },
  {
    name: "Google Workspace",
    saml: "google",
    samlModalCopy: "XML Metadata File",
    scim: "google",
    scimModalCopy: {
      url: "SCIM 2.0 Base URL",
      token: "OAuth Bearer Token",
    },
  },
] as const;

export type SAMLProviderKey = (typeof SAML_PROVIDERS)[number]["saml"];
export type SCIMProviderKey = (typeof SAML_PROVIDERS)[number]["scim"];
