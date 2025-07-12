import type { NextApiResponse } from "next";

import {
  AuthenticatedRequest,
  createTeamHandler,
} from "@/lib/middleware/api-auth";
import prisma from "@/lib/prisma";

type OrderItem = {
  id: string;
  category: "folder" | "document";
  orderIndex: number;
};

export default createTeamHandler({
  POST: async (req: AuthenticatedRequest, res: NextApiResponse) => {
    const { id: dataroomId } = req.query as { teamId: string; id: string };
    const newOrder: OrderItem[] = req.body;

    if (
      !Array.isArray(newOrder) ||
      !dataroomId ||
      typeof dataroomId !== "string"
    ) {
      return res.status(400).json({ message: "Invalid input" });
    }

    try {
      await prisma.$transaction(async (prisma) => {
        for (const item of newOrder) {
          if (item.category === "folder") {
            await prisma.dataroomFolder.update({
              where: { id: item.id },
              data: { orderIndex: item.orderIndex },
            });
          } else {
            await prisma.dataroomDocument.update({
              where: { id: item.id },
              data: { orderIndex: item.orderIndex },
            });
          }
        }
      });

      res.status(200).json({ message: "Order updated successfully" });
      return;
    } catch (error) {
      console.error("Error updating order:", error);
      res.status(500).json({ message: "Error updating order" });
    }
  },
});
