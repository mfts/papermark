import { NextApiResponse } from "next";

import {
  AuthenticatedRequest,
  createAuthenticatedHandler,
} from "@/lib/middleware/api-auth";

export default createAuthenticatedHandler({
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { key } = req.body as { key: string };

    if (!key) {
      res.status(400).json({ message: "Key is required" });
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXTAUTH_URL}/api/file/s3/get-presigned-get-url`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
          },
          body: JSON.stringify({ key: key }),
        },
      );

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let error: any;

        if (contentType && contentType.includes("application/json")) {
          try {
            error = await response.json();
          } catch (parseError) {
            error = {
              message:
                (await response.text()) ||
                `Request failed with status ${response.status}`,
            };
          }
        } else {
          const textError = await response.text();
          error = {
            message:
              textError || `Request failed with status ${response.status}`,
          };
        }

        res.status(response.status).json(error);
        return;
      }

      const data = await response.json();
      res.status(200).json(data);
    } catch (error) {
      console.error("Proxy error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  },
});
