import prisma from "@/lib/prisma";

export async function setVersionAsPrimary(documentId: string, versionId: string) {
    return await prisma.$transaction([
        prisma.documentVersion.updateMany({
            where: {
                documentId: documentId,
                id: { not: versionId },
            },
            data: {
                isPrimary: false,
            },
        }),
        prisma.documentVersion.update({
            where: {
                id: versionId,
            },
            data: {
                isPrimary: true,
            },
        }),
    ]);
} 