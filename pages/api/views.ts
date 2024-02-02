import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { checkPassword, log } from "@/lib/utils";
import { trackAnalytics } from "@/lib/analytics";
import { client } from "@/trigger";
import { newId } from "@/lib/id-helper";
import { sendVerificationEmail } from "@/lib/emails/send-email-verification";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // We only allow POST requests
  if (req.method !== "POST") {
    res.status(405).json({ message: "Method Not Allowed" });
    return;
  }
  // POST /api/views
  const {
    linkId,
    documentId,
    userId,
    documentVersionId,
    hasPages,
    token,
    verifiedEmail,
    ...data
  } = req.body as {
    linkId: string;
    documentId: string;
    userId: string | null;
    documentVersionId: string;
    hasPages: boolean;
    token: string | null;
    verifiedEmail: string | null;
  };

  const { email, password } = data as { email: string; password: string };

  // Fetch the link to verify the settings
  const link = await prisma.link.findUnique({
    where: {
      id: linkId,
    },
    select: {
      emailProtected: true,
      enableNotification: true,
      emailAuthenticated: true,
      password: true,
      domainSlug: true,
      slug: true,
    },
  });

  if (!link) {
    res.status(404).json({ message: "Link not found." });
    return;
  }

  // Check if email is required for visiting the link
  if (link.emailProtected) {
    if (!email || email.trim() === "") {
      res.status(400).json({ message: "Email is required." });
      return;
    }

    // You can implement more thorough email validation if required
  }

  // Check if password is required for visiting the link
  if (link.password) {
    if (!password || password.trim() === "") {
      res.status(400).json({ message: "Password is required." });
      return;
    }

    const isPasswordValid = await checkPassword(password, link.password);
    if (!isPasswordValid) {
      res.status(403).json({ message: "Invalid password." });
      return;
    }
  }

  // Check if email verification is required for visiting the link
  if (link.emailAuthenticated && !token) {
    const token = newId("email");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // token expires in 24 hour

    await prisma.verificationToken.create({
      data: {
        token,
        identifier: `${linkId}:${email}`,
        expires: expiresAt,
      },
    });

    // set the default verification url
    let verificationUrl: string = `${process.env.NEXT_PUBLIC_BASE_URL}/view/${linkId}/?token=${token}&email=${encodeURIComponent(email)}`;

    if (link.domainSlug && link.slug) {
      // if custom domain is enabled, use the custom domain
      verificationUrl = `https://${link.domainSlug}/${link.slug}/?token=${token}&email=${encodeURIComponent(email)}`;
    }

    await sendVerificationEmail(email, verificationUrl);
    res.status(200).json({
      type: "email-verification",
      message: "Verification email sent.",
    });
    return;
  }

  let isEmailVerified: boolean = false;
  if (link.emailAuthenticated && token) {
    const verification = await prisma.verificationToken.findUnique({
      where: {
        token: token,
        identifier: `${linkId}:${verifiedEmail}`,
      },
    });

    if (!verification) {
      res.status(401).json({ message: "Unauthorized access" });
      return;
    }

    // Check the token's expiration date
    if (Date.now() > verification.expires.getTime()) {
      res.status(401).json({ message: "Access expired" });
      return;
    }

    isEmailVerified = true;
  }

  try {
    console.time("create-view");
    const newView = await prisma.view.create({
      data: {
        linkId: linkId,
        viewerEmail: email,
        documentId: documentId,
        verified: isEmailVerified,
      },
      select: { id: true },
    });
    console.timeEnd("create-view");

    // if document version has pages, then return pages
    // otherwise, return file from document version
    let documentPages, documentVersion;
    // let documentPagesPromise, documentVersionPromise;
    if (hasPages) {
      // get pages from document version
      console.time("get-pages");
      documentPages = await prisma.documentPage.findMany({
        where: { versionId: documentVersionId },
        orderBy: { pageNumber: "asc" },
        select: {
          file: true,
          pageNumber: true,
        },
      });
      console.timeEnd("get-pages");
    } else {
      // get file from document version
      console.time("get-file");
      documentVersion = await prisma.documentVersion.findUnique({
        where: { id: documentVersionId },
        select: {
          file: true,
        },
      });
      console.timeEnd("get-file");
    }

    // const [newView, documentPages, documentVersion] = await Promise.all([
    //   newViewPromise,
    //   documentPagesPromise,
    //   documentVersionPromise,
    // ]);

    // TODO: cannot identify user because session is not available
    // await identifyUser((session.user as CustomUser).id);
    // await analytics.identify();
    console.time("track-analytics");
    await trackAnalytics({
      event: "Link Viewed",
      linkId: linkId,
      documentId: documentId,
      viewerId: newView.id,
      viewerEmail: email,
    });
    console.timeEnd("track-analytics");

    if (link.enableNotification) {
      // trigger link viewed event to trigger send-notification job
      console.time("sendemail");
      await client.sendEvent({
        name: "link.viewed",
        payload: { viewId: newView.id },
      });
      console.timeEnd("sendemail");
    }

    const returnObject = {
      message: "View recorded",
      viewId: newView.id,
      file: documentVersion ? documentVersion.file : null,
      pages: documentPages ? documentPages : null,
    };

    return res.status(200).json(returnObject);
  } catch (error) {
    log(`Failed to record view for ${linkId}. Error: \n\n ${error}`);
    return res.status(500).json({ message: (error as Error).message });
  }
}
