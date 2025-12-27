import { verifyQstashSignature } from "@/lib/cron/verify-qstash";
import { sendWelcomeEmail } from "@/lib/emails/send-welcome";
import prisma from "@/lib/prisma";
import { subscribe } from "@/lib/resend";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    await verifyQstashSignature({ req, rawBody });

    const { userId } = JSON.parse(rawBody);

    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        name: true,
        email: true,
      },
    });

    if (!user) {
      return new Response("User not found. Skipping...", { status: 200 });
    }

    // this shouldn't happen but just in case
    if (!user.email) {
      return new Response("User email not found. Skipping...", { status: 200 });
    }

    await Promise.allSettled([
      // send welcome email
      sendWelcomeEmail({
        user: {
          email: user.email,
          name: user.name,
        },
      }),
      // subscribe user to the mailing list
      subscribe(user.email),
    ]);

    return new Response("Welcome email sent and user subscribed.", {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(
      "Error sending welcome email and subscribing user to mailing list.",
      { status: 500 },
    );
  }
}
