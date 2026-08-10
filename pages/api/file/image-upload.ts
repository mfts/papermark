import type { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth/next";

import { putPublicAsset } from "@/lib/files/public-assets";

import { authOptions } from "../auth/[...nextauth]";

const uploadConfig = {
  profile: {
    allowedContentTypes: ["image/png", "image/jpg"],
    maximumSizeInBytes: 2 * 1024 * 1024, // 2MB
  },
  assets: {
    allowedContentTypes: [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/svg+xml",
      "image/x-icon",
      "image/ico",
    ],
    maximumSizeInBytes: 5 * 1024 * 1024, // 5MB
  },
};

// The body is the raw image, so Next's body parser must be off: it decodes
// unrecognised content types as UTF-8 text, which silently corrupts binary
// uploads (0x89 in the PNG magic number becomes U+FFFD). Uploads are proxied
// through this route rather than going direct-to-storage so that the object
// store never has to be publicly reachable.
export const config = {
  api: {
    bodyParser: false,
  },
};

class PayloadTooLargeError extends Error {}

/** Reads the raw request body, aborting as soon as the limit is exceeded. */
const readRawBody = async (
  req: NextApiRequest,
  maximumSizeInBytes: number,
): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > maximumSizeInBytes) {
      throw new PayloadTooLargeError("File too large.");
    }
    chunks.push(buffer);
  }

  return Buffer.concat(chunks);
};

// image-upload/?type= "profile" | "assets"
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const type = Array.isArray(req.query.type)
    ? req.query.type[0]
    : req.query.type;

  if (!type || !(type in uploadConfig)) {
    return res.status(400).json({ error: "Invalid upload type specified." });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { allowedContentTypes, maximumSizeInBytes } =
    uploadConfig[type as keyof typeof uploadConfig];

  const contentType = (req.headers["content-type"] || "").split(";")[0].trim();
  if (!allowedContentTypes.includes(contentType)) {
    return res.status(400).json({ error: "Unsupported file type." });
  }

  const filenameParam = Array.isArray(req.query.filename)
    ? req.query.filename[0]
    : req.query.filename;
  const filename = filenameParam || "asset";

  try {
    const body = await readRawBody(req, maximumSizeInBytes);

    if (body.length === 0) {
      return res.status(400).json({ error: "Empty file." });
    }

    const url = await putPublicAsset({
      filename,
      contentType,
      body,
      uploadType: type as "profile" | "assets",
    });

    return res.status(200).json({ url });
  } catch (error) {
    if (error instanceof PayloadTooLargeError) {
      return res.status(413).json({ error: error.message });
    }
    return res.status(500).json({
      error: error instanceof Error ? error.message : "Upload failed.",
    });
  }
}
