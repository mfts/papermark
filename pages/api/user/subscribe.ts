import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth";

import { errorhandler } from "@/lib/errorHandler";
import { resend, subscribe, unsubscribe } from "@/lib/resend";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const user = session.user as CustomUser;

  if (!user.email) {
    return res.status(400).json({ error: "User email not found" });
  }

  try {
    if (req.method === "GET") {
      // Get subscription status
      if (!resend) {
        // Resend unavailable, default to subscribed (opt-out model)
        return res.status(200).json({ subscribed: true });
      }

      // Fetch contact from Resend to get actual subscription status
      const { data: contact, error } = await resend.contacts.get({
        email: user.email,
      });

      if (error || !contact?.unsubscribed) {
        // Contact not found or not unsubscribed, default to subscribed
        return res.status(200).json({ subscribed: true });
      }

      return res.status(200).json({ subscribed: !contact.unsubscribed });
    }

    if (req.method === "POST") {
      await subscribe(user.email);

      return res.status(200).json({ subscribed: true });
    }

    if (req.method === "DELETE") {
      await unsubscribe(user.email);

      return res.status(200).json({ subscribed: false });
    }

    res.setHeader("Allow", ["GET", "POST", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    errorhandler(error, res);
  }
}
