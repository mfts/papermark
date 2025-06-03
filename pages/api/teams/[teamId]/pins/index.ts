import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { errorhandler } from "@/lib/errorHandler";
import prisma from "@/lib/prisma";
import { CustomUser } from "@/lib/types";

import { authOptions } from "../../../auth/[...nextauth]";

export const createPinBodySchema = z.object({
    pinType: z.enum(["DOCUMENT", "FOLDER", "DATAROOM", "DATAROOM_DOCUMENT", "DATAROOM_FOLDER"]).describe("The type of the item"),
    documentId: z.string().optional().describe("The ID of the document to pin"),
    folderId: z.string().optional().describe("The ID of the folder to pin"),
    dataroomId: z.string().optional().describe("The ID of the dataroom to pin"),
    dataroomDocumentId: z.string().optional().describe("The ID of the dataroom document to pin"),
    dataroomFolderId: z.string().optional().describe("The ID of the dataroom folder to pin"),
    name: z.string().min(1).max(100).describe("The name of the pinned item"),
}).refine(data => {
    // Only check for the required field based on pin type
    switch (data.pinType) {
        case "DOCUMENT":
            return !!data.documentId;
        case "FOLDER":
            return !!data.folderId;
        case "DATAROOM":
            return !!data.dataroomId;
        case "DATAROOM_DOCUMENT":
            return !!data.dataroomDocumentId;
        case "DATAROOM_FOLDER":
            return !!data.dataroomFolderId && !!data.dataroomId;
        default:
            return false;
    }
}, {
    message: "Must provide the ID field matching the pinType"
});

export const reorderPinsBodySchema = z.object({
    pins: z.array(z.object({
        id: z.string().min(1).describe("The ID of the pin to reorder"),
    })).min(1).describe("Array of pins with their IDs for reordering"),
});

