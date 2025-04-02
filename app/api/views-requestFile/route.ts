import { NextRequest, NextResponse } from "next/server";

import { getLimits, getLimitsForFileUploadRequest } from "@/ee/limits/server";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { ipAddress, waitUntil } from "@vercel/functions";
import { getServerSession } from "next-auth";

import { hashToken } from "@/lib/api/auth/token";
import { verifyPreviewSession } from "@/lib/auth/preview-auth";
import { PreviewSession } from "@/lib/auth/preview-auth";
import { sendOtpVerificationEmail } from "@/lib/emails/send-email-otp-verification";
import { newId } from "@/lib/id-helper";
import prisma from "@/lib/prisma";
import { ratelimit } from "@/lib/redis";
import { recordLinkView } from "@/lib/tracking/record-link-view";
import { CustomUser, WatermarkConfigSchema } from "@/lib/types";
import { checkPassword, decryptEncrpytedPassword, log } from "@/lib/utils";
import { generateOTP } from "@/lib/utils/generate-otp";
import { LOCALHOST_IP } from "@/lib/utils/geo";
import { validateEmail } from "@/lib/utils/validate-email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // POST /api/views-requestFile
    const { linkId, userId, ...data } = body as {
      linkId: string;
      userId: string | null;
    };

    const { email, password, name, hasConfirmedAgreement } = data as {
      email: string;
      password: string;
      name?: string;
      hasConfirmedAgreement?: boolean;
    };

    // Add customFields to the data extraction
    const { customFields } = data as {
      customFields?: { [key: string]: string };
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
            id: true,
            limits: true,
          },
        },
        customFields: {
          select: {
            identifier: true,
            label: true,
          },
        },
        uploadFolderId: true,
        requireApproval: true,
        uploadDataroomFolderId: true,
        maxFiles: true,
      },
    });
    const limits = await getLimitsForFileUploadRequest({
      teamId: link?.team?.id,
    });

    if (!link) {
      return NextResponse.json({ message: "Link not found." }, { status: 404 });
    }

    if (link.isArchived) {
      return NextResponse.json(
        { message: "Link is no longer available." },
        { status: 404 },
      );
    }

    // Check if email is required for visiting the link
    if (link.emailProtected) {
      if (!email || email.trim() === "") {
        return NextResponse.json(
          { message: "Email is required." },
          { status: 400 },
        );
      }

      // validate email
      if (!validateEmail(email)) {
        return NextResponse.json(
          { message: "Invalid email address." },
          { status: 400 },
        );
      }
    }

    // Check if password is required for visiting the link
    if (link.password) {
      if (!password || password.trim() === "") {
        return NextResponse.json(
          { message: "Password is required." },
          { status: 400 },
        );
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
        return NextResponse.json(
          { message: "Invalid password." },
          { status: 403 },
        );
      }
    }

    // Check if agreement is required for visiting the link
    if (link.enableAgreement && !hasConfirmedAgreement) {
      return NextResponse.json(
        { message: "Agreement to NDA is required." },
        { status: 400 },
      );
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
        return NextResponse.json(
          { message: "Unauthorized access" },
          { status: 403 },
        );
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
        return NextResponse.json(
          { message: "Unauthorized access" },
          { status: 403 },
        );
      }
    }

    // Request OTP Code for email verification if
    // 1) email verification is required and
    // 2) code is not provided or token not provided
    if (link.emailAuthenticated && !code && !token) {
      const ipAddressValue = ipAddress(request);

      const { success } = await ratelimit(10, "1 m").limit(
        `send-otp:${ipAddressValue}`,
      );
      if (!success) {
        return NextResponse.json(
          { message: "Too many requests. Please try again later." },
          { status: 429 },
        );
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
      return NextResponse.json({
        type: "email-verification",
        message: "Verification email sent.",
      });
    }

    let isEmailVerified: boolean = false;
    let hashedVerificationToken: string | null = null;
    if (link.emailAuthenticated && code) {
      const ipAddressValue = ipAddress(request);
      const { success } = await ratelimit(10, "1 m").limit(
        `verify-otp:${ipAddressValue}`,
      );
      if (!success) {
        return NextResponse.json(
          { message: "Too many requests. Please try again later." },
          { status: 429 },
        );
      }

      // Check if the OTP code is valid
      const verification = await prisma.verificationToken.findUnique({
        where: {
          token: code,
          identifier: `otp:${linkId}:${email}`,
        },
      });

      if (!verification) {
        return NextResponse.json(
          {
            message: "Unauthorized access. Request new access.",
            resetVerification: true,
          },
          { status: 401 },
        );
      }

      // Check the OTP code's expiration date
      if (Date.now() > verification.expires.getTime()) {
        await prisma.verificationToken.delete({
          where: {
            token: code,
          },
        });
        return NextResponse.json(
          {
            message: "Access expired. Request new access.",
            resetVerification: true,
          },
          { status: 401 },
        );
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
      const ipAddressValue = ipAddress(request);
      const { success } = await ratelimit(10, "1 m").limit(
        `verify-email:${ipAddressValue}`,
      );
      if (!success) {
        return NextResponse.json(
          { message: "Too many requests. Please try again later." },
          { status: 429 },
        );
      }

      // Check if the long-term verification token is valid
      const verification = await prisma.verificationToken.findUnique({
        where: {
          token: token,
          identifier: `link-verification:${linkId}:${link.teamId}:${email}`,
        },
      });

      if (!verification) {
        return NextResponse.json(
          {
            message: "Unauthorized access. Request new access.",
            resetVerification: true,
          },
          { status: 401 },
        );
      }

      // Check the long-term verification token's expiration date
      if (Date.now() > verification.expires.getTime()) {
        // delete the long-term verification token after verification
        await prisma.verificationToken.delete({
          where: {
            token: token,
          },
        });
        return NextResponse.json(
          {
            message: "Access expired. Request new access.",
            resetVerification: true,
          },
          { status: 401 },
        );
      }

      isEmailVerified = true;
    }

    // Check if there's a valid preview session
    let previewSession: PreviewSession | null = null;
    let isPreview: boolean = false;
    if (previewToken) {
      const session = await getServerSession(authOptions);
      if (!session) {
        return NextResponse.json(
          { message: "You need to be logged in to preview the link." },
          { status: 401 },
        );
      }
      previewSession = await verifyPreviewSession(
        previewToken,
        (session.user as CustomUser).id,
        linkId,
      );
      if (!previewSession) {
        return NextResponse.json(
          {
            message: "Preview session expired or invalid. Request a new one.",
            resetPreview: true,
          },
          { status: 401 },
        );
      }
      isPreview = true;
    }

    try {
      let viewer: { id: string } | null = null;
      if (email && !isPreview) {
        // find or create a viewer
        console.time("find-viewer");
        viewer = await prisma.viewer.findUnique({
          where: {
            teamId_email: {
              teamId: link.teamId!,
              email: email,
            },
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
            ...(customFields &&
              link.customFields.length > 0 && {
              customFieldResponse: {
                create: {
                  data: link.customFields.map((field) => ({
                    identifier: field.identifier,
                    label: field.label,
                    response: customFields[field.identifier] || "",
                  })),
                },
              },
            }),
            viewType: "FILE_REQUEST_VIEW",
            uploadFolderId: link.uploadFolderId,
            uploadDataroomFolderId: link.uploadDataroomFolderId,
          },
          select: { id: true },
        });
        console.timeEnd("create-view");
      }

      // TODO: add link view tracking
      if (newView) {
        // Record view in the background to avoid blocking the response
        waitUntil(
          // Record link view in Tinybird
          recordLinkView({
            req: request,
            clickId: newId("linkView"),
            viewId: newView.id,
            linkId,
            teamId: link.teamId!,
            enableNotification: link.enableNotification,
          }),
        );
      }
      let document: any;
      if (viewer?.id && linkId) {
        document = await prisma.document.findMany({
          where: {
            viewerId: viewer.id,
            uploadedViaLinkId: linkId,
          },
        });
      }

      const returnObject = {
        message: "View recorded",
        viewerId: viewer?.id,
        viewId: !isPreview && newView ? newView.id : undefined,
        isPreview: isPreview ? true : undefined,
        watermarkConfig: link.enableWatermark
          ? link.watermarkConfig
          : undefined,
        ipAddress:
          link.enableWatermark &&
            link.watermarkConfig &&
            WatermarkConfigSchema.parse(link.watermarkConfig).text.includes(
              "{{ipAddress}}",
            )
            ? process.env.VERCEL === "1"
              ? ipAddress(request)
              : LOCALHOST_IP
            : undefined,
        verificationToken: hashedVerificationToken ?? undefined,
        document,
        limits,
      };

      return NextResponse.json(returnObject);
    } catch (error) {
      log({
        message: `Failed to record view for ${linkId}. \n\n ${error}`,
        type: "error",
        mention: true,
      });
      return NextResponse.json(
        { message: (error as Error).message },
        { status: 500 },
      );
    }
  } catch (error) {
    log({
      message: `Failed to process request. \n\n ${error}`,
      type: "error",
      mention: true,
    });
    return NextResponse.json(
      { message: (error as Error).message },
      { status: 500 },
    );
  }
}
