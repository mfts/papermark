import { Event } from "@prisma/client";

export interface DocumentViewdData {
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  teamId: string;
  teamName: string;
  documentId: string;
  documentName: string;
  viewerEmail: string;
  link: {
    id: string;
    enableNotification: boolean;
  };
  viewId: string;
}

export interface DocumentUploadedData {
  ownerId: string;
  ownerEmail: string;
  ownerName: string;
  teamId: string;
  teamName: string;
  documentId: string;
  documentName: string;
  numPages: number;
  type: string;
  fileUrl: string;
}

export interface DocumentDeletedData extends DocumentUploadedData {}

type EventType = Event;

export type EventData = DocumentViewdData | DocumentUploadedData;

export interface IWebhookTrigger {
  eventType: EventType;
  eventData: EventData;
}
