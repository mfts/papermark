import { User as NextAuthUser } from "next-auth";
import {
  Document,
  Link,
  View,
  User as PrismaUser,
  DocumentVersion,
} from "@prisma/client";

export type CustomUser = NextAuthUser & PrismaUser;

export interface CreateUserEmailProps {
  user: {
    name: string | null | undefined;
    email: string | null | undefined;
  };
}

export interface DocumentWithLinksAndLinkCountAndViewCount extends Document {
  _count: {
    links: number;
    views: number;
    versions: number;
  };
  links: Link[];
}

export interface DocumentWithVersion extends Document {
  versions: DocumentVersion[];
}

export interface LinkWithViews extends Link {
  _count: {
    views: number;
  };
  views: View[];
}

export interface LinkWithDocument extends Link {
  document: Document & {
    versions: { versionNumber: number }[];
  };
}

export interface Geo {
  city?: string | undefined;
  country?: string | undefined;
  region?: string | undefined;
  latitude?: string | undefined;
  longitude?: string | undefined;
}

// Custom Domain Types

export type DomainVerificationStatusProps =
  | "Valid Configuration"
  | "Invalid Configuration"
  | "Pending Verification"
  | "Domain Not Found"
  | "Unknown Error";

// From https://vercel.com/docs/rest-api/endpoints#get-a-project-domain
export interface DomainResponse {
  name: string;
  apexName: string;
  projectId: string;
  redirect?: string | null;
  redirectStatusCode?: (307 | 301 | 302 | 308) | null;
  gitBranch?: string | null;
  updatedAt?: number;
  createdAt?: number;
  /** `true` if the domain is verified for use with the project. If `false` it will not be used as an alias on this project until the challenge in `verification` is completed. */
  verified: boolean;
  /** A list of verification challenges, one of which must be completed to verify the domain for use on the project. After the challenge is complete `POST /projects/:idOrName/domains/:domain/verify` to verify the domain. Possible challenges: - If `verification.type = TXT` the `verification.domain` will be checked for a TXT record matching `verification.value`. */
  verification: {
    type: string;
    domain: string;
    value: string;
    reason: string;
  }[];
}

// From https://vercel.com/docs/rest-api/endpoints#get-a-domain-s-configuration
export interface DomainConfigResponse {
  /** How we see the domain's configuration. - `CNAME`: Domain has a CNAME pointing to Vercel. - `A`: Domain's A record is resolving to Vercel. - `http`: Domain is resolving to Vercel but may be behind a Proxy. - `null`: Domain is not resolving to Vercel. */
  configuredBy?: ("CNAME" | "A" | "http") | null;
  /** Which challenge types the domain can use for issuing certs. */
  acceptedChallenges?: ("dns-01" | "http-01")[];
  /** Whether or not the domain is configured AND we can automatically generate a TLS certificate. */
  misconfigured: boolean;
}

// From https://vercel.com/docs/rest-api/endpoints#verify-project-domain
export interface DomainVerificationResponse {
  name: string;
  apexName: string;
  projectId: string;
  redirect?: string | null;
  redirectStatusCode?: (307 | 301 | 302 | 308) | null;
  gitBranch?: string | null;
  updatedAt?: number;
  createdAt?: number;
  /** `true` if the domain is verified for use with the project. If `false` it will not be used as an alias on this project until the challenge in `verification` is completed. */
  verified: boolean;
  /** A list of verification challenges, one of which must be completed to verify the domain for use on the project. After the challenge is complete `POST /projects/:idOrName/domains/:domain/verify` to verify the domain. Possible challenges: - If `verification.type = TXT` the `verification.domain` will be checked for a TXT record matching `verification.value`. */
  verification?: {
    type: string;
    domain: string;
    value: string;
    reason: string;
  }[];
}

export type AnalyticsEvents =
  | {
      event: "User Signed Up";
      userId: string;
      email: string | null | undefined;
    }
  | {
      event: "Document Added";
      documentId: string;
      name: string;
      fileSize: string | null | undefined;
      path: string | null | undefined;
    }
  | {
      event: "Link Added";
      linkId: string;
      documentId: string;
      customDomain: string | null | undefined;
    }
  | { event: "User Upgraded"; email: string | null | undefined }
  | {
      event: "User Signed In";
      email: string | null | undefined;
    }
  | {
      event: "Link Viewed";
      documentId: string;
      linkId: string;
      viewerId: string;
      viewerEmail: string | null | undefined;
    }
  | {
      event: "Domain Added";
      slug: string;
    }
  | {
      event: "Domain Verified";
      slug: string;
    }
  | {
      event: "Domain Deleted";
      slug: string;
    };

export interface Team {
  id: string;
  name?: string;
}

export interface TeamDetail {
  id: string;
  name: string;
  documents: {
    owner: {
      id: string;
      name: string;
    };
  }[];
  users: {
    role: "ADMIN" | "MEMBER";
    teamId: string;
    user: {
      email: string;
      name: string;
    };
    userId: string;
  }[];
}
