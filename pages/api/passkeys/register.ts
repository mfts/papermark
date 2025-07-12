import { NextApiResponse } from "next";

import {
  finishServerPasskeyRegistration,
  startServerPasskeyRegistration,
} from "@/lib/api/auth/passkey";
import { errorhandler } from "@/lib/errorHandler";
import {
  AuthenticatedRequest,
  createAuthenticatedHandler,
} from "@/lib/middleware/api-auth";

export default createAuthenticatedHandler({
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { start, finish, credential } = req.body as {
      start: boolean;
      finish: boolean;
      credential: any;
    };

    try {
      if (start) {
        const createOptions = await startServerPasskeyRegistration({
          session: { user: req.user, expires: new Date().toISOString() },
        });
        res.status(200).json({ createOptions });
        return;
      }
      if (finish) {
        await finishServerPasskeyRegistration({
          credential,
          session: { user: req.user, expires: new Date().toISOString() },
        });
        res.status(200).json({ message: "Registered Passkey" });
        return;
      }
    } catch (error) {
      errorhandler(error, res);
      return;
    }
  },
});
