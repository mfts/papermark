import { NextApiRequest, NextApiResponse } from "next";

import { LinkPreset } from "@prisma/client";
import { put } from "@vercel/blob";
import { waitUntil } from "@vercel/functions";
import { z } from "zod";

import { hashToken } from "@/lib/api/auth/token";
import { createDocument } from "@/lib/documents/create-document";
import { putFileServer } from "@/lib/files/put-file-server";
import { extractTeamId, isValidWebhookId } from "@/lib/incoming-webhooks";
import prisma from "@/lib/prisma";
import { ratelimit } from "@/lib/redis";
import {
  convertDataUrlToBuffer,
  generateEncrpytedPassword,
  isDataUrl,
  uploadImage,
} from "@/lib/utils";
import {
  getExtensionFromContentType,
  getSupportedContentType,
} from "@/lib/utils/get-content-type";
import { sendLinkCreatedWebhook } from "@/lib/webhook/triggers/link-created";
import { webhookFileUrlSchema } from "@/lib/zod/url-validation";

export const config = {
  // in order to enable `waitUntil` function
  supportsResponseStreaming: true,
  maxDuration: 120,
};

// Define a common link schema to reuse
const LinkSchema = z.object({
  name: z.string().optional(),
  domain: z.string().optional(),
  slug: z.string().optional(),
  password: z.string().optional(),
  expiresAt: z.string().optional(), // ISO string date
  emailProtected: z.boolean().optional(),
  emailAuthenticated: z.boolean().optional(),
  allowDownload: z.boolean().optional(),
  enableNotification: z.boolean().optional(),
  enableFeedback: z.boolean().optional(),
  enableScreenshotProtection: z.boolean().optional(),
  showBanner: z.boolean().optional(),
  audienceType: z.enum(["GENERAL", "GROUP", "TEAM"]).optional(),
  groupId: z.string().optional(),
  allowList: z.array(z.string()).optional(),
  denyList: z.array(z.string()).optional(),
  presetId: z.string().optional(),
});

// Define validation schemas for different resource types
const BaseSchema = z.object({
  resourceType: z.enum(["document.create", "link.create", "dataroom.create"]),
});

const DocumentCreateSchema = BaseSchema.extend({
  resourceType: z.literal("document.create"),
  fileUrl: webhookFileUrlSchema,
  name: z.string(),
  contentType: z.string(),
  dataroomId: z.string().optional(),
  folderId: z.string().nullable().optional(),
  createLink: z.boolean().optional().default(false),
  link: LinkSchema.optional(),
});

const LinkCreateSchema = BaseSchema.extend({
  resourceType: z.literal("link.create"),
  targetId: z.string(),
  linkType: z.enum(["DOCUMENT_LINK", "DATAROOM_LINK"]),
  link: LinkSchema,
});

const DataroomCreateSchema = BaseSchema.extend({
  resourceType: z.literal("dataroom.create"),
  name: z.string(),
  description: z.string().optional(),
  createLink: z.boolean().optional().default(false),
  link: LinkSchema.optional(),
});

const RequestBodySchema = z.discriminatedUnion("resourceType", [
  DocumentCreateSchema,
  LinkCreateSchema,
  DataroomCreateSchema,
]);

