import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { stripe } from "@/lib/stripe";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // POST /api/teams/:teamId/billing/upgrade
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const { teamId, priceId } = req.query as {
      teamId: string;
      priceId: string;
    };

    const userEmail = (session.user as CustomUser).email;

    const stripeSession = await stripe.checkout.sessions.create({
      customer_email: userEmail ?? undefined,
      billing_address_collection: "required",
      success_url: `${process.env.NEXTAUTH_URL}/settings/billing?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/settings/billing`,
      line_items: [{ price: priceId, quantity: 1 }],
      automatic_tax: {
        enabled: true,
      },
      tax_id_collection: {
        enabled: true,
      },
      mode: "subscription",
      allow_promotion_codes: true,
      client_reference_id: teamId,
    });
    return res.status(200).json(stripeSession);
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
