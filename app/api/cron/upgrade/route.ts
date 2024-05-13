import { NextResponse } from "next/server";

import { limiter, receiver } from "@/lib/cron";
import { sendTrialEndFinalReminderEmail } from "@/lib/emails/send-trial-end-final-reminder";
import { sendTrialEndReminderEmail } from "@/lib/emails/send-trial-end-reminder";
import prisma from "@/lib/prisma";
import { calculateDaysLeft, log } from "@/lib/utils";

/**
 * Cron to check if trial has expired.
 * If a user is not on pro plan and has 5 days left on trial, we send a reminder email to upgrade plan.
 * If a user is not on pro plan and has 1 day left on trial, we send a final reminder email to upgrade plan.
 **/
// Runs once per day at 12pm (0 12 * * *)

export const maxDuration = 300; // 5 minutes in seconds

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
    const teams = await prisma.team.findMany({
      where: {
        plan: {
          // exclude users who are on pro or free plan
          in: ["trial"],
        },
      },
      select: {
        id: true,
        createdAt: true,
        users: {
          where: { role: "ADMIN" },
          select: {
            user: {
              select: { email: true, name: true },
            },
          },
        },
        sentEmails: {
          where: {
            type: {
              in: [
                "FIRST_TRIAL_END_REMINDER_EMAIL",
                "FINAL_TRIAL_END_REMINDER_EMAIL",
              ],
            },
          },
          select: { type: true },
        },
      },
    });

    const results = await Promise.allSettled(
      teams.map(async (team) => {
        const { id, users, createdAt } = team as {
          id: string;
          createdAt: Date;
          users: {
            user: { email: string; name: string | null };
          }[];
        };

        const sentEmails = team.sentEmails.map((email) => email.type);
        const userEmail = users[0].user.email;
        const userName = users[0].user.name;
        const teamCreatedAt = createdAt;

        let teamDaysLeft = calculateDaysLeft(new Date(teamCreatedAt));

        // send first reminder email if team has 5 days left on trial
        if (teamDaysLeft == 5) {
          const sentFirstTrialEndReminderEmail = sentEmails.includes(
            "FIRST_TRIAL_END_REMINDER_EMAIL",
          );
          if (!sentFirstTrialEndReminderEmail) {
            return await Promise.allSettled([
              log({
                message: `Trial End Reminder for team: *${id}* is expiring in ${teamDaysLeft} days, email sent.`,
                type: "cron",
              }),
              limiter.schedule(() =>
                sendTrialEndReminderEmail(userEmail, userName),
              ),
              prisma.sentEmail.create({
                data: {
                  type: "FIRST_TRIAL_END_REMINDER_EMAIL",
                  teamId: id,
                  recipient: userEmail,
                },
              }),
            ]);
          }
        }

        // send final reminder email if team has 1 day left on trial
        if (teamDaysLeft <= 1) {
          const sentFinalTrialEndReminderEmail = sentEmails.includes(
            "FINAL_TRIAL_END_REMINDER_EMAIL",
          );
          if (!sentFinalTrialEndReminderEmail) {
            return await Promise.allSettled([
              log({
                message: `Final Trial End Reminder for team: *${id}* is expiring in ${teamDaysLeft} days, email sent.`,
                type: "cron",
              }),
              limiter.schedule(() =>
                sendTrialEndFinalReminderEmail(userEmail, userName),
              ),
              prisma.sentEmail.create({
                data: {
                  type: "FINAL_TRIAL_END_REMINDER_EMAIL",
                  teamId: id,
                  recipient: userEmail,
                },
              }),
            ]);
          }
        }

        // downgrade the user to free if team has 0 day left on trial
        if (teamDaysLeft <= 0) {
          return await Promise.allSettled([
            log({
              message: `Downgrade to free for user: *${id}* is expiring in ${teamDaysLeft} days, downgraded.`,
              type: "cron",
            }),
            prisma.user.update({
              where: { email: userEmail },
              data: { plan: "free" },
            }),
            prisma.team.update({
              where: { id },
              data: { plan: "free" },
            }),
          ]);
        }
      }),
    );
    return NextResponse.json(results);
  } catch (error) {
    await log({
      message: `Trial end reminder cron failed. Error: " + ${(error as Error).message}`,
      type: "cron",
      mention: true,
    });
    return NextResponse.json({ error: (error as Error).message });
  }
}