export default async function incomingWebhookHandler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Get the full webhook ID from the path
  const { path } = req.query;
  const webhookId = Array.isArray(path) ? path.join("/") : path;

  if (!webhookId || !isValidWebhookId(webhookId)) {
    return res.status(400).json({ error: "Invalid webhook format" });
  }

  // Check for API token
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ error: "Missing or invalid authorization header" });
  }

  const token = authHeader.replace("Bearer ", "");
  const hashedToken = hashToken(token);

  // Look up token in database
  const restrictedToken = await prisma.restrictedToken.findUnique({
    where: { hashedKey: hashedToken },
    select: { teamId: true, rateLimit: true },
  });

  if (!restrictedToken) {
    return res.status(401).json({ error: "Invalid token" });
  }

  // Rate limit checks for API tokens
  const rateLimit = restrictedToken.rateLimit || 60; // Default rate limit of 60 requests per minute

  const { success, limit, reset, remaining } = await ratelimit(
    rateLimit,
    "1 m",
  ).limit(hashedToken);

  // Set rate limit headers
  res.setHeader("Retry-After", reset.toString());
  res.setHeader("X-RateLimit-Limit", limit.toString());
  res.setHeader("X-RateLimit-Remaining", remaining.toString());
  res.setHeader("X-RateLimit-Reset", reset.toString());

  if (!success) {
    return res.status(429).json({ error: "Too many requests" });
  }

  // Update last used timestamp for the token
  waitUntil(
    prisma.restrictedToken.update({
      where: {
        hashedKey: hashedToken,
      },
      data: {
        lastUsed: new Date(),
      },
    }),
  );

  const teamId = extractTeamId(webhookId);
  if (!teamId) {
    return res.status(400).json({ error: "Invalid team ID in webhook" });
  }

  if (restrictedToken.teamId !== teamId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    // 1. Find the webhook integration
    const incomingWebhook = await prisma.incomingWebhook.findUnique({
      where: {
        externalId: webhookId,
        teamId: teamId,
      },
      include: { team: true },
    });

    if (!incomingWebhook) {
      return res.status(404).json({ error: "Webhook not found" });
    }

    // Validate request body against the schema
    const validationResult = RequestBodySchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        error: "Invalid request body",
        details: validationResult.error.format(),
      });
    }

    const validatedData = validationResult.data;

    // Handle different resource types
    if (validatedData.resourceType === "document.create") {
      return await handleDocumentCreate(
        validatedData,
        incomingWebhook.teamId,
        token,
        res,
      );
    } else if (validatedData.resourceType === "link.create") {
      return await handleLinkCreate(
        validatedData,
        incomingWebhook.teamId,
        token,
        res,
      );
    } else if (validatedData.resourceType === "dataroom.create") {
      return await handleDataroomCreate(
        validatedData,
        incomingWebhook.teamId,
        token,
        res,
      );
    }

    // This shouldn't be reached due to the validation schema, but just in case
    return res.status(400).json({ error: "Invalid resource type" });
  } catch (error) {
    console.error("Webhook error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

/**
 * Handle document.create resource type
 */
async function handleDocumentCreate(
  data: z.infer<typeof DocumentCreateSchema>,
  teamId: string,
  token: string,
  res: NextApiResponse,
) {
  const { fileUrl, name, contentType, dataroomId, createLink, link, folderId } =
    data;

  // Check if the content type is supported
  const supportedContentType = getSupportedContentType(contentType);
  if (!supportedContentType) {
    return res.status(400).json({ error: "Unsupported content type" });
  }

  if (dataroomId) {
    // Verify dataroom exists and belongs to team
    const dataroom = await prisma.dataroom.findUnique({
      where: {
        id: dataroomId,
        teamId: teamId,
      },
    });

    if (!dataroom) {
      return res.status(400).json({ error: "Invalid dataroom ID" });
    }
  }

  // If custom domain and slug are provided, validate them
  if (createLink && link?.domain && link?.slug) {
    // Check if domain exists
    const domain = await prisma.domain.findUnique({
      where: {
        slug: link.domain,
        teamId: teamId,
      },
    });

    if (!domain) {
      return res
        .status(400)
        .json({ error: "Domain not found or not associated with this team" });
    }

    // Check if the slug is already in use with this domain
    const existingLink = await prisma.link.findUnique({
      where: {
        domainSlug_slug: {
          slug: link.slug,
          domainSlug: link.domain,
        },
      },
    });

    if (existingLink) {
      return res
        .status(400)
        .json({ error: "The link with this domain and slug already exists" });
    }
  }

  // 4. Fetch file from URL
  const response = await fetch(fileUrl);
  if (!response.ok) {
    return res.status(400).json({ error: "Failed to fetch file from URL" });
  }

  // 5. Validate response content type matches expected
  const responseContentType = response.headers.get("content-type");
  if (!responseContentType || responseContentType.startsWith("text/html")) {
    return res
      .status(400)
      .json({ error: "Remote resource is not a supported file type" });
  }
  if (!responseContentType.startsWith(contentType)) {
    console.warn(
      `Content type mismatch: expected ${contentType}, got ${responseContentType}`,
    );
    // Log but don't fail - some services return generic types
  }

  // 6. Convert to buffer
  const fileBuffer = Buffer.from(await response.arrayBuffer());

  // Ensure filename has proper extension, based on the actual response content-type when available
  let fileName = name?.trim();
  const actualContentType = (
    responseContentType?.split(";")[0] ?? contentType
  ).trim();
  const expectedExtension = getExtensionFromContentType(actualContentType);
  if (expectedExtension) {
    const lower = fileName.toLowerCase();
    const dotIdx = lower.lastIndexOf(".");
    const currentExt = dotIdx !== -1 ? lower.slice(dotIdx + 1) : null;
    // Minimal alias map to avoid double extensions (e.g., jpg vs jpeg)
    const alias: Record<string, string[]> = {
      jpeg: ["jpeg", "jpg"],
      jpg: ["jpg", "jpeg"],
      tiff: ["tiff", "tif"],
    };
    const matches =
      !!currentExt &&
      (currentExt === expectedExtension ||
        (alias[expectedExtension]?.includes(currentExt) ?? false));
    if (!matches) {
      fileName = `${fileName}.${expectedExtension}`;
    }
  }

  console.log("Uploading file to storage", teamId, fileName, contentType);

  // 7. Upload the file to storage
  const { type: storageType, data: fileData } = await putFileServer({
    file: {
      name: fileName,
      type: contentType,
      buffer: fileBuffer,
    },
    teamId: teamId,
    restricted: false, // allows all supported file types
  });

  if (!fileData || !storageType) {
    return res.status(500).json({ error: "Failed to save file to storage" });
  }

  // 8. Create document using our service
  // Note: The createDocument function doesn't accept linkData in its parameters
  // so we will just pass createLink flag
  const documentCreationResponse = await createDocument({
    documentData: {
      name: fileName,
      key: fileData,
      storageType: storageType,
      contentType: contentType,
      supportedFileType: supportedContentType,
      fileSize: fileBuffer.byteLength,
    },
    teamId: teamId,
    numPages: 1,
    token: token,
    createLink: createLink, // INFO: creatLink=true will not trigger a link.created webhook
  });

  if (!documentCreationResponse.ok) {
    return res.status(500).json({ error: "Failed to create document" });
  }

  const document = await documentCreationResponse.json();
  let newLink: any;

  // If the document is added to a folder, update the folderId
  if (folderId) {
    const folder = await prisma.folder.findUnique({
      where: { id: folderId, teamId: teamId },
      select: {
        id: true,
      },
    });

    if (!folder) {
      return res.status(400).json({ error: "Invalid folder ID" });
    }

    await prisma.document.update({
      where: { id: document.id, teamId: teamId },
      data: {
        folderId: folder.id,
      },
    });
  }

  // If we need to customize the link, update it after creation
  if (createLink && document.links && document.links.length > 0 && link) {
    const linkId = document.links[0].id;

    // If preset is provided, validate it
    let preset: LinkPreset | null = null;
    let metaImage: string | null = null;
    let metaFavicon: string | null = null;
    if (link?.presetId) {
      preset = await prisma.linkPreset.findUnique({
        where: { pId: link.presetId, teamId: teamId },
      });

      if (!preset) {
        return res.status(400).json({
          error: "Link preset not found or not associated with this team",
        });
      }

      // Handle image files for custom meta tag (if enabled)
      if (preset.enableCustomMetaTag) {
        // Process meta image if present
        if (preset.metaImage && isDataUrl(preset.metaImage)) {
          const { buffer, mimeType, filename } = convertDataUrlToBuffer(
            preset.metaImage,
          );
          const blob = await put(filename, buffer, {
            access: "public",
            addRandomSuffix: true,
          });
          metaImage = blob.url;
        }

        // Process favicon if present
        if (preset.metaFavicon && isDataUrl(preset.metaFavicon)) {
          const { buffer, mimeType, filename } = convertDataUrlToBuffer(
            preset.metaFavicon,
          );
          const blob = await put(filename, buffer, {
            access: "public",
            addRandomSuffix: true,
          });
          metaFavicon = blob.url;
        }
      }
    }

    // Process fields for link update
    const hashedPassword = link.password
      ? await generateEncrpytedPassword(link.password)
      : preset?.password
        ? preset.password
        : null;

    const expiresAtDate = link.expiresAt
      ? new Date(link.expiresAt)
      : preset?.expiresAt
        ? new Date(preset.expiresAt)
        : null;

    const isGroupAudience = link.audienceType === "GROUP";

    let domainId = null;
    if (link.domain) {
      const domain = await prisma.domain.findUnique({
        where: {
          slug: link.domain,
          teamId: teamId,
        },
        select: { id: true },
      });
      domainId = domain?.id || null;
    }

    // Update the link with custom settings
    newLink = await prisma.link.update({
      where: { id: linkId, teamId: teamId },
      data: {
        name: link.name,
        password: hashedPassword,
        expiresAt: expiresAtDate,
        domainId: domainId,
        domainSlug: link.domain || null,
        slug: link.slug || null,
        emailProtected: link.emailProtected || preset?.emailProtected || false,
        emailAuthenticated:
          link.emailAuthenticated || preset?.emailAuthenticated || false,
        allowDownload: link.allowDownload || preset?.allowDownload,
        enableNotification: link.enableNotification,
        enableFeedback: link.enableFeedback,
        enableScreenshotProtection: link.enableScreenshotProtection,
        showBanner: link.showBanner,
        audienceType: link.audienceType,
        groupId: isGroupAudience ? link.groupId : null,
        // For group links, ignore allow/deny lists from presets as access is controlled by group membership
        allowList: isGroupAudience
          ? link.allowList
          : (link.allowList ?? preset?.allowList),
        denyList: isGroupAudience
          ? link.denyList
          : (link.denyList ?? preset?.denyList),
        ...(preset?.enableCustomMetaTag && {
          enableCustomMetatag: preset?.enableCustomMetaTag,
          metaTitle: preset?.metaTitle,
          metaDescription: preset?.metaDescription,
          metaImage: metaImage,
          metaFavicon: metaFavicon,
        }),
      },
    });

    waitUntil(
      sendLinkCreatedWebhook({
        teamId,
        data: {
          document_id: document.id,
          link_id: newLink.id,
        },
      }),
    );
  }

  // If dataroomId was provided, create the relationship
  if (dataroomId) {
    await prisma.dataroomDocument.create({
      data: {
        dataroomId,
        documentId: document.id,
      },
    });
  }

  return res.status(200).json({
    message: `Document created successfully${
      dataroomId ? ` and added to dataroom` : ""
    }`,
    documentId: document.id,
    dataroomId: dataroomId ?? undefined,
    linkId: newLink?.id ?? undefined,
    linkUrl: createLink
      ? newLink?.domainSlug && newLink?.slug
        ? `https://${newLink.domainSlug}/${newLink.slug}`
        : `${process.env.NEXT_PUBLIC_MARKETING_URL}/view/${newLink?.id}`
      : undefined,
  });
}

/**
 * Handle link.create resource type
 */
async function handleLinkCreate(
  data: z.infer<typeof LinkCreateSchema>,
  teamId: string,
  token: string,
  res: NextApiResponse,
) {
  const { targetId, linkType, link } = data;

  // Validate target exists and belongs to the team
  if (linkType === "DOCUMENT_LINK") {
    const document = await prisma.document.findUnique({
      where: {
        id: targetId,
        teamId: teamId,
      },
    });

    if (!document) {
      return res
        .status(400)
        .json({ error: "Document not found or not associated with this team" });
    }
  } else if (linkType === "DATAROOM_LINK") {
    const dataroom = await prisma.dataroom.findUnique({
      where: {
        id: targetId,
        teamId: teamId,
      },
    });

    if (!dataroom) {
      return res
        .status(400)
        .json({ error: "Dataroom not found or not associated with this team" });
    }
  }

  // If domain and slug are provided, validate them
  let domainId = null;
  if (link.domain && link.slug) {
    // Check if domain exists
    const domain = await prisma.domain.findUnique({
      where: {
        slug: link.domain,
        teamId: teamId,
      },
      select: { id: true },
    });

    if (!domain) {
      return res
        .status(400)
        .json({ error: "Domain not found or not associated with this team" });
    }

    domainId = domain.id;

    // Check if the slug is already in use with this domain
    const existingLink = await prisma.link.findUnique({
      where: {
        domainSlug_slug: {
          slug: link.slug,
          domainSlug: link.domain,
        },
      },
    });

    if (existingLink) {
      return res
        .status(400)
        .json({ error: "The link with this domain and slug already exists" });
    }
  }

  // If preset is provided, validate it
  let preset: LinkPreset | null = null;
  let metaImage: string | null = null;
  let metaFavicon: string | null = null;
  if (link.presetId) {
    preset = await prisma.linkPreset.findUnique({
      where: { pId: link.presetId, teamId: teamId },
    });

    if (!preset) {
      return res.status(400).json({
        error: "Link preset not found or not associated with this team",
      });
    }

    // 4. Handle image files for custom meta tag (if enabled)
    if (preset.enableCustomMetaTag) {
      // Process meta image if present
      if (preset.metaImage && isDataUrl(preset.metaImage)) {
        const { buffer, mimeType, filename } = convertDataUrlToBuffer(
          preset.metaImage,
        );
        const blob = await put(filename, buffer, {
          access: "public",
          addRandomSuffix: true,
        });
        metaImage = blob.url;
      }

      // Process favicon if present
      if (preset.metaFavicon && isDataUrl(preset.metaFavicon)) {
        const { buffer, mimeType, filename } = convertDataUrlToBuffer(
          preset.metaFavicon,
        );
        const blob = await put(filename, buffer, {
          access: "public",
          addRandomSuffix: true,
        });
        metaFavicon = blob.url;
      }
    }
  }

  // Create the link
  try {
    // Hash password if provided
    const hashedPassword = link.password
      ? await generateEncrpytedPassword(link.password)
      : preset?.password
        ? preset.password
        : null;

    const expiresAtDate = link.expiresAt
      ? new Date(link.expiresAt)
      : preset?.expiresAt
        ? new Date(preset.expiresAt)
        : null;

    const isGroupAudience = link.audienceType === "GROUP";

    const newLink = await prisma.link.create({
      data: {
        documentId: linkType === "DOCUMENT_LINK" ? targetId : null,
        dataroomId: linkType === "DATAROOM_LINK" ? targetId : null,
        linkType,
        teamId,
        name: link.name,
        password: hashedPassword,
        domainId: domainId,
        domainSlug: link.domain || null,
        slug: link.slug || null,
        expiresAt: expiresAtDate,
        emailProtected: link.emailProtected || preset?.emailProtected || false,
        emailAuthenticated:
          link.emailAuthenticated || preset?.emailAuthenticated || false,
        allowDownload: link.allowDownload || preset?.allowDownload,
        enableNotification: link.enableNotification,
        enableFeedback: link.enableFeedback,
        enableScreenshotProtection: link.enableScreenshotProtection,
        showBanner: link.showBanner,
        audienceType: link.audienceType,
        groupId: isGroupAudience ? link.groupId : null,
        // For group links, ignore allow/deny lists from presets as access is controlled by group membership
        allowList: isGroupAudience
          ? link.allowList
          : link.allowList || preset?.allowList,
        denyList: isGroupAudience
          ? link.denyList
          : link.denyList || preset?.denyList,
        ...(preset?.enableCustomMetaTag && {
          enableCustomMetatag: preset?.enableCustomMetaTag,
          metaTitle: preset?.metaTitle,
          metaDescription: preset?.metaDescription,
          metaImage: metaImage,
          metaFavicon: metaFavicon,
        }),
      },
    });

    waitUntil(
      sendLinkCreatedWebhook({
        teamId,
        data: {
          document_id: linkType === "DOCUMENT_LINK" ? targetId : null,
          dataroom_id: linkType === "DATAROOM_LINK" ? targetId : null,
          link_id: newLink.id,
        },
      }),
    );

    return res.status(200).json({
      message: "Link created successfully",
      linkId: newLink.id,
      targetId,
      linkType,
      linkUrl:
        domainId && link.domain && link.slug
          ? `https://${newLink.domainSlug}/${newLink.slug}`
          : `${process.env.NEXT_PUBLIC_MARKETING_URL}/view/${newLink.id}`,
    });
  } catch (error) {
    console.error("Link creation error:", error);
    return res.status(500).json({ error: "Failed to create link" });
  }
}

/**
 * Handle dataroom.create resource type
 */
async function handleDataroomCreate(
  data: z.infer<typeof DataroomCreateSchema>,
  teamId: string,
  token: string,
  res: NextApiResponse,
) {
  const { name, description, createLink, link } = data;

  // If custom domain and slug are provided for link, validate them
  let domainId = null;
  if (createLink && link?.domain && link?.slug) {
    // Check if domain exists
    const domain = await prisma.domain.findUnique({
      where: {
        slug: link.domain,
        teamId: teamId,
      },
    });

    if (!domain) {
      return res
        .status(400)
        .json({ error: "Domain not found or not associated with this team" });
    }

    domainId = domain.id;

    // Check if the slug is already in use with this domain
    const existingLink = await prisma.link.findUnique({
      where: {
        domainSlug_slug: {
          slug: link.slug,
          domainSlug: link.domain,
        },
      },
    });

    if (existingLink) {
      return res
        .status(400)
        .json({ error: "The link with this domain and slug already exists" });
    }
  }

  // If preset is provided, validate it
  let preset: LinkPreset | null = null;
  let metaImage: string | null = null;
  let metaFavicon: string | null = null;
  if (createLink && link?.presetId) {
    preset = await prisma.linkPreset.findUnique({
      where: { pId: link.presetId, teamId: teamId },
    });

    if (!preset) {
      return res.status(400).json({
        error: "Link preset not found or not associated with this team",
      });
    }

    // Handle image files for custom meta tag (if enabled)
    if (preset.enableCustomMetaTag) {
      // Process meta image if present
      if (preset.metaImage && isDataUrl(preset.metaImage)) {
        const { buffer, mimeType, filename } = convertDataUrlToBuffer(
          preset.metaImage,
        );
        const blob = await put(filename, buffer, {
          access: "public",
          addRandomSuffix: true,
        });
        metaImage = blob.url;
      }

      // Process favicon if present
      if (preset.metaFavicon && isDataUrl(preset.metaFavicon)) {
        const { buffer, mimeType, filename } = convertDataUrlToBuffer(
          preset.metaFavicon,
        );
        const blob = await put(filename, buffer, {
          access: "public",
          addRandomSuffix: true,
        });
        metaFavicon = blob.url;
      }
    }
  }

  // Create the dataroom
  try {
    // Create dataroom with link if requested
    let createData: any = {
      name,
      description,
      teamId,
    };

    if (createLink && link) {
      const isGroupAudience = link.audienceType === "GROUP";
      const hashedPassword = link.password
        ? await generateEncrpytedPassword(link.password)
        : preset?.password
          ? preset?.password
          : null;
      const expiresAtDate = link.expiresAt
        ? new Date(link.expiresAt)
        : preset?.expiresAt
          ? new Date(preset?.expiresAt)
          : null;

      createData.links = {
        create: {
          name: link.name,
          teamId,
          linkType: "DATAROOM_LINK",
          domainId: domainId,
          domainSlug: link.domain || null,
          slug: link.slug || null,
          password: hashedPassword,
          expiresAt: expiresAtDate,
          emailProtected:
            link.emailProtected || preset?.emailProtected || false,
          emailAuthenticated:
            link.emailAuthenticated || preset?.emailAuthenticated || false,
          allowDownload: link.allowDownload || preset?.allowDownload,
          enableNotification: link.enableNotification,
          enableFeedback: link.enableFeedback,
          enableScreenshotProtection: link.enableScreenshotProtection,
          showBanner: link.showBanner,
          audienceType: link.audienceType,
          groupId: isGroupAudience ? link.groupId : null,
          allowList: link.allowList || preset?.allowList,
          denyList: link.denyList || preset?.denyList,
          ...(preset?.enableCustomMetaTag && {
            enableCustomMetatag: preset?.enableCustomMetaTag,
            metaTitle: preset?.metaTitle,
            metaDescription: preset?.metaDescription,
            metaImage: metaImage,
            metaFavicon: metaFavicon,
          }),
        },
      };
    }

    const dataroom = await prisma.dataroom.create({
      data: createData,
      include: {
        links: createLink, // Only include links if we're creating one
      },
    });

    if (createLink) {
      waitUntil(
        sendLinkCreatedWebhook({
          teamId,
          data: {
            dataroom_id: dataroom.id,
            link_id: dataroom.links?.[0]?.id,
          },
        }),
      );
    }

    return res.status(200).json({
      message: "Dataroom created successfully",
      dataroomId: dataroom.id,
      linkId: createLink ? dataroom.links?.[0]?.id : undefined,
      linkUrl: createLink
        ? dataroom.links?.[0]?.domainSlug && dataroom.links?.[0]?.slug
          ? `https://${dataroom.links?.[0]?.domainSlug}/${dataroom.links?.[0]?.slug}`
          : `${process.env.NEXT_PUBLIC_MARKETING_URL}/view/${dataroom.links?.[0]?.id}`
        : undefined,
    });
  } catch (error) {
    console.error("Dataroom creation error:", error);
    return res.status(500).json({ error: "Failed to create dataroom" });
  }
}
