import { NextApiRequest, NextApiResponse } from "next";
import prisma from "@/lib/prisma";
import { checkPassword, decryptEncrpytedPassword, log } from "@/lib/utils";
import { newId } from "@/lib/id-helper";
import { sendVerificationEmail } from "@/lib/emails/send-email-verification";
import { getFile } from "@/lib/files/get-file";
import sendNotification from "@/lib/api/notification-helper";

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
    documentName,
    hasPages,
    token,
    ownerId,
    verifiedEmail,
    ...data
  } = req.body as {
    linkId: string;
    documentId: string;
    userId: string | null;
    documentVersionId: string;
    documentName: string;
    hasPages: boolean;
    token: string | null;
    ownerId: string;
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
      isArchived: true,
      slug: true,
      allowList: true,
      denyList: true,
    },
  });

  if (!link) {
    res.status(404).json({ message: "Link not found." });
    return;
  }

  if (link.isArchived) {
    res.status(404).json({ message: "Link is no longer available." });
    return;
  }

  // Check if email is required for visiting the link
  if (link.emailProtected) {
    if (!email || email.trim() === "") {
      res.status(400).json({ message: "Email is required." });
      return;
    }
  }

  // Check if password is required for visiting the link
  if (link.password) {
    if (!password || password.trim() === "") {
      res.status(400).json({ message: "Password is required." });
      return;
    }

    let isPasswordValid: boolean = false;
    const textParts: string[] = link.password.split(":");
    if (!textParts || textParts.length !== 2) {
      isPasswordValid = await checkPassword(password, link.password);
    } else {
      const decryptedPassword = decryptEncrpytedPassword(link.password);
      isPasswordValid = decryptedPassword === password;
    }

    if (!isPasswordValid) {
      res.status(403).json({ message: "Invalid password." });
      return;
    }
  }

  // Check if email is allowed to visit the link
  if (link.allowList && link.allowList.length > 0) {
    // Extract the domain from the email address
    const emailDomain = email.substring(email.lastIndexOf("@"));

    // Determine if the email or its domain is allowed
    const isAllowed = link.allowList.some((allowed) => {
      return (
        allowed === email ||
        (allowed.startsWith("@") && emailDomain === allowed)
      );
    });

    // Deny access if the email is not allowed
    if (!isAllowed) {
      res.status(403).json({ message: "Unauthorized access" });
      return;
    }
  }

  // Check if email is denied to visit the link
  if (link.denyList && link.denyList.length > 0) {
    // Extract the domain from the email address
    const emailDomain = email.substring(email.lastIndexOf("@"));

    // Determine if the email or its domain is denied
    const isDenied = link.denyList.some((denied) => {
      return (
        denied === email || (denied.startsWith("@") && emailDomain === denied)
      );
    });

    // Deny access if the email is denied
    if (isDenied) {
      res.status(403).json({ message: "Unauthorized access" });
      return;
    }
  }

  // Check if email verification is required for visiting the link
  if (link.emailAuthenticated && !token) {
    const token = newId("email");
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // token expires in 1 hour

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
          storageType: true,
          pageNumber: true,
          embeddedLinks: true,
        },
      });

      documentPages = await Promise.all(
        documentPages.map(async (page) => {
          const { storageType, ...otherPage } = page;
          return {
            ...otherPage,
            file: await getFile({ data: page.file, type: storageType }),
          };
        }),
      );

      console.timeEnd("get-pages");
    } else {
      // get file from document version
      console.time("get-file");
      documentVersion = await prisma.documentVersion.findUnique({
        where: { id: documentVersionId },
        select: {
          file: true,
          storageType: true,
        },
      });

      if (!documentVersion) {
        res.status(404).json({ message: "Document version not found." });
        return;
      }

      documentVersion.file = await getFile({
        data: documentVersion.file,
        type: documentVersion.storageType,
      });
      console.timeEnd("get-file");
    }

    if (link.enableNotification) {
      console.time("sendemail");
      await sendNotification({ viewId: newView.id });
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
    log({
      message: `Failed to record view for ${linkId}. \n\n ${error}`,
      type: "error",
      mention: true,
    });
    return res.status(500).json({ message: (error as Error).message });
  }
}
