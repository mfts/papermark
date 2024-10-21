import { NextApiRequest, NextApiResponse } from "next";

import { getLimits } from "@/ee/limits/server";
import { getServerSession } from "next-auth";

import { hashToken } from "@/lib/api/auth/token";
import { sendTeammateInviteEmail } from "@/lib/emails/send-teammate-invite";
import { errorhandler } from "@/lib/errorHandler";
import { newId } from "@/lib/id-helper";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../auth/[...nextauth]";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { teamId } = req.query as { teamId: string };

  if (req.method === "POST") {
    // Handle sending invitation
    const { email } = req.body;

    if (!email) {
      return res.status(400).json("Email is missing in request body");
    }

    try {
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          users: {
            select: {
              userId: true,
              role: true,
              user: {
                select: { email: true },
              },
            },
          },
        },
      });

      if (!team) {
        return res.status(404).json("Team not found");
      }

      // Check if the user is admin of the team
      const teamUsers = team.users;
      const isUserAdmin = teamUsers.some(
        (user) => user.role === "ADMIN" && user.userId === (session.user as CustomUser).id,
      );

      if (!isUserAdmin) {
        return res.status(403).json("Only admins can send the invitation!");
      }

      // Check if the user has reached the limit of users in the team
      const limits = await getLimits({
        teamId,
        userId: (session.user as CustomUser).id,
      });

      if (limits && teamUsers.length >= limits.users) {
        res
          .status(403)
          .json("You have reached the limit of users in your team");
        return;
      }

      // Check if user is already in the team
      const isExistingMember = teamUsers?.some(
        (user) => user.user.email === email,
      );

      if (isExistingMember) {
        return res.status(400).json("User is already a member of this team");
      }

      // Check if invitation already exists
      const invitationExists = await prisma.invitation.findUnique({
        where: {
          email_teamId: {
            teamId,
            email,
          },
        },
      });

      if (invitationExists) {
        return res.status(400).json("Invitation already sent to this email");
      }

      const token = newId("inv");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // invitation expires in 24 hours

      // Create invitation
      await prisma.invitation.create({
        data: {
          email,
          token,
          expires: expiresAt,
          teamId,
        },
      });

      // Send invite email
      const params = new URLSearchParams({
        callbackUrl: `${process.env.NEXTAUTH_URL}/api/teams/${teamId}/invitations/accept`,
        email,
        token,
      });

      const url = `${process.env.NEXTAUTH_URL}/api/auth/callback/email?${params}`;

      sendTeammateInviteEmail({
        senderName: (session.user as CustomUser).name || "",
        senderEmail: (session.user as CustomUser).email || "",
        teamName: team?.name || "",
        to: email,
        url: url,
      });

      return res.status(200).json("Invitation sent!");
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "GET") {
    // Handle accepting invitation
    const { action, token } = req.query;

    if (action === "accept" && token) {
      try {
        const invitation = await prisma.invitation.findUnique({
          where: { token: token as string },
        });

        if (!invitation) {
          return res.status(404).json("Invitation not found");
        }

        // Add the user to the team
        await prisma.team.update({
          where: { id: invitation.teamId },
          data: {
            users: {
              create: {
                userId: (session.user as CustomUser).id,
                role: "MEMBER", // or whatever role you want to assign
              },
            },
          },
        });

        // Optionally, delete the invitation after acceptance
        await prisma.invitation.delete({
          where: { token: token as string },
        });

        return res.status(200).json("Invitation accepted!");
      } catch (error) {
        console.error(error);
        return res.status(500).json("An error occurred while accepting the invitation");
      }
    }
  }

  return res.status(405).end("Method Not Allowed");
}
