import { NextApiRequest, NextApiResponse } from "next";

import { checkRateLimit, rateLimiters } from "@/ee/features/security";
import { stripeInstance } from "@/ee/stripe";
import { getCouponFromPlan } from "@/ee/stripe/functions/get-coupon-from-plan";
import {
  getPlanFromPriceId,
  isOldAccount,
  planHasDualPricing,
} from "@/ee/stripe/utils";
import { waitUntil } from "@vercel/functions";
import { getServerSession } from "next-auth/next";

import { identifyUser, trackAnalytics } from "@/lib/analytics";
import { getDubDiscountForExternalUserId } from "@/lib/dub";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { getIpAddress } from "@/lib/utils/ip";

import { authOptions } from "../../../auth/[...nextauth]";

export const config = {
  supportsResponseStreaming: true,
};

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    const clientIP = getIpAddress(req.headers);
    const rateLimitResult = await checkRateLimit(
      rateLimiters.billing,
      clientIP,
    );

    if (!rateLimitResult.success) {
      return res.status(429).json({
        error: "Too many billing requests. Please try again later.",
        remaining: rateLimitResult.remaining,
      });
    }

    // POST /api/teams/:teamId/billing/upgrade
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    const { teamId, priceId, perSeatPriceId, applyYearlyDiscount } =
      req.query as {
        teamId: string;
        priceId: string;
        perSeatPriceId?: string;
        applyYearlyDiscount?: string;
      };

    const { id: userId, email: userEmail } = session.user as CustomUser;

    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
        users: {
          some: {
            userId,
          },
        },
      },
      select: { stripeId: true, plan: true },
    });

    if (!team) {
      res.status(404).end("Unauthorized");
      return;
    }

    const oldAccount = isOldAccount(team.plan);
    const plan = getPlanFromPriceId(priceId, oldAccount);

    if (!plan) {
      res.status(400).json({ error: "Invalid price ID" });
      return;
    }

    const isDual = planHasDualPricing(plan);

    let stripeSession;
    let couponId: string | undefined;

    if (applyYearlyDiscount === "true") {
      const planString = oldAccount ? `${plan.slug}+old` : plan.slug;
      couponId = getCouponFromPlan(planString, true);

      const stripe = stripeInstance(oldAccount);
      try {
        await stripe.coupons.retrieve(couponId);
      } catch (error: any) {
        if (error.code === "resource_missing") {
          console.warn(
            `[Upgrade] Coupon "${couponId}" not found in ${process.env.NEXT_PUBLIC_VERCEL_ENV || "test"} mode. ` +
              `Continuing without discount.`,
          );
          couponId = undefined;
        } else {
          throw error;
        }
      }
    }

    const lineItems: Array<{
      price: string;
      quantity: number;
      adjustable_quantity?: {
        enabled: boolean;
        minimum: number;
        maximum: number;
      };
    }> = [];

    if (isDual && perSeatPriceId) {
      // Dual pricing: flat base + per-seat addon
      lineItems.push({
        price: priceId,
        quantity: 1,
      });
      lineItems.push({
        price: perSeatPriceId,
        quantity: 0,
        adjustable_quantity: {
          enabled: true,
          minimum: 0,
          maximum: 99,
        },
      });
    } else {
      // Single pricing (Pro) or legacy fallback
      lineItems.push({
        price: priceId,
        quantity: oldAccount ? 1 : plan.includedUsers,
        ...(!oldAccount && {
          adjustable_quantity: {
            enabled: true,
            minimum: plan.includedUsers,
            maximum: 99,
          },
        }),
      });
    }

    const dubDiscount = await getDubDiscountForExternalUserId(userId);

    const stripe = stripeInstance(oldAccount);
    const baseSessionConfig = {
      billing_address_collection: "required" as const,
      success_url: `${process.env.NEXTAUTH_URL}/settings/billing?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/settings/billing?cancel=true`,
      line_items: lineItems,
      automatic_tax: {
        enabled: true,
      },
      tax_id_collection: {
        enabled: true,
      },
      mode: "subscription" as const,
      client_reference_id: teamId,
      ...(couponId && {
        discounts: [{ coupon: couponId }],
      }),
    };

    if (team.stripeId) {
      stripeSession = await stripe.checkout.sessions.create({
        ...baseSessionConfig,
        customer: team.stripeId,
        customer_update: { name: "auto" },
        ...(!couponId && { allow_promotion_codes: true }),
      });
    } else {
      stripeSession = await stripe.checkout.sessions.create({
        ...baseSessionConfig,
        customer_email: userEmail ?? undefined,
        ...(dubDiscount ?? (!couponId && { allow_promotion_codes: true })),
        metadata: {
          dubCustomerId: userId,
        },
      });
    }

    waitUntil(
      Promise.all([
        identifyUser(userEmail ?? userId),
        trackAnalytics({
          event: "Stripe Checkout Clicked",
          teamId,
          priceId: priceId,
        }),
      ]),
    );

    return res.status(200).json(stripeSession);
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