export default async function handle(
    req: NextApiRequest,
    res: NextApiResponse,
) {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const user = session.user as CustomUser;
    const teamId = req.query.teamId as string;

    try {
        // Verify user has access to the team
        const userTeam = await prisma.userTeam.findUnique({
            where: {
                userId_teamId: {
                    userId: user.id,
                    teamId: teamId,
                },
            },
        });

        if (!userTeam) {
            return res.status(403).json({ message: "Forbidden" });
        }

        if (req.method === "GET") {
            // Get all pins for the team
            const pins = await prisma.pin.findMany({
                where: {
                    teamId: teamId,
                },
                orderBy: {
                    orderIndex: "asc",
                },
                select: {
                    id: true,
                    pinType: true,
                    documentId: true,
                    folderId: true,
                    dataroomId: true,
                    dataroomDocumentId: true,
                    dataroomFolderId: true,
                    orderIndex: true,
                    document: {
                        select: { name: true }
                    },
                    folder: {
                        select: { name: true, path: true }
                    },
                    dataroom: {
                        select: { name: true }
                    },
                    dataroomDocument: {
                        select: {
                            document: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    },
                    dataroomFolder: {
                        select: {
                            name: true,
                            path: true,
                            dataroomId: true
                        }
                    }
                }
            });

            // Transform the data to include the name from the related entity
            const transformedPins = pins.map(pin => ({
                id: pin.id,
                pinType: pin.pinType,
                documentId: pin.documentId || (pin.pinType === "DATAROOM_DOCUMENT" && pin.dataroomDocument?.document ? pin.dataroomDocument.document.id : undefined),
                folderId: pin.folderId,
                dataroomId: pin.dataroomId || (pin.pinType === "DATAROOM_FOLDER" ? pin.dataroomFolder?.dataroomId : undefined),
                dataroomDocumentId: pin.dataroomDocumentId,
                dataroomFolderId: pin.dataroomFolderId,
                name: pin.document?.name ||
                    pin.folder?.name ||
                    pin.dataroom?.name ||
                    pin.dataroomDocument?.document?.name ||
                    pin.dataroomFolder?.name ||
                    "Unknown",
                path: pin.folder?.path || pin.dataroomFolder?.path || undefined,
                orderIndex: pin.orderIndex,
            }));

            return res.status(200).json(transformedPins);

        } else if (req.method === "POST") {
            // Create a new pin
            const validatedData = createPinBodySchema.parse(req.body);

            // Check if pin already exists based on the type
            const existingPin = await prisma.pin.findFirst({
                where: {
                    teamId: teamId,
                    AND: [
                        { pinType: validatedData.pinType },
                        validatedData.documentId ? { documentId: validatedData.documentId } : {},
                        validatedData.folderId ? { folderId: validatedData.folderId } : {},
                        validatedData.dataroomId ? { dataroomId: validatedData.dataroomId } : {},
                        validatedData.dataroomDocumentId ? { dataroomDocumentId: validatedData.dataroomDocumentId } : {},
                        validatedData.dataroomFolderId ? { dataroomFolderId: validatedData.dataroomFolderId } : {}
                    ].filter(condition => Object.keys(condition).length > 0)
                },
            });

            if (existingPin) {
                return res.status(400).json({
                    error: "This item is already pinned.",
                });
            }

            // Verify the folder exists and belongs to the dataroom if it's a dataroom folder
            if (validatedData.pinType === "DATAROOM_FOLDER") {
                const folder = await prisma.dataroomFolder.findUnique({
                    where: {
                        id: validatedData.dataroomFolderId,
                        dataroomId: validatedData.dataroomId
                    }
                });

                if (!folder) {
                    return res.status(404).json({
                        error: "Dataroom folder not found.",
                    });
                }
            }

            const newPin = await prisma.pin.create({
                data: {
                    pinType: validatedData.pinType,
                    documentId: validatedData.pinType === "DOCUMENT" ? validatedData.documentId :
                        validatedData.pinType === "DATAROOM_DOCUMENT" ? validatedData.documentId : null,
                    folderId: validatedData.pinType === "FOLDER" ? validatedData.folderId : null,
                    dataroomId: validatedData.pinType === "DATAROOM" ? validatedData.dataroomId : null,
                    dataroomDocumentId: validatedData.pinType === "DATAROOM_DOCUMENT" ? validatedData.dataroomDocumentId : null,
                    dataroomFolderId: validatedData.pinType === "DATAROOM_FOLDER" ? validatedData.dataroomFolderId : null,
                    teamId: teamId,
                    orderIndex: await getNextOrderIndex(teamId),
                },
                select: {
                    id: true,
                    pinType: true,
                    documentId: true,
                    folderId: true,
                    dataroomId: true,
                    dataroomDocumentId: true,
                    dataroomFolderId: true,
                    orderIndex: true,
                    document: {
                        select: { name: true }
                    },
                    folder: {
                        select: { name: true, path: true }
                    },
                    dataroom: {
                        select: { name: true }
                    },
                    dataroomDocument: {
                        select: {
                            document: {
                                select: {
                                    id: true,
                                    name: true
                                }
                            }
                        }
                    },
                    dataroomFolder: {
                        select: {
                            name: true,
                            path: true,
                            dataroomId: true
                        }
                    }
                }
            });

            // Transform the response to include the name
            const response = {
                id: newPin.id,
                pinType: newPin.pinType,
                documentId: newPin.documentId || (newPin.pinType === "DATAROOM_DOCUMENT" && newPin.dataroomDocument?.document ? newPin.dataroomDocument.document.id : undefined),
                folderId: newPin.folderId,
                dataroomId: newPin.dataroomId || (newPin.pinType === "DATAROOM_FOLDER" ? newPin.dataroomFolder?.dataroomId : undefined),
                dataroomDocumentId: newPin.dataroomDocumentId,
                dataroomFolderId: newPin.dataroomFolderId,
                name: newPin.document?.name ||
                    newPin.folder?.name ||
                    newPin.dataroom?.name ||
                    newPin.dataroomDocument?.document?.name ||
                    newPin.dataroomFolder?.name ||
                    "Unknown",
                path: newPin.folder?.path || newPin.dataroomFolder?.path || undefined,
                orderIndex: newPin.orderIndex,
            };

            return res.status(200).json(response);

        } else if (req.method === "PUT") {
            // Reorder pins
            const validatedData = reorderPinsBodySchema.parse(req.body);
            const { pins } = validatedData;
            const existingPins = await prisma.pin.findMany({
                where: {
                    id: { in: pins.map(pin => pin.id) },
                    teamId: teamId,
                },
                select: { id: true },
            });

            if (existingPins.length !== pins.length) {
                return res.status(400).json({
                    error: "One or more pins not found or do not belong to this team.",
                });
            }

            // Update each pin's order
            await Promise.all(
                pins.map((pin: any, index: number) =>
                    prisma.pin.update({
                        where: { id: pin.id },
                        data: { orderIndex: index },
                    })
                )
            );

            return res.status(200).json({ message: "Pins reordered successfully" });
        }

        return res.status(405).json({ message: "Method not allowed" });
    } catch (error) {
        return errorhandler(error, res);
    }
}

async function getNextOrderIndex(teamId: string): Promise<number> {
    const lastPin = await prisma.pin.findFirst({
        where: { teamId },
        orderBy: { orderIndex: "desc" },
    });
    return lastPin ? lastPin.orderIndex + 1 : 0;
} 