import { NextApiRequest, NextApiResponse } from "next";

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { format } from "date-fns";

import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { getServerSession } from "next-auth/next";

import { errorhandler } from "@/lib/errorHandler";
import { getFile } from "@/lib/files/get-file";
import { getViewUserAgent, getViewUserAgent_v2 } from "@/lib/tinybird/pipes";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";
import { log } from "@/lib/utils";

export default async function handle(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", ["GET"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).end("Unauthorized");
  }

  const { viewId } = req.query as {
    viewId: string;
  };
  const userId = (session.user as CustomUser).id;

  try {
    // Fetch the view with agreement response and related data
    const view = await prisma.view.findUnique({
      where: { id: viewId },
      include: {
        agreementResponse: {
          include: {
            agreement: {
              select: {
                name: true,
                content: true,
                contentType: true,
              },
            },
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            users: {
              where: {
                userId: userId,
              },
              select: {
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!view) {
      return res.status(404).json({ error: "View not found" });
    }

    // Check if user has access to this team
    if (!view.team || !view.team.users.some((u) => u.userId === userId)) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    // Check if agreement response exists
    if (!view.agreementResponse) {
      return res.status(400).json({ error: "No agreement response found" });
    }

    // Fetch user agent data for location, device, browser, OS
    // This is optional - if it fails, we'll use defaults
    let userAgentData: {
      browser?: string;
      os?: string;
      device?: string;
      country?: string;
      city?: string;
    } = {
      browser: "Unknown",
      os: "Unknown",
      device: "Unknown",
      country: "Unknown",
      city: "Unknown",
    };

    try {
      const userAgent = await getViewUserAgent({ viewId: viewId });
      if (userAgent && (userAgent.rows ?? 0) > 0 && userAgent.data && userAgent.data[0]) {
        userAgentData = {
          browser: userAgent.data[0].browser || "Unknown",
          os: userAgent.data[0].os || "Unknown",
          device: userAgent.data[0].device || "Unknown",
          country: userAgent.data[0].country || "Unknown",
          city: userAgent.data[0].city || "Unknown",
        };
      } else if (view.documentId) {
        // Try v2 if v3 doesn't have data and we have a documentId
        try {
          const userAgentV2 = await getViewUserAgent_v2({
            documentId: view.documentId,
            viewId: viewId,
            since: 0,
          });
          if (userAgentV2 && (userAgentV2.rows ?? 0) > 0 && userAgentV2.data && userAgentV2.data[0]) {
            userAgentData = {
              browser: userAgentV2.data[0].browser || "Unknown",
              os: userAgentV2.data[0].os || "Unknown",
              device: userAgentV2.data[0].device || "Unknown",
              country: userAgentV2.data[0].country || "Unknown",
              city: userAgentV2.data[0].city || "Unknown",
            };
          }
        } catch (v2Error) {
          // Silently fail v2 attempt
        }
      }
    } catch (error) {
      // If user agent fetch fails, continue with defaults
      // This should not break certificate generation
    }

    // Format location data
    const locationText = 
      userAgentData.city && userAgentData.city !== "Unknown" && userAgentData.country && userAgentData.country !== "Unknown"
        ? `${userAgentData.city}, ${userAgentData.country}`
        : userAgentData.country && userAgentData.country !== "Unknown"
        ? userAgentData.country
        : "Not available";
    
    // Format device details
    const deviceType = userAgentData.device && userAgentData.device !== "Unknown" 
      ? userAgentData.device 
      : "Desktop";
    const isDesktop = deviceType.toLowerCase() === "desktop" || deviceType.toLowerCase() === "unknown";

    const agreement = view.agreementResponse.agreement;
    let basePdfDoc: PDFDocument;

    // Load or create the agreement PDF
    if (agreement.contentType === "TEXT") {
      // Create PDF from text content
      basePdfDoc = await PDFDocument.create();
      const agreementPage = basePdfDoc.addPage([612, 792]);
      const { width: pageWidth, height: pageHeight } = agreementPage.getSize();

      const helveticaFont = await basePdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBoldFont = await basePdfDoc.embedFont(
        StandardFonts.HelveticaBold,
      );

      const darkGray = rgb(0.2, 0.2, 0.2);
      const lightGray = rgb(0.5, 0.5, 0.5);

      // Agreement name as title (left-aligned)
      const titleFontSize = 20;
      const titleText = agreement.name;
      const margin = 72; // 1 inch margin
      agreementPage.drawText(titleText, {
        x: margin,
        y: pageHeight - 80,
        size: titleFontSize,
        font: helveticaBoldFont,
        color: darkGray,
      });

      // Agreement text content - split into lines
      const textContent = agreement.content;
      const fontSize = 12;
      const lineHeight = fontSize * 1.5;
      const maxWidth = pageWidth - 2 * margin;
      const startY = pageHeight - 120;

      // Simple text wrapping
      const words = textContent.split(/\s+/);
      let currentLine = "";
      let y = startY;
      const lines: string[] = [];

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = helveticaFont.widthOfTextAtSize(testLine, fontSize);

        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) {
        lines.push(currentLine);
      }

      // Draw text lines
      let currentPage = agreementPage;
      for (let i = 0; i < lines.length; i++) {
        if (y < margin) {
          // Add new page if needed
          currentPage = basePdfDoc.addPage([612, 792]);
          y = pageHeight - margin;
        }
        currentPage.drawText(lines[i], {
          x: margin,
          y: y,
          size: fontSize,
          font: helveticaFont,
          color: darkGray,
        });
        y -= lineHeight;
      }
    } else {
      // contentType === "LINK" - fetch the document PDF
      try {
        // Extract linkId from URL
        const isPapermarkUrl =
          agreement.content.includes("papermark.com/view/") ||
          agreement.content.includes("/view/");
        let linkId: string | null = null;

        if (isPapermarkUrl) {
          const urlParts = agreement.content.split("/view/");
          if (urlParts.length >= 2) {
            linkId = urlParts[1].split(/[/?#]/)[0];
          }
        }

        if (!linkId) {
          // If not a Papermark URL, try to fetch directly
          const response = await fetch(agreement.content, {
            headers: { Accept: "application/pdf" },
          });
          if (!response.ok) {
            throw new Error("Failed to fetch agreement document");
          }
          const pdfBuffer = await response.arrayBuffer();
          basePdfDoc = await PDFDocument.load(pdfBuffer);
        } else {
          // Fetch link and document
          const link = await prisma.link.findUnique({
            where: { id: linkId },
            include: {
              document: {
                select: {
                  file: true,
                  originalFile: true,
                  storageType: true,
                  versions: {
                    where: { isPrimary: true },
                    select: {
                      file: true,
                      originalFile: true,
                      storageType: true,
                      type: true,
                    },
                    take: 1,
                  },
                },
              },
            },
          });

          if (!link || !link.document) {
            throw new Error("Document not found for agreement");
          }

          const documentVersion = link.document.versions[0];
          const fileKey = documentVersion
            ? documentVersion.originalFile || documentVersion.file
            : link.document.originalFile || link.document.file;
          const storageType = documentVersion
            ? documentVersion.storageType
            : link.document.storageType;

          // Only process if it's a PDF
          if (documentVersion && documentVersion.type !== "pdf") {
            throw new Error("Agreement document is not a PDF");
          }

          const fileUrl = await getFile({
            type: storageType,
            data: fileKey,
            isDownload: true,
          });

          const response = await fetch(fileUrl, {
            headers: { Accept: "application/pdf" },
          });
          if (!response.ok) {
            throw new Error("Failed to fetch agreement PDF");
          }
          const pdfBuffer = await response.arrayBuffer();
          basePdfDoc = await PDFDocument.load(pdfBuffer);
        }
      } catch (error) {
        // If fetching fails, create a simple PDF with agreement name
        basePdfDoc = await PDFDocument.create();
        const agreementPage = basePdfDoc.addPage([612, 792]);
        const { width: pageWidth, height: pageHeight } = agreementPage.getSize();

        const helveticaBoldFont = await basePdfDoc.embedFont(
          StandardFonts.HelveticaBold,
        );
        const darkGray = rgb(0.2, 0.2, 0.2);

        const titleText = agreement.name;
        const titleFontSize = 20;
        const titleWidth = helveticaBoldFont.widthOfTextAtSize(
          titleText,
          titleFontSize,
        );
        agreementPage.drawText(titleText, {
          x: (pageWidth - titleWidth) / 2,
          y: pageHeight - 100,
          size: titleFontSize,
          font: helveticaBoldFont,
          color: darkGray,
        });

        // Add note about agreement
        const helveticaFont = await basePdfDoc.embedFont(StandardFonts.Helvetica);
        const noteText = "Agreement document reference:";
        const noteWidth = helveticaFont.widthOfTextAtSize(noteText, 12);
        agreementPage.drawText(noteText, {
          x: (pageWidth - noteWidth) / 2,
          y: pageHeight - 150,
          size: 12,
          font: helveticaFont,
          color: rgb(0.5, 0.5, 0.5),
        });

        const urlText = agreement.content;
        const urlWidth = helveticaFont.widthOfTextAtSize(urlText, 10);
        agreementPage.drawText(urlText, {
          x: (pageWidth - urlWidth) / 2,
          y: pageHeight - 180,
          size: 10,
          font: helveticaFont,
          color: rgb(0.5, 0.5, 0.5),
        });
      }
    }

    // Now create the certificate page and append it
    const certificatePage = basePdfDoc.addPage([612, 792]);
    const { width, height } = certificatePage.getSize();

    // Embed fonts for certificate (reuse if already embedded, or embed new ones)
    const helveticaFont = await basePdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await basePdfDoc.embedFont(
      StandardFonts.HelveticaBold,
    );

    // Colors matching the UI design - slate colors
    const slate900 = rgb(0.15, 0.18, 0.22); // Dark slate for main text
    const slate600 = rgb(0.48, 0.55, 0.64); // Medium slate
    const slate500 = rgb(0.65, 0.71, 0.78); // Light slate for labels
    const slate200 = rgb(0.93, 0.94, 0.96); // Very light slate for borders
    const slate300 = rgb(0.85, 0.88, 0.92); // Light slate for separators

    const marginX = 72; // 1 inch margin

    // Header section - matching second image design (clean top, no gradient line)
    const headerTopY = height - 60;
    const headerBottomY = headerTopY - 100;

    // "COMPLIANCE CERTIFICATE" label (uppercase, small, lighter gray, more spacing)
    const complianceLabel = "COMPLIANCE CERTIFICATE";
    certificatePage.drawText(complianceLabel, {
      x: marginX,
      y: headerTopY - 12,
      size: 8.5,
      font: helveticaBoldFont,
      color: slate500,
    });

    // "NDA Completion" title (large, bold, more spacing from label)
    const titleText = "NDA Signing Certificate";
    certificatePage.drawText(titleText, {
      x: marginX,
      y: headerTopY - 50,
      size: 26,
      font: helveticaBoldFont,
      color: slate900,
    });

    // Certificate ID on the right (matching second image layout)
    const certificateId = `NDA-${view.id.slice(0, 8).toUpperCase()}`;
    const certIdLabel = "Certificate ID";
    const certIdLabelWidth = helveticaBoldFont.widthOfTextAtSize(certIdLabel, 8.5);
    certificatePage.drawText(certIdLabel, {
      x: width - marginX - certIdLabelWidth,
      y: headerTopY - 12,
      size: 8.5,
      font: helveticaBoldFont,
      color: slate500,
    });
    const certIdWidth = helveticaBoldFont.widthOfTextAtSize(certificateId, 12);
    certificatePage.drawText(certificateId, {
      x: width - marginX - certIdWidth,
      y: headerTopY - 50,
      size: 12,
      font: helveticaBoldFont,
      color: slate900,
    });

    // Header bottom border (horizontal line separator)
    certificatePage.drawLine({
      start: { x: marginX, y: headerBottomY },
      end: { x: width - marginX, y: headerBottomY },
      thickness: 1.5,
      color: slate200,
    });

    // Main content area - Recipient section (matching second image)
    const recipientSectionY = headerBottomY - 50;
    
    // "RECIPIENT" label (uppercase, small, lighter gray)
    const recipientLabel = "RECIPIENT";
    certificatePage.drawText(recipientLabel, {
      x: marginX,
      y: recipientSectionY,
      size: 8.5,
      font: helveticaBoldFont,
      color: slate500,
    });

    // Recipient name (large, bold, more spacing)
    const recipientName =
      view.viewerName || view.viewerEmail?.split("@")[0] || "Anonymous";
    certificatePage.drawText(recipientName, {
      x: marginX,
      y: recipientSectionY - 35,
      size: 20,
      font: helveticaBoldFont,
      color: slate900,
    });

    // Recipient email (regular weight, medium gray)
    const recipientEmail = view.viewerEmail || "Not provided";
    certificatePage.drawText(recipientEmail, {
      x: marginX,
      y: recipientSectionY - 55,
      size: 11,
      font: helveticaFont,
      color: slate600,
    });

    // Recipient section bottom border (horizontal line separator)
    const recipientBorderY = recipientSectionY - 85;
    certificatePage.drawLine({
      start: { x: marginX, y: recipientBorderY },
      end: { x: width - marginX, y: recipientBorderY },
      thickness: 1.5,
      color: slate200,
    });

    // Details Grid - Two columns (matching second image spacing)
    const detailsStartY = recipientBorderY - 50;
    const col1X = marginX;
    const col2X = width / 2 + 40; // Center split with gap
    const colSpacing = 50; // Vertical spacing between items (consistent for all)

    // Left Column - Authentication Level, Location, Device Type
    let currentY = detailsStartY;
    
    // Authentication Level
    const authLabel = "AUTHENTICATION LEVEL";
    certificatePage.drawText(authLabel, {
      x: col1X,
      y: currentY,
      size: 8.5,
      font: helveticaBoldFont,
      color: slate500,
    });
    certificatePage.drawText("Email", {
      x: col1X,
      y: currentY - 20,
      size: 10.5,
      font: helveticaFont,
      color: slate900,
    });

    currentY -= colSpacing;
    // Location
    const locationLabel = "LOCATION";
    certificatePage.drawText(locationLabel, {
      x: col1X,
      y: currentY,
      size: 8.5,
      font: helveticaBoldFont,
      color: slate500,
    });
    certificatePage.drawText(locationText, {
      x: col1X,
      y: currentY - 20,
      size: 10.5,
      font: helveticaFont,
      color: slate900,
    });

    currentY -= colSpacing;
    // Device Type (no separator line)
    const deviceLabel = "DEVICE TYPE";
    certificatePage.drawText(deviceLabel, {
      x: col1X,
      y: currentY,
      size: 8.5,
      font: helveticaBoldFont,
      color: slate500,
    });
    certificatePage.drawText(deviceType, {
      x: col1X,
      y: currentY - 20,
      size: 10.5,
      font: helveticaFont,
      color: slate900,
    });


    // Right Column - Viewed, Completed, System
    currentY = detailsStartY;
    
    // Viewed
    const viewedLabel = "VIEWED";
    const viewedDate = view.viewedAt
      ? format(new Date(view.viewedAt), "yyyy-MM-dd h:mm a '(UTC)'")
      : "Not available";
    certificatePage.drawText(viewedLabel, {
      x: col2X,
      y: currentY,
      size: 8.5,
      font: helveticaBoldFont,
      color: slate500,
    });
    certificatePage.drawText(viewedDate, {
      x: col2X,
      y: currentY - 20,
      size: 10,
      font: helveticaFont,
      color: slate900,
    });

    currentY -= colSpacing;
    // Completed
    const completedLabel = "COMPLETED";
    const completedDate = format(
      new Date(view.agreementResponse.createdAt),
      "yyyy-MM-dd h:mm a '(UTC)'",
    );
    certificatePage.drawText(completedLabel, {
      x: col2X,
      y: currentY,
      size: 8.5,
      font: helveticaBoldFont,
      color: slate500,
    });
    certificatePage.drawText(completedDate, {
      x: col2X,
      y: currentY - 20,
      size: 10,
      font: helveticaFont,
      color: slate900,
    });

    currentY -= colSpacing;
    // System (no separator line)
    const systemLabel = "SYSTEM";
    const systemInfo = `${userAgentData.os || "Unknown"} - ${userAgentData.browser || "Unknown"}`;
    certificatePage.drawText(systemLabel, {
      x: col2X,
      y: currentY,
      size: 8.5,
      font: helveticaBoldFont,
      color: slate500,
    });
    certificatePage.drawText(systemInfo, {
      x: col2X,
      y: currentY - 20,
      size: 10,
      font: helveticaFont,
      color: slate900,
    });

    // Footer section with border top (matching second image)
    const footerY = 70;
    const footerBorderY = footerY + 25;
    
    // Footer top border
    certificatePage.drawLine({
      start: { x: marginX, y: footerBorderY },
      end: { x: width - marginX, y: footerBorderY },
      thickness: 1.5,
      color: slate200,
    });

    // "Issued by" on left (matching second image style)
    if (view.team.name) {
      const issuedByPrefix = "Issued by: ";
      const prefixWidth = helveticaFont.widthOfTextAtSize(issuedByPrefix, 9);
      certificatePage.drawText(issuedByPrefix, {
        x: marginX,
        y: footerY,
        size: 9,
        font: helveticaFont,
        color: slate600,
      });
      // Team name in bold
      certificatePage.drawText(view.team.name, {
        x: marginX + prefixWidth,
        y: footerY,
        size: 9,
        font: helveticaBoldFont,
        color: slate900,
      });
    }

    // "NDA Certificate • Year" on right (matching second image)
    const currentYear = new Date().getFullYear();
    const footerRightText = `NDA Certificate • ${currentYear}`;
    const footerRightWidth = helveticaBoldFont.widthOfTextAtSize(footerRightText, 9);
    certificatePage.drawText(footerRightText, {
      x: width - marginX - footerRightWidth,
      y: footerY,
      size: 9,
      font: helveticaBoldFont,
      color: slate600,
    });

    // Generate PDF bytes with agreement + certificate
    const pdfBytes = await basePdfDoc.save({
      useObjectStreams: false, // Better compatibility
      addDefaultPage: false, // Don't add default page
    });

    // Convert to Buffer for proper binary encoding
    const pdfBuffer = Buffer.from(pdfBytes);

    // Set response headers
    const fileName = `NDA-Certificate-${recipientName.replace(/[^a-z0-9]/gi, "-")}-${Date.now()}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`,
    );
    res.setHeader("Content-Length", pdfBuffer.length);
    res.setHeader("Cache-Control", "no-cache");

    return res.status(200).send(pdfBuffer);
  } catch (error) {
    log({
      message: `Failed to generate NDA certificate for view: ${viewId}. \n\n ${error} \n\n*Metadata*: \`{userId: ${userId}}\``,
      type: "error",
    });
    errorhandler(error, res);
  }
}

