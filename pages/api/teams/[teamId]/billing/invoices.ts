import { NextApiRequest, NextApiResponse } from "next";

import { stripeInstance } from "@/ee/stripe";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

function isOldAccount(plan: string) {
  return plan.includes("+old");
}

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const userId = (session.user as CustomUser).id;
  const { teamId } = req.query as { teamId: string };

  try {
    // Get team with stripeId
    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
        users: {
          some: {
            userId: userId,
          },
        },
      },
      select: {
        stripeId: true,
        plan: true,
      },
    });

    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    if (!team.stripeId) {
      return res.status(200).json({ invoices: [] });
    }

    // Fetch invoices from Stripe
    const stripe = stripeInstance(isOldAccount(team.plan));
    const invoices = await stripe.invoices.list({
      customer: team.stripeId,
      limit: 100,
    });

    // Transform invoices to a simpler format
    const transformedInvoices = invoices.data.map((invoice) => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      created: invoice.created,
      invoicePdf: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      periodStart: invoice.period_start,
      periodEnd: invoice.period_end,
      description: invoice.lines.data[0]?.description || "Subscription",
    }));

    return res.status(200).json({ invoices: transformedInvoices });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return res.status(500).json({ error: "Failed to fetch invoices" });
  }
}

