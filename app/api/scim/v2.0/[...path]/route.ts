import { NextRequest, NextResponse } from "next/server";

import {
  type DirectorySyncEvent,
  type DirectorySyncRequest,
} from "@boxyhq/saml-jackson";

import initJackson from "@/lib/jackson";
import prisma from "@/lib/prisma";

const toJsonBody = async (req: NextRequest): Promise<Record<string, unknown>> => {
  if (!["POST", "PUT", "PATCH"].includes(req.method)) {
    return {};
  }

  const rawBody = await req.text();
  if (!rawBody) return {};

  try {
    return JSON.parse(rawBody);
  } catch {
    return {};
  }
};

const normalizeResourceType = (resourceType?: string): string => {
  const normalized = (resourceType ?? "").toLowerCase();

  if (normalized.startsWith("user")) return "users";
  if (normalized.startsWith("group")) return "groups";

  return normalized;
};

const toOptionalBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  return null;
};

const toDisplayName = (firstName?: string, lastName?: string): string | null => {
  const fullName = [firstName, lastName].filter(Boolean).join(" ").trim();
  return fullName.length > 0 ? fullName : null;
};

const upsertProvisionedUser = async (params: {
  email: string;
  firstName?: string;
  lastName?: string;
  teamId: string;
}) => {
  const { email, firstName, lastName, teamId } = params;

  const user = await prisma.user.upsert({
    where: {
      email,
    },
    update: {
      name: toDisplayName(firstName, lastName) ?? undefined,
    },
    create: {
      email,
      name: toDisplayName(firstName, lastName),
      emailVerified: new Date(),
    },
  });

  await prisma.userTeam.upsert({
    where: {
      userId_teamId: {
        userId: user.id,
        teamId,
      },
    },
    update: {
      status: "ACTIVE",
    },
    create: {
      userId: user.id,
      teamId,
      role: "MEMBER",
      status: "ACTIVE",
    },
  });
};

const removeProvisionedUserMembership = async (params: {
  email: string;
  teamId: string;
}) => {
  const user = await prisma.user.findUnique({
    where: {
      email: params.email,
    },
    select: {
      id: true,
    },
  });

  if (!user) return;

  await prisma.userTeam.deleteMany({
    where: {
      userId: user.id,
      teamId: params.teamId,
    },
  });
};

async function handleSCIMEvents(event: DirectorySyncEvent) {
  const { event: eventType, data, tenant } = event;

  try {
    if (!tenant) return;

    if (eventType.startsWith("group.")) {
      console.info("[SCIM] Group event received:", {
        eventType,
        tenant,
      });
      return;
    }

    if (!("email" in data) || typeof data.email !== "string") {
      // Group events do not always include an email.
      return;
    }

    const email = data.email.trim().toLowerCase();
    if (!email) return;

    if (eventType === "user.created") {
      await upsertProvisionedUser({
        email,
        firstName: data.first_name,
        lastName: data.last_name,
        teamId: tenant,
      });
      return;
    }

    if (eventType === "user.updated") {
      const active = toOptionalBoolean(data.active);

      if (active === false) {
        await removeProvisionedUserMembership({
          email,
          teamId: tenant,
        });
        return;
      }

      if (active === true || active === null) {
        await upsertProvisionedUser({
          email,
          firstName: data.first_name,
          lastName: data.last_name,
          teamId: tenant,
        });
      }
      return;
    }

    if (eventType === "user.deleted") {
      await removeProvisionedUserMembership({
        email,
        teamId: tenant,
      });
    }
  } catch (error) {
    console.error("[SCIM] Failed to process event:", eventType, error);
  }
}

async function handleSCIMRequest(
  req: NextRequest,
  context: { params: { path: string[] } },
) {
  const { directorySyncController } = await initJackson();
  const body = await toJsonBody(req);

  const pathParts = context.params.path ?? [];
  const [directoryId, resourceType, resourceId] = pathParts;

  if (!directoryId) {
    return NextResponse.json(
      { error: "Invalid SCIM path. Missing directory ID." },
      { status: 400 },
    );
  }

  const url = new URL(req.url);
  const query: DirectorySyncRequest["query"] = {
    count: url.searchParams.get("count")
      ? Number(url.searchParams.get("count"))
      : undefined,
    startIndex: url.searchParams.get("startIndex")
      ? Number(url.searchParams.get("startIndex"))
      : undefined,
    filter: url.searchParams.get("filter") ?? undefined,
  };

  const authorization = req.headers.get("authorization");
  const apiSecret = authorization
    ? authorization.replace(/^Bearer\s+/i, "").trim()
    : null;

  const request: DirectorySyncRequest = {
    method: req.method,
    body,
    query,
    directoryId,
    resourceType: normalizeResourceType(resourceType),
    resourceId,
    apiSecret,
  };

  const { status, data } = await directorySyncController.requests.handle(
    request,
    handleSCIMEvents,
  );

  return NextResponse.json(data, { status });
}

export async function GET(
  req: NextRequest,
  context: { params: { path: string[] } },
) {
  return handleSCIMRequest(req, context);
}

export async function POST(
  req: NextRequest,
  context: { params: { path: string[] } },
) {
  return handleSCIMRequest(req, context);
}

export async function PUT(
  req: NextRequest,
  context: { params: { path: string[] } },
) {
  return handleSCIMRequest(req, context);
}

export async function PATCH(
  req: NextRequest,
  context: { params: { path: string[] } },
) {
  return handleSCIMRequest(req, context);
}

export async function DELETE(
  req: NextRequest,
  context: { params: { path: string[] } },
) {
  return handleSCIMRequest(req, context);
}
