import { NextApiRequest, NextApiResponse } from "next";

import { waitUntil } from "@vercel/functions";
import { getServerSession } from "next-auth/next";

import { hashToken } from "@/lib/api/auth/token";
import sendNotification from "@/lib/api/notification-helper";
import { recordVisit } from "@/lib/api/views/record-visit";
import { sendOtpVerificationEmail } from "@/lib/emails/send-email-otp-verification";
import { getFile } from "@/lib/files/get-file";
import { newId } from "@/lib/id-helper";
import prisma from "@/lib/prisma";
import { ratelimit } from "@/lib/redis";
import { parseSheet } from "@/lib/sheet";
import { CustomUser, WatermarkConfigSchema } from "@/lib/types";
import { checkPassword, decryptEncrpytedPassword, log } from "@/lib/utils";
import { generateOTP } from "@/lib/utils/generate-otp";
import { getIpAddress } from "@/lib/utils/ip";
import { validateEmail } from "@/lib/utils/validate-email";

import { authOptions } from "./auth/[...nextauth]";

export const config = {
  // in order to enable `waitUntil` function
  supportsResponseStreaming: true,
};

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
    ownerId,
    ...data
  } = req.body as {
    linkId: string;
    documentId: string;
    userId: string | null;
    documentVersionId: string;
    documentName: string;
    hasPages: boolean;
    ownerId: string;
  };

  const { email, password, name, hasConfirmedAgreement } = data as {
    email: string;
    password: string;
    name?: string;
    hasConfirmedAgreement?: boolean;
  };

  // INFO: for using the advanced excel viewer
  const { useAdvancedExcelViewer } = data as {
    useAdvancedExcelViewer: boolean;
  };

  // previewToken is used to determine if the view is a preview and therefore should not be recorded
  const { previewToken } = data as {
    previewToken?: string;
  };

  // Email Verification Data
  const { code, token, verifiedEmail } = data as {
    code?: string;
    token?: string;
    verifiedEmail?: string;
  };

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
      enableAgreement: true,
      agreementId: true,
      enableWatermark: true,
      watermarkConfig: true,
      teamId: true,
      team: {
        select: {
          plan: true,
        },
      },
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

    // validate email
    if (!validateEmail(email)) {
      res.status(400).json({ message: "Invalid email address." });
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

  // Check if agreement is required for visiting the link
  if (link.enableAgreement && !hasConfirmedAgreement) {
    res.status(400).json({ message: "Agreement to NDA is required." });
    return;
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

  // Request OTP Code for email verification if
  // 1) email verification is required and
  // 2) code is not provided or token not provided
  if (link.emailAuthenticated && !code && !token) {
    const ipAddress = getIpAddress(req.headers);

    const { success } = await ratelimit(10, "1 m").limit(
      `send-otp:${ipAddress}`,
    );
    if (!success) {
      res
        .status(429)
        .json({ message: "Too many requests. Please try again later." });
      return;
    }

    await prisma.verificationToken.deleteMany({
      where: {
        identifier: `otp:${linkId}:${email}`,
      },
    });

    const otpCode = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // token expires at 10 minutes

    await prisma.verificationToken.create({
      data: {
        token: otpCode,
        identifier: `otp:${linkId}:${email}`,
        expires: expiresAt,
      },
    });

    waitUntil(sendOtpVerificationEmail(email, otpCode));
    res.status(200).json({
      type: "email-verification",
      message: "Verification email sent.",
    });
    return;
  }

  let isEmailVerified: boolean = false;
  let hashedVerificationToken: string | null = null;
  if (link.emailAuthenticated && code) {
    const ipAddress = getIpAddress(req.headers);
    const { success } = await ratelimit(10, "1 m").limit(
      `verify-otp:${ipAddress}`,
    );
    if (!success) {
      res
        .status(429)
        .json({ message: "Too many requests. Please try again later." });
      return;
    }

    // Check if the OTP code is valid
    const verification = await prisma.verificationToken.findUnique({
      where: {
        token: code,
        identifier: `otp:${linkId}:${email}`,
      },
    });

    if (!verification) {
      res.status(401).json({
        message: "Unauthorized access. Request new access.",
        resetVerification: true,
      });
      return;
    }

    // Check the OTP code's expiration date
    if (Date.now() > verification.expires.getTime()) {
      await prisma.verificationToken.delete({
        where: {
          token: code,
        },
      });
      res.status(401).json({
        message: "Access expired. Request new access.",
        resetVerification: true,
      });
      return;
    }

    // delete the OTP code after verification
    await prisma.verificationToken.delete({
      where: {
        token: code,
      },
    });

    // Create a email verification token for repeat access
    const token = newId("email");
    hashedVerificationToken = hashToken(token);
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setHours(tokenExpiresAt.getHours() + 23); // token expires at 23 hours
    await prisma.verificationToken.create({
      data: {
        token: hashedVerificationToken,
        identifier: `link-verification:${linkId}:${link.teamId}:${email}`,
        expires: tokenExpiresAt,
      },
    });

    isEmailVerified = true;
  }

  if (link.emailAuthenticated && token) {
    const ipAddress = getIpAddress(req.headers);
    const { success } = await ratelimit(10, "1 m").limit(
      `verify-email:${ipAddress}`,
    );
    if (!success) {
      res
        .status(429)
        .json({ message: "Too many requests. Please try again later." });
      return;
    }

    // Check if the long-term verification token is valid
    const verification = await prisma.verificationToken.findUnique({
      where: {
        token: token,
        identifier: `link-verification:${linkId}:${link.teamId}:${email}`,
      },
    });

    if (!verification) {
      res.status(401).json({
        message: "Unauthorized access. Request new access.",
        resetVerification: true,
      });
      return;
    }

    // Check the long-term verification token's expiration date
    if (Date.now() > verification.expires.getTime()) {
      // delete the long-term verification token after verification
      await prisma.verificationToken.delete({
        where: {
          token: token,
        },
      });
      res.status(401).json({
        message: "Access expired. Request new access.",
        resetVerification: true,
      });
      return;
    }

    isEmailVerified = true;
  }

  // Check if the view is a preview
  let isPreview: boolean = false;
  if (previewToken) {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res
        .status(401)
        .json({ message: "You need to be logged in to preview the link." });
    }
    const verification = await prisma.verificationToken.findUnique({
      where: {
        token: previewToken,
        identifier: `preview:${linkId}:${(session.user as CustomUser).id}`,
      },
    });

    if (!verification) {
      res.status(401).json({
        message: "Unauthorized access.",
      });
      return;
    }

    // Check the token's expiration date
    if (Date.now() > verification.expires.getTime()) {
      res.status(401).json({ message: "Preview access expired" });
      return;
    }

    // TODO: delete previewToken
    // delete the token after verification
    // await prisma.verificationToken.delete({
    //   where: {
    //     token: previewToken,
    //   },
    // });

    isPreview = true;
  }

  try {
    let viewer: { id: string } | null = null;
    if (email && !isPreview) {
      // find or create a viewer
      console.time("find-viewer");
      viewer = await prisma.viewer.findFirst({
        where: {
          email: email,
          teamId: link.teamId!,
        },
        select: { id: true },
      });
      console.timeEnd("find-viewer");

      if (!viewer) {
        console.time("create-viewer");
        viewer = await prisma.viewer.create({
          data: {
            email: email,
            verified: isEmailVerified,
            teamId: link.teamId!,
          },
          select: { id: true },
        });
        console.timeEnd("create-viewer");
      }
    }

    let newView: { id: string } | null = null;
    if (!isPreview) {
      console.time("create-view");
      newView = await prisma.view.create({
        data: {
          linkId: linkId,
          viewerEmail: email,
          viewerName: name,
          documentId: documentId,
          teamId: link.teamId!,
          viewerId: viewer?.id ?? undefined,
          verified: isEmailVerified,
          ...(link.enableAgreement &&
            link.agreementId &&
            hasConfirmedAgreement && {
              agreementResponse: {
                create: {
                  agreementId: link.agreementId,
                },
              },
            }),
        },
        select: { id: true },
      });
      console.timeEnd("create-view");
    }

    // if document version has pages, then return pages
    // otherwise, return file from document version
    let documentPages, documentVersion;
    let sheetData;
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
          embeddedLinks: !link.team?.plan.includes("free"),
          pageLinks: !link.team?.plan.includes("free"),
          metadata: true,
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
          type: true,
        },
      });

      if (!documentVersion) {
        res.status(404).json({ message: "Document version not found." });
        return;
      }

      if (documentVersion.type === "pdf" || documentVersion.type === "image") {
        documentVersion.file = await getFile({
          data: documentVersion.file,
          type: documentVersion.storageType,
        });
      }

      if (documentVersion.type === "sheet") {
        if (useAdvancedExcelViewer) {
          documentVersion.file = documentVersion.file.includes("https://")
            ? documentVersion.file
            : `https://${process.env.NEXT_PRIVATE_ADVANCED_UPLOAD_DISTRIBUTION_HOST}/${documentVersion.file}`;
        } else {
          const fileUrl = await getFile({
            data: documentVersion.file,
            type: documentVersion.storageType,
          });

          const data = await parseSheet({ fileUrl });
          sheetData = data;
        }
      }
      console.timeEnd("get-file");
    }

    if (link.enableNotification && newView) {
      console.time("sendemail");
      waitUntil(sendNotification({ viewId: newView.id }));
      console.timeEnd("sendemail");
    }

    // Prepare webhook for view
    if (newView) {
      waitUntil(
        recordVisit({
          viewId: newView.id,
          linkId,
          teamId: link.teamId!,
          documentId,
          headers: req.headers,
        }),
      );
    }

    const returnObject = {
      message: "View recorded",
      viewId: !isPreview && newView ? newView.id : undefined,
      isPreview: isPreview ? true : undefined,
      file:
        (documentVersion &&
          (documentVersion.type === "pdf" ||
            documentVersion.type === "image" ||
            documentVersion.type === "zip")) ||
        (documentVersion && useAdvancedExcelViewer)
          ? documentVersion.file
          : undefined,
      pages: documentPages ? documentPages : undefined,
      sheetData:
        documentVersion &&
        documentVersion.type === "sheet" &&
        !useAdvancedExcelViewer
          ? sheetData
          : undefined,
      fileType: documentVersion
        ? documentVersion.type
        : documentPages
          ? "pdf"
          : undefined,
      watermarkConfig: link.enableWatermark ? link.watermarkConfig : undefined,
      ipAddress:
        link.enableWatermark &&
        link.watermarkConfig &&
        WatermarkConfigSchema.parse(link.watermarkConfig).text.includes(
          "{{ipAddress}}",
        )
          ? getIpAddress(req.headers)
          : undefined,
      verificationToken: hashedVerificationToken ?? undefined,
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
