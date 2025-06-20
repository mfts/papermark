import { NextRequest, NextResponse } from "next/server";
import { log } from "@/lib/utils";
import prisma from "@/lib/prisma";
import { sendAccessRequestNotification } from "@/lib/emails/send-access-request-notification";
import { ratelimit } from "@/lib/redis";
import { waitUntil } from "@vercel/functions";

export async function POST(request: NextRequest) {
    try {
        const { linkId, email, message } = await request.json();
        if (!linkId || !email) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        const { success } = await ratelimit(5, "1 m").limit(`access-request:${email}`);
        console.log("success", success);
        if (!success) {
            return NextResponse.json(
                { message: "Too many requests. Please try again later." },
                { status: 429 }
            );
        }

        // Find the link and team
        const link = await prisma.link.findUnique({
            where: { id: linkId },
            select: {
                id: true,
                name: true,
                linkType: true,
                slug: true,
                allowList: true,
                denyList: true,
                teamId: true,
                documentId: true,
                dataroomId: true,
                team: {
                    select: {
                        name: true,
                        users: {
                            where: { role: { in: ["ADMIN", "MANAGER"] } },
                            select: {
                                user: {
                                    select: {
                                        email: true,
                                        name: true,
                                    }
                                }
                            }
                        }
                    }
                },
                document: {
                    select: {
                        name: true,
                    }
                },
                dataroom: {
                    select: {
                        name: true,
                    }
                }
            }
        });

        if (!link) {
            return NextResponse.json(
                { message: "Link not found" },
                { status: 404 }
            );
        }

        // Check if email is in allow list (shouldn't be, but double check)
        if (link.allowList && link.allowList.length > 0) {
            const emailDomain = email.substring(email.lastIndexOf("@"));
            const isAllowed = link.allowList.some((allowed) => {
                return (
                    allowed === email ||
                    (allowed.startsWith("@") && emailDomain === allowed)
                );
            });

            if (isAllowed) {
                return NextResponse.json(
                    { message: "Email is already authorized" },
                    { status: 400 }
                );
            }
        }

        // Check if email is in deny list for metadata tracking
        let isFromDenyList = false;
        if (link.denyList && link.denyList.length > 0) {
            const emailDomain = email.substring(email.lastIndexOf("@"));
            isFromDenyList = link.denyList.some((denied) => {
                return (
                    denied === email ||
                    (denied.startsWith("@") && emailDomain === denied)
                );
            });
        }

        // Create access request record
        await prisma.accessRequest.create({
            data: {
                email,
                message: message || null,
                linkId,
                teamId: link.teamId!,
                requestedAt: new Date(),
            }
        });


        const contentName = link.linkType === "DOCUMENT_LINK"
            ? link.document?.name || link.name || "Document"
            : link.dataroom?.name || link.name || "Dataroom";

        const contentType = link.linkType === "DOCUMENT_LINK" ? "document" : "dataroom";
        const linkName = link.name || contentName;

        // Send email to team admins and managers in background
        const adminEmails = link.team?.users?.map(user => user.user.email).filter(Boolean) || [];

        waitUntil(
            Promise.all(adminEmails.map(async (adminEmail) => {
                try {
                    await sendAccessRequestNotification({
                        to: adminEmail!,
                        requesterEmail: email,
                        contentName,
                        linkName,
                        message: message || undefined,
                        linkId: link.id,
                        contentType,
                    });
                } catch (error) {
                    console.error(`Failed to send access request email to ${adminEmail}:`, error);
                }
            }))
        );

        return NextResponse.json({
            message: "Access request sent successfully. You will be notified when access is granted.",
            success: true,
        });

    } catch (error) {
        await log({
            message: `Failed to process access request: ${error}`,
            type: "error",
        });

        return NextResponse.json(
            { message: "Internal server error" },
            { status: 500 }
        );
    }
} 