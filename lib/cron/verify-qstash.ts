import { receiver } from ".";
import { log } from "../utils";

export const verifyQstashSignature = async ({
  req,
  rawBody,
}: {
  req: Request;
  rawBody: string; // Make sure to pass the raw body not the parsed JSON
}) => {
  // skip verification in local development
  if (process.env.VERCEL !== "1") {
    return;
  }

  const signature = req.headers.get("Upstash-Signature");

  if (!signature) {
    throw new Error("Upstash-Signature header not found.");
  }

  const isValid = await receiver.verify({
    signature,
    body: rawBody,
  });

  if (!isValid) {
    const url = req.url;
    const messageId = req.headers.get("Upstash-Message-Id");

    log({
      message: `Invalid QStash request signature: *${url}* - *${messageId}*`,
      type: "error",
      mention: true,
    });

    throw new Error("Invalid QStash request signature.");
  }
};
