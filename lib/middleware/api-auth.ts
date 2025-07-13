import { NextApiRequest, NextApiResponse } from "next";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { hashToken } from "@/lib/api/auth/token";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { RestrictedToken, UserTeam, Team } from "@prisma/client";

// Types for the middleware
interface TeamWithUsers extends Team {
  users: Array<{ role: UserTeam["role"] }>;
}

export interface AuthenticatedRequest extends NextApiRequest {
  user: CustomUser;
  team: TeamWithUsers;
  token?: RestrictedToken;
}

export interface AuthContext {
  user: CustomUser;
  team: TeamWithUsers;
  token?: RestrictedToken;
}

// Base authentication middleware
export async function withAuth(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>,
): Promise<void> {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = session.user as CustomUser;

    return handler(authenticatedReq, res);
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ error: "Authentication failed" });
  }
}

// Team access middleware
export async function withTeamAccess(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>,
  options?: {
    requireAdmin?: boolean;
    requireManager?: boolean;
  },
): Promise<void> {
  return withAuth(req, res, async (authenticatedReq, res) => {
    const { teamId } = authenticatedReq.query as { teamId: string };

    if (!teamId) {
      return res.status(400).json({ error: "Team ID is required" });
    }

    try {
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: authenticatedReq.user.id,
            },
          },
        },
        include: {
          users: {
            where: {
              userId: authenticatedReq.user.id,
            },
            select: {
              role: true,
            },
          },
        },
      });

      if (!team) {
        return res
          .status(401)
          .json({ error: "Unauthorized to access this team" });
      }

      const userRole = team.users[0]?.role;

      // Check role requirements
      if (options?.requireAdmin && userRole !== "ADMIN") {
        return res.status(403).json({ error: "Admin access required" });
      }

      if (
        options?.requireManager &&
        !["ADMIN", "MANAGER"].includes(userRole || "")
      ) {
        return res.status(403).json({ error: "Manager access required" });
      }

      authenticatedReq.team = team;
      return handler(authenticatedReq, res);
    } catch (error) {
      console.error("Team access error:", error);
      return res.status(500).json({ error: "Failed to verify team access" });
    }
  });
}

// API token authentication middleware
export async function withApiToken(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "Missing or invalid authorization header" });
    }

    const token = authHeader.replace("Bearer ", "");
    const hashedToken = hashToken(token);

    const restrictedToken = await prisma.restrictedToken.findUnique({
      where: { hashedKey: hashedToken },
    });

    if (!restrictedToken) {
      return res.status(401).json({ error: "Invalid token" });
    }

    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.token = restrictedToken;

    // Get user from token
    const user = await prisma.user.findUnique({
      where: { id: restrictedToken.userId },
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    authenticatedReq.user = user as CustomUser;

    return handler(authenticatedReq, res);
  } catch (error) {
    console.error("API token authentication error:", error);
    return res.status(500).json({ error: "Token authentication failed" });
  }
}

// Combined authentication that supports both session and API token
export async function withAuthOrToken(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>,
): Promise<void> {
  // Check for API token first
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith("Bearer ")) {
    return withApiToken(req, res, handler);
  } else {
    return withAuth(req, res, handler);
  }
}

// Combined team access with auth or token
export async function withTeamAccessOrToken(
  req: NextApiRequest,
  res: NextApiResponse,
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>,
  options?: {
    requireAdmin?: boolean;
    requireManager?: boolean;
  },
): Promise<void> {
  return withAuthOrToken(req, res, async (authenticatedReq, res) => {
    const { teamId } = authenticatedReq.query as { teamId: string };

    if (!teamId) {
      return res.status(400).json({ error: "Team ID is required" });
    }

    try {
      // If using API token, verify team access
      if (authenticatedReq.token) {
        if (authenticatedReq.token.teamId !== teamId) {
          return res
            .status(401)
            .json({ error: "Token not authorized for this team" });
        }

        // Get team info for API token requests
        const team = await prisma.team.findUnique({
          where: { id: teamId },
          include: {
            users: {
              where: {
                userId: authenticatedReq.user.id,
              },
              select: {
                role: true,
              },
            },
          },
        });

        if (!team) {
          return res.status(404).json({ error: "Team not found" });
        }

        authenticatedReq.team = team;
        return handler(authenticatedReq, res);
      }

      // For session auth, use the existing team access logic
      const team = await prisma.team.findUnique({
        where: {
          id: teamId,
          users: {
            some: {
              userId: authenticatedReq.user.id,
            },
          },
        },
        include: {
          users: {
            where: {
              userId: authenticatedReq.user.id,
            },
            select: {
              role: true,
            },
          },
        },
      });

      if (!team) {
        return res
          .status(401)
          .json({ error: "Unauthorized to access this team" });
      }

      const userRole = team.users[0]?.role;

      if (options?.requireAdmin && userRole !== "ADMIN") {
        return res.status(403).json({ error: "Admin access required" });
      }

      if (
        options?.requireManager &&
        !["ADMIN", "MANAGER"].includes(userRole || "")
      ) {
        return res.status(403).json({ error: "Manager access required" });
      }

      authenticatedReq.team = team;
      return handler(authenticatedReq, res);
    } catch (error) {
      console.error("Team access error:", error);
      return res.status(500).json({ error: "Failed to verify team access" });
    }
  });
}

// Utility function to create API handlers with authentication
export function createAuthenticatedHandler(
  handlers: {
    GET?: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>;
    POST?: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>;
    PUT?: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>;
    PATCH?: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>;
    DELETE?: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>;
  },
  authType: "session" | "token" | "both" = "both",
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const handler = handlers[req.method as keyof typeof handlers];

    if (!handler) {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const authMiddleware =
      authType === "session"
        ? withAuth
        : authType === "token"
          ? withApiToken
          : withAuthOrToken;

    return authMiddleware(req, res, handler);
  };
}

// Utility function to create team-based API handlers
export function createTeamHandler(
  handlers: {
    GET?: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>;
    POST?: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>;
    PUT?: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>;
    PATCH?: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>;
    DELETE?: (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void>;
  },
  options?: {
    requireAdmin?: boolean;
    requireManager?: boolean;
    authType?: "session" | "token" | "both";
  },
) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const handler = handlers[req.method as keyof typeof handlers];

    if (!handler) {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const authType = options?.authType || "both";
    const authMiddleware =
      authType === "session"
        ? withTeamAccess
        : authType === "token"
          ? withTeamAccessOrToken
          : withTeamAccessOrToken;

    return authMiddleware(req, res, handler, {
      requireAdmin: options?.requireAdmin,
      requireManager: options?.requireManager,
    });
  };
}
