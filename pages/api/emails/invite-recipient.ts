import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";
import { identifyUser, trackAnalytics } from "@/lib/analytics";
import { sendInvitationToViewDocument } from "@/lib/emails/send-invitation-to-view-document";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    // POST /api/emails/invite-recipient
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).end("Unauthorized");
      return;
    }

    // Assuming data is an object with `name` and `description` properties
    const { senderEmail, recipientEmails, documentLink } = req.body;

    try {
      await identifyUser((session.user as CustomUser).id);
      recipientEmails.forEach(async (email: string)=>{
        await sendInvitationToViewDocument(email, documentLink);
        await new Promise(resolve=>setTimeout(resolve, 200)); //To avoid exceeding resend's limit 10 req/s
      });
      
      // type already create, if tracking is needed, uncomment the code below
      // await trackAnalytics({
      //   event: "Invitation To View Document",
      //   email: session.user?.email,
      //   url: documentLink xqs1,
      // });
   
      res.status(201).json(document);
    } catch (error) {
      log(`Failed to send invitation email. Error: \n\n ${error}`)
      res.status(500).json({
        message: "Internal Server Error",
        error: (error as Error).message,
      });
    }
  } else {
    // We only allow POST requests
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}