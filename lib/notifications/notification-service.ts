import { Notification } from "@prisma/client";

const subscriptions: {
  [key: string]: any[];
} = {};

interface ISubscribeToNotification {
  userId: string;
  sendNotification: CallableFunction;
}

// subscribe a user to notifications
export function subscribeToNotification({
  userId,
  sendNotification,
}: ISubscribeToNotification) {
  if (!subscriptions[userId]) {
    subscriptions[userId] = [];
  }

  subscriptions[userId].push(sendNotification);
}

// unsubscribe a user to notifications
export function unsubscribeToNotification({
  userId,
  sendNotification,
}: ISubscribeToNotification) {
  if (subscriptions[userId]) {
    subscriptions[userId] = subscriptions[userId].filter(
      (cb) => cb !== sendNotification
    );
    if (subscriptions[userId].length === 0) {
      delete subscriptions[userId];
    }
  }
}

interface INotifySubscriber {
  notification: Notification;
}
export function notifySubscriber({ notification }: INotifySubscriber) {
  const userId = notification.receiverId;
  if (subscriptions[userId]) {
    subscriptions[userId].forEach((sendNotification) =>
      sendNotification(notification)
    );
  }
}
