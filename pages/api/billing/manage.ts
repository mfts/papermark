import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // POST /api/billing/manage – manage a user's subscription
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: (session.user as CustomUser).id },
      select: { stripeId: true },
    });

    if (!user) {
      return res.status(400).json({ error: "User does not exists" });
    }
    if (!user.stripeId) {
      return res.status(400).json({ error: "No Stripe customer ID" });
    }

    const { url } = await stripe.billingPortal.sessions.create({
      customer: user.stripeId,
      return_url: `${process.env.NEXTAUTH_URL}/settings/billing`,
    });
    return res.status(200).json(url);
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
