import { NextApiRequest, NextApiResponse } from "next";

import { getServerSession } from "next-auth";

import {
  deleteUserSession,
  ensureUserSession,
  getUserSessions,
} from "@/lib/auth/user-session";
import { errorhandler } from "@/lib/errorHandler";
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
  const sessionUser = session.user as CustomUser;
  // @ts-ignore - userSessionToken is added in the jwt callback
  const userSessionToken = session.userSessionToken as string | undefined;

  if (req.method === "GET") {
    // GET /api/account/sessions - List all active sessions
    try {
      // Ensure current session is tracked
      if (userSessionToken) {
        await ensureUserSession(sessionUser.id, userSessionToken, req);
      }

      const sessions = await getUserSessions(sessionUser.id);

      // Mark current session based on the userSessionToken
      const sessionsWithCurrent = sessions.map((s) => ({
        ...s,
        isCurrent: userSessionToken
          ? s.id ===
            sessions.find(
              (sess) =>
                // We can't directly compare tokens, but we marked isCurrent when creating
                sess.isCurrent,
            )?.id
          : false,
      }));

      return res.status(200).json(sessionsWithCurrent);
    } catch (error) {
      errorhandler(error, res);
    }
  } else if (req.method === "DELETE") {
    // DELETE /api/account/sessions - Delete a specific session
    const { sessionId } = req.body;

    if (!sessionId || typeof sessionId !== "string") {
      return res.status(400).json({ error: "Session ID is required" });
    }

    try {
      const deleted = await deleteUserSession(sessionUser.id, sessionId);

      if (!deleted) {
        return res.status(404).json({ error: "Session not found" });
      }

      return res.status(200).json({ message: "Session revoked successfully" });
    } catch (error) {
      errorhandler(error, res);
    }
  } else {
    res.setHeader("Allow", ["GET", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
