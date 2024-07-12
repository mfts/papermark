import type { NextApiRequest, NextApiResponse } from "next";

import slugify from "@sindresorhus/slugify";
import { S3Store } from "@tus/s3-store";
import { Server } from "@tus/server";
import { getServerSession } from "next-auth/next";
import path from "node:path";

import { newId } from "@/lib/id-helper";

import { authOptions } from "../../auth/[...nextauth]";

export const config = {
  api: {
    bodyParser: false,
  },
};

const tusServer = new Server({
  // `path` needs to match the route declared by the next file router
  path: "/api/file/tus",
  datastore: new S3Store({
    partSize: 8 * 1024 * 1024, // each uploaded part will have ~8MiB,
    s3ClientConfig: {
      bucket: process.env.NEXT_PRIVATE_UPLOAD_BUCKET as string,
      region: process.env.NEXT_PRIVATE_UPLOAD_REGION as string,
      credentials: {
        accessKeyId: process.env.NEXT_PRIVATE_UPLOAD_ACCESS_KEY_ID as string,
        secretAccessKey: process.env
          .NEXT_PRIVATE_UPLOAD_SECRET_ACCESS_KEY as string,
      },
    },
  }),
  namingFunction(req, metadata) {
    const { teamId, fileName } = metadata as {
      teamId: string;
      fileName: string;
    };
    const docId = newId("doc");
    const { name, ext } = path.parse(fileName);
    const newName = `${teamId}/${docId}/${slugify(name)}${ext}`;
    return newName;
  },
  generateUrl(req, { proto, host, path, id }) {
    // Encode the ID to be URL safe
    console.log("proto", proto);
    id = Buffer.from(id, "utf-8").toString("base64url");
    return `${proto}s://${host}${path}/${id}`;
  },
  getFileIdFromRequest(req) {
    // Extract the ID from the URL
    const id = (req.url as string).split("/api/file/tus/")[1];
    return Buffer.from(id, "base64url").toString("utf-8");
  },
});

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // // Set CORS headers for all responses
  // res.setHeader(
  //   "Access-Control-Allow-Methods",
  //   "GET,POST,PUT,HEAD,DELETE,OPTIONS",
  // );
  // res.setHeader(
  //   "Access-Control-Allow-Headers",
  //   "Content-Type,Upload-Length,Upload-Offset,Upload-Metadata,Upload-Defer-Length,Upload-Concat",
  // );
  // res.setHeader(
  //   "Access-Control-Expose-Headers",
  //   "Upload-Offset,Upload-Length,Location",
  // );

  // if (req.method === "OPTIONS") {
  //   // Handle preflight requests
  //   res.status(204).end();
  //   return;
  // }

  // Get the session
  const session = getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  return tusServer.handle(req, res);
}
