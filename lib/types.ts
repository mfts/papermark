import {
  Agreement,
  Dataroom,
  DataroomDocument,
  DataroomFolder,
  Document,
  DocumentVersion,
  Feedback,
  Link,
  User as PrismaUser,
  View,
} from "@prisma/client";
import { User as NextAuthUser } from "next-auth";
import { z } from "zod";

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
  feedback: { id: true; data: { question: string; type: string } } | null;
}

export interface LinkWithDocument extends Link {
  document: Document & {
    versions: {
      id: string;
      versionNumber: number;
      type: string;
      hasPages: boolean;
      file: string;
      isVertical: boolean;
    }[];
    team: {
      plan: string;
    } | null;
  };
  feedback: {
    id: string;
    data: {
      question: string;
      type: string;
    };
  } | null;
  agreement: Agreement | null;
}

export interface LinkWithDataroom extends Link {
  dataroom: {
    id: string;
    name: string;
    teamId: string;
    documents: {
      id: string;
      folderId: string | null;
      orderIndex: number | null;
      document: {
        id: string;
        name: string;
        versions: {
          id: string;
          versionNumber: number;
          type: string;
          hasPages: boolean;
          file: string;
          isVertical: boolean;
        }[];
      };
    }[];
    folders: DataroomFolder[];
    lastUpdatedAt: Date;
  };
  agreement: Agreement | null;
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
  | "Unknown Error"
  | "Conflicting DNS Records";

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
  /** conflicts */
  conflicts: {
    name: string;
    type: string;
    value: string;
  }[];
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
    }
  | {
      event: "Team Member Invitation Accepted";
      teamId: string;
    }
  | {
      event: "Stripe Checkout Clicked";
      teamId: string;
      priceId: string;
    }
  | {
      event: "Stripe Billing Portal Clicked";
      teamId: string;
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
    role: "ADMIN" | "MANAGER" | "MEMBER";
    teamId: string;
    user: {
      email: string;
      name: string;
    };
    userId: string;
  }[];
}

export const WatermarkConfigSchema = z.object({
  text: z.string().min(1, "Text is required."),
  isTiled: z.boolean(),
  position: z.enum([
    "top-left",
    "top-center",
    "top-right",
    "middle-left",
    "middle-center",
    "middle-right",
    "bottom-left",
    "bottom-center",
    "bottom-right",
  ]),
  rotation: z.union([
    z.literal(0),
    z.literal(30),
    z.literal(45),
    z.literal(90),
    z.literal(180),
  ]),
  color: z.string().refine((val) => /^#([0-9A-F]{3}){1,2}$/i.test(val), {
    message: "Invalid color format. Use HEX format like #RRGGBB.",
  }),
  fontSize: z.number().min(1, "Font size must be greater than 0."),
  opacity: z.number().min(0).max(1, "Opacity must be between 0 and 1."),
});

export type WatermarkConfig = z.infer<typeof WatermarkConfigSchema>;

export type NotionTheme = "light" | "dark";
