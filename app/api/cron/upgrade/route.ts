import { NextResponse } from "next/server";
import { limiter, receiver } from "@/lib/cron";
import prisma from "@/lib/prisma";
import { calculateDaysLeft, log } from "@/lib/utils";
import { sendTrialEndReminderEmail } from "@/lib/emails/send-trial-end-reminder";
import { sendTrialEndFinalReminderEmail } from "@/lib/emails/send-trial-end-final-reminder";

/**
 * Cron to check if trial has expired.
 * If a user is not on pro plan and has 5 days left on trial, we send a reminder email to upgrade plan.
 * If a user is not on pro plan and has 1 day left on trial, we send a final reminder email to upgrade plan.
 **/
// Runs once per day at 12pm (0 12 * * *)

export async function POST(req: Request) {
  const body = await req.json();
  if (process.env.VERCEL === "1") {
    const isValid = await receiver.verify({
      signature: req.headers.get("Upstash-Signature") || "",
      body: JSON.stringify(body),
    });
    if (!isValid) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  try {
    const users = await prisma.user.findMany({
      where: {
        plan: {
          // exclude users who are on pro plan
          notIn: ["pro"],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        createdAt: true,
      },
    });


    const results = await Promise.allSettled(
      users.map(async (user) => {
        const { id, email, name, createdAt } = user as {
          id: string;
          email: string;
          name: string | null;
          createdAt: Date;
        };

        let userDaysLeft = calculateDaysLeft(new Date(createdAt));

        if (userDaysLeft == 5) {

        if (userDaysLeft == 3) {
          return await Promise.allSettled([
            log(
              `Trial End Reminder for user: *${id}* is expiring in ${userDaysLeft} days, email sent.`
            ),
            limiter.schedule(() => sendTrialEndReminderEmail(email, name)),
          ]);
        }

        // send email if user has 1 day left on trial
        if (userDaysLeft == 1) {
          return await Promise.allSettled([
            log(
              `Final Trial End Reminder for user: *${id}* is expiring in ${userDaysLeft} days, email sent.`
            ),
            limiter.schedule(() => sendTrialEndFinalReminderEmail(email, name)),
          ]);
        }

        // downgrade the user to free if user has 0 day left on trial
        if (userDaysLeft == 0) {
          return await Promise.allSettled([
            log(
              `Downgrade to free for user: *${id}* is expiring in ${userDaysLeft} days, email sent.`
            ),
            prisma.user.update({
              where: { id },
              data: { plan: "free" },
            }),
          ]);
        }
      })
    );
    return NextResponse.json(results);
  } catch (error) {
    await log(
      `Trial end reminder cron failed. Error: " + ${(error as Error).message}`,
      true
    );
    return NextResponse.json({ error: (error as Error).message });
  }
}
