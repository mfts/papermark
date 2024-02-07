import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession, Session } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { google } from "googleapis";

type ClientOptions = {
  accessToken?: string | undefined;
  refreshToken?: string | undefined;
};

const getClient = (session: ClientOptions) => {
  const auth = new google.auth.OAuth2({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  });

  auth.setCredentials({
    access_token: session.accessToken,
    //not sure how to get this refreshToken right now
    refresh_token: session.refreshToken,
  });

  return auth;
};

export const getDriveClient = (session: any) => {
  const auth = getClient(session);
  const drive = google.drive({ version: "v3", auth });

  return drive;
};

export default async function googleDrive(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).end("Unauthorized");
    }
    const drive = getDriveClient(session);

    const response = await drive.files.list({
      pageSize: 10,
      fields: "nextPageToken, files(id, name, webViewLink,thumbnailLink )",
    });

    const files = response.data.files;

    return res.json({
      files: files,
      nextPageToken: response.data.nextPageToken,
    });
  } catch (error) {
    console.log(error);
    return res.json([]);
  }
}
