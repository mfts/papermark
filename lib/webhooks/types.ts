import { Event, Link } from "@prisma/client";

export interface LinkViewedData {
  receiverId: string;
  receiverEmail: string;
  receiverName: string;
  teamId: string;
  teamName: string;
  documentId: string;
  documentName: string;
  documentOwner: string;
  viewerEmail: string;
  link: {
    id: string;
    enableNotification: boolean;
  };
  viewId: string;
}

type EventType = Event;

export type EventData = LinkViewedData;

export interface IWebhookTrigger {
  eventType: EventType;
  eventData: EventData;
}
