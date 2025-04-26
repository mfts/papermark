import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { ItemType, LinkAudienceType } from "@prisma/client";
import { ipAddress, waitUntil } from "@vercel/functions";
import { getServerSession } from "next-auth";
import { parsePageId } from "notion-utils";

import { hashToken } from "@/lib/api/auth/token";
import {
  DataroomSession,
  createDataroomSession,
} from "@/lib/auth/dataroom-auth";
import { verifyDataroomSession } from "@/lib/auth/dataroom-auth";
import { PreviewSession, verifyPreviewSession } from "@/lib/auth/preview-auth";
import { sendOtpVerificationEmail } from "@/lib/emails/send-email-otp-verification";
import { getFile } from "@/lib/files/get-file";
import { newId } from "@/lib/id-helper";
import notion from "@/lib/notion";
import { addSignedUrls } from "@/lib/notion/utils";
import prisma from "@/lib/prisma";
import { ratelimit } from "@/lib/redis";
import { parseSheet } from "@/lib/sheet";
import { recordLinkView } from "@/lib/tracking/record-link-view";
import { CustomUser, WatermarkConfigSchema } from "@/lib/types";
import { checkPassword, decryptEncrpytedPassword, log } from "@/lib/utils";
import { generateOTP } from "@/lib/utils/generate-otp";
import { LOCALHOST_IP } from "@/lib/utils/geo";
import { validateEmail } from "@/lib/utils/validate-email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      linkId,
      documentId,
      dataroomId,
      userId,
      documentVersionId,
      documentName,
      hasPages,
      ownerId,
      dataroomVerified,
      linkType,
      dataroomViewId,
      viewType,
      groupId,
      ...data
    } = body as {
      linkId: string;
      documentId: string | undefined;
      dataroomId: string;
      userId: string | null;
      documentVersionId: string | undefined;
      documentName: string | undefined;
      hasPages: boolean | undefined;
      ownerId: string | null;
      dataroomVerified: boolean | undefined;
      linkType: string;
      dataroomViewId?: string;
      viewType: "DATAROOM_VIEW" | "DOCUMENT_VIEW";
      groupId?: string;
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

    // INFO: for using the advanced excel viewer
    let { useAdvancedExcelViewer } = data as {
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
        documentId: true,
        dataroomId: true,
        emailProtected: true,
        enableNotification: true,
        emailAuthenticated: true,
        password: true,
        domainSlug: true,
        isArchived: true,
        slug: true,
        domainId: true,
        allowList: true,
        denyList: true,
        enableAgreement: true,
        agreementId: true,
        enableWatermark: true,
        watermarkConfig: true,
        groupId: true,
        audienceType: true,
        allowDownload: true,
        enableConversation: true,
        teamId: true,
        team: {
          select: {
            plan: true,
          },
        },
        customFields: {
          select: {
            identifier: true,
            label: true,
          },
        },
        enableUpload: true,
      },
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

      console.log("previewSession", previewSession);
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

    let dataroomSession: DataroomSession | null = null;
    if (!isPreview) {
      dataroomSession = await verifyDataroomSession(
        request,
        linkId,
        link.dataroomId!,
      );
    }

    let isEmailVerified: boolean = false;
    let hashedVerificationToken: string | null = null;
    // If there is no session, then we need to check if the link is protected and enforce the checks
    if (!dataroomSession && !isPreview) {
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
            denied === email ||
            (denied.startsWith("@") && emailDomain === denied)
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

      // Check if group is allowed to visit the link
      if (link.audienceType === LinkAudienceType.GROUP && link.groupId) {
        const group = await prisma.viewerGroup.findUnique({
          where: { id: link.groupId },
          select: {
            members: { include: { viewer: { select: { email: true } } } },
            domains: true,
            allowAll: true,
          },
        });

        if (!group) {
          return NextResponse.json(
            { message: "Group not found." },
            { status: 404 },
          );
        }

        // Check if all emails are allowed
        if (group.allowAll) {
          // Allow access
        } else {
          // Check individual membership
          const isMember = group.members.some(
            (member) => member.viewer.email === email,
          );

          // Extract domain from email
          const emailDomain = email.substring(email.lastIndexOf("@"));
          // Check domain access
          const hasDomainAccess = group.domains.some(
            (domain) => domain === emailDomain,
          );

          if (!isMember && !hasDomainAccess) {
            return NextResponse.json(
              { message: "Unauthorized access" },
              { status: 403 },
            );
          }
        }
      }

      // Request OTP Code for email verification if
      // 1) email verification is required and
      // 2) code is not provided or token not provided
      if (link.emailAuthenticated && !code && !token && !dataroomVerified) {
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

        waitUntil(sendOtpVerificationEmail(email, otpCode, true));
        return NextResponse.json(
          {
            type: "email-verification",
            message: "Verification email sent.",
          },
          { status: 200 },
        );
      }

      if (link.emailAuthenticated && code && !dataroomVerified) {
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

      if (link.emailAuthenticated && token && !dataroomVerified) {
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

      if (link.emailAuthenticated && dataroomVerified) {
        isEmailVerified = true;
      }
    }

    let viewer: { id: string; email: string; verified: boolean } | null = null;
    if (!isPreview) {
      if (!dataroomSession) {
        if (email) {
          // find or create a viewer
          console.time("find-viewer");
          viewer = await prisma.viewer.findUnique({
            where: {
              teamId_email: {
                teamId: link.teamId!,
                email: email,
              },
            },
            select: { id: true, email: true, verified: true },
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
              select: { id: true, email: true, verified: true },
            });
            console.timeEnd("create-viewer");
          }
        }
      } else {
        if (dataroomSession.viewerId) {
          viewer = await prisma.viewer.findUnique({
            where: { id: dataroomSession.viewerId, teamId: link.teamId! },
            select: { id: true, email: true, verified: true },
          });
        }
      }

      if (viewer && !viewer.verified && isEmailVerified) {
        await prisma.viewer.update({
          where: { id: viewer.id },
          data: { verified: isEmailVerified },
        });
      }
    }

    // Common fields for the view object shared between DATAROOM_VIEW and DOCUMENT_VIEW
    const viewFields = {
      linkId: linkId,
      viewerEmail: viewer?.email ?? email,
      viewerName: name,
      verified: isEmailVerified,
      dataroomId: link.dataroomId,
      viewerId: viewer?.id ?? undefined,
      teamId: link.teamId,
      ...(link.enableAgreement &&
        link.agreementId &&
        hasConfirmedAgreement && {
          agreementResponse: {
            create: {
              agreementId: link.agreementId,
            },
          },
        }),
      ...(link.audienceType === LinkAudienceType.GROUP &&
        link.groupId && {
          groupId: link.groupId,
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
    };

    // ** DATAROOM_VIEW **
    if (viewType === "DATAROOM_VIEW") {
      console.log("viewType is DATAROOM_VIEW");
      try {
        let newDataroomView: { id: string } | null = null;
        if (!isPreview) {
          if (!dataroomSession) {
            console.time("create-view");
            newDataroomView = await prisma.view.create({
              data: { ...viewFields, viewType: "DATAROOM_VIEW" },
              select: { id: true },
            });
            console.timeEnd("create-view");
          }
        }

        // Send events in the background to avoid blocking the response
        if (newDataroomView) {
          waitUntil(
            // Record link view in Tinybird
            recordLinkView({
              req: request,
              clickId: newId("linkView"),
              viewId: newDataroomView.id,
              linkId,
              dataroomId,
              teamId: link.teamId!,
              enableNotification: link.enableNotification,
            }),
          );
        }

        const dataroomViewId =
          newDataroomView?.id ?? dataroomSession?.viewId ?? undefined;

        const returnObject = {
          message: "Dataroom View recorded",
          viewId: dataroomViewId,
          isPreview: isPreview ? true : undefined,
          file: undefined,
          pages: undefined,
          notionData: undefined,
          verificationToken: hashedVerificationToken,
          viewerId: viewer?.id,
          conversationsEnabled: link.enableConversation,
          enableVisitorUpload: link.enableUpload,
        };

        const response = NextResponse.json(returnObject, { status: 200 });

        // Create a dataroom session token if a dataroom session doesn't exist yet
        if (!dataroomSession && !isPreview) {
          const newDataroomSession = await createDataroomSession(
            dataroomId,
            linkId,
            newDataroomView?.id!,
            ipAddress(request) ?? LOCALHOST_IP,
            viewer?.id,
          );

          let basePath = `/view/${linkId}`;
          const cookieId = `pm_drs_${linkId}`;
          let flagCookieId = `pm_drs_flag_${linkId}`;

          if (link.domainId) {
            basePath = `/${link.slug}`;
            flagCookieId = `pm_drs_flag_${link.slug}`;
          }

          response.cookies.set(cookieId, newDataroomSession?.token, {
            path: "/",
            expires: new Date(newDataroomSession?.expiresAt),
            httpOnly: true,
            sameSite: "strict",
          });
          response.cookies.set(flagCookieId, "true", {
            path: basePath,
            expires: new Date(newDataroomSession?.expiresAt),
            sameSite: "strict",
          });
        }

        return response;
      } catch (error) {
        log({
          message: `Failed to record view for dataroom link: ${linkId}. \n\n ${error}`,
          type: "error",
          mention: true,
        });
        return NextResponse.json(
          { message: (error as Error).message },
          { status: 500 },
        );
      }
    }

    // ** DOCUMENT_VIEW **
    try {
      let newView: { id: string } | null = null;
      let dataroomView: { id: string } | null = null;
      if (!isPreview) {
        console.time("create-view");

        // if dataroomSession is not present, create a dataroom view first
        if (!dataroomSession) {
          console.log(
            "no dataroom session present, creating new dataroom view",
          );
          dataroomView = await prisma.view.create({
            data: { ...viewFields, viewType: "DATAROOM_VIEW" },
            select: { id: true },
          });

          waitUntil(
            // Record link view in Tinybird
            recordLinkView({
              req: request,
              clickId: newId("linkView"),
              viewId: dataroomView.id,
              linkId,
              dataroomId,
              teamId: link.teamId!,
              enableNotification: link.enableNotification,
            }),
          );
        }

        // create the document view
        newView = await prisma.view.create({
          data: {
            ...viewFields,
            documentId: documentId,
            dataroomViewId:
              dataroomSession?.viewId ?? dataroomView?.id ?? dataroomViewId,
            viewType: "DOCUMENT_VIEW",
          },
          select: { id: true },
        });
        console.timeEnd("create-view");
      }

      // if document version has pages, then return pages
      // otherwise, check if notion document,
      // if notion, return recordMap and theme from document version file
      // otherwise, return file from document version
      let documentPages, documentVersion;
      let recordMap, theme;
      let sheetData;

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
          return NextResponse.json(
            { message: "Document version not found." },
            { status: 404 },
          );
        }

        if (
          documentVersion.type === "pdf" ||
          documentVersion.type === "image" ||
          documentVersion.type === "video"
        ) {
          documentVersion.file = await getFile({
            data: documentVersion.file,
            type: documentVersion.storageType,
          });
        }

        if (documentVersion.type === "notion") {
          // get theme `mode` param from document version file
          const modeMatch = documentVersion.file.match(/[?&]mode=(dark|light)/);
          theme = modeMatch ? modeMatch[1] : undefined;

          let notionPageId = parsePageId(documentVersion.file, { uuid: false });
          if (!notionPageId) {
            notionPageId = "";
          }

          const pageId = notionPageId;
          recordMap = await notion.getPage(pageId, { signFileUrls: false });
          // TODO: separately sign the file urls until PR merged and published; ref: https://github.com/NotionX/react-notion-x/issues/580#issuecomment-2542823817
          await addSignedUrls({ recordMap });
        }

        if (documentVersion.type === "sheet") {
          const document = await prisma.document.findUnique({
            where: { id: documentId },
            select: { advancedExcelEnabled: true },
          });
          useAdvancedExcelViewer = document?.advancedExcelEnabled ?? false;

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

      // check if viewer can download the document based on group permissions
      let canDownload: boolean = link.allowDownload ?? false;
      if (
        link.allowDownload &&
        link.audienceType === LinkAudienceType.GROUP &&
        link.groupId &&
        documentId &&
        dataroomId
      ) {
        const dataroomDocument = await prisma.dataroomDocument.findUnique({
          where: {
            dataroomId_documentId: {
              dataroomId: dataroomId,
              documentId: documentId,
            },
          },
          select: { id: true },
        });
        if (!dataroomDocument) {
          canDownload = false;
        } else {
          const groupDocumentPermission =
            await prisma.viewerGroupAccessControls.findUnique({
              where: {
                groupId_itemId: {
                  groupId: link.groupId,
                  itemId: dataroomDocument.id,
                },
                itemType: ItemType.DATAROOM_DOCUMENT,
              },
              select: { canDownload: true },
            });
          canDownload = groupDocumentPermission?.canDownload ?? false;
        }
      }

      const returnObject = {
        message: "View recorded",
        viewId: !isPreview && newView ? newView.id : undefined,
        isPreview: isPreview ? true : undefined,
        file:
          (documentVersion &&
            (documentVersion.type === "pdf" ||
              documentVersion.type === "image" ||
              documentVersion.type === "zip" ||
              documentVersion.type === "video")) ||
          (documentVersion && useAdvancedExcelViewer)
            ? documentVersion.file
            : undefined,
        pages: documentPages ? documentPages : undefined,
        notionData: recordMap ? { recordMap, theme } : undefined,
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
            : recordMap
              ? "notion"
              : undefined,
        watermarkConfig: link.enableWatermark
          ? link.watermarkConfig
          : undefined,
        viewerEmail: viewer?.email ?? email ?? verifiedEmail ?? null,
        ipAddress:
          link.enableWatermark &&
          link.watermarkConfig &&
          WatermarkConfigSchema.parse(link.watermarkConfig).text.includes(
            "{{ipAddress}}",
          )
            ? (ipAddress(request) ?? LOCALHOST_IP)
            : undefined,
        useAdvancedExcelViewer:
          documentVersion &&
          documentVersion.type === "sheet" &&
          useAdvancedExcelViewer
            ? useAdvancedExcelViewer
            : undefined,
        canDownload: canDownload,
        viewerId: viewer?.id,
        conversationsEnabled: link.enableConversation,
      };

      const response = NextResponse.json(returnObject, { status: 200 });

      // Create a dataroom session token if a dataroom session doesn't exist yet// Create a dataroom session token if a dataroom session doesn't exist yet
      if (!dataroomSession && !isPreview) {
        const newDataroomSession = await createDataroomSession(
          dataroomId,
          linkId,
          dataroomView?.id!,
          ipAddress(request) ?? LOCALHOST_IP,
          viewer?.id,
        );

        let basePath = `/view/${linkId}`;
        const cookieId = `pm_drs_${linkId}`;
        let flagCookieId = `pm_drs_flag_${linkId}`;
        if (link.domainId) {
          basePath = `/${link.slug}`;
          flagCookieId = `pm_drs_flag_${link.slug}`;
        }

        response.cookies.set(cookieId, newDataroomSession?.token, {
          path: "/",
          expires: new Date(newDataroomSession?.expiresAt),
          httpOnly: true,
          sameSite: "strict",
        });
        response.cookies.set(flagCookieId, "true", {
          path: basePath,
          expires: new Date(newDataroomSession?.expiresAt),
          sameSite: "strict",
        });
      }

      return response;
    } catch (error) {
      log({
        message: `Failed to record view for dataroom document ${linkId}. \n\n ${error}`,
        type: "error",
        mention: true,
      });
      return NextResponse.json(
        { message: (error as Error).message },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
