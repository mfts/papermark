import prisma from "@/lib/prisma";
import { NotificationType } from "@prisma/client";

interface ICreateNotification {
  userId: string;
  type: NotificationType;
  message: string;
}

export async function createNotification({
  userId,
  type,
  message,
}: ICreateNotification) {
  await prisma.notification.create({
    data: {
      userId,
      type,
      message,
    },
  });
}
