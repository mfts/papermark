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
  userId: string;
  notification: string;
}
export function notifySubscriber({ userId, notification }: INotifySubscriber) {
  if (subscriptions[userId]) {
    subscriptions[userId].forEach((sendNotification) =>
      sendNotification(notification)
    );
  }
}
