import { InstalledIntegration } from "@prisma/client";

export type SlackCredential = {
  appId: string;
  botUserId: string;
  scope: string;
  accessToken: string;
  tokenType: string;
  authUser: { id: string };
  team: { id: string; name: string };
};

export type SlackCredentialPublic = {
  team: { id: string; name: string };
};

export type SlackConfiguration = {
  enabledChannels: Record<string, SlackChannelConfig>;
};

// from lib/types/slack.ts
export interface SlackChannel {
  id: string;
  name: string;
  is_archived: boolean;
  is_private: boolean;
  is_member?: boolean;
}

export type SlackIntegration = Omit<
  InstalledIntegration,
  "credentials" | "configuration"
> & {
  credentials: SlackCredentialPublic;
  configuration: SlackConfiguration | null;
};

export type SlackIntegrationServer = Omit<
  InstalledIntegration,
  "credentials" | "configuration"
> & {
  credentials: SlackCredential;
  configuration: SlackConfiguration | null;
};

export interface SlackMessage {
  channel?: string;
  text?: string;
  blocks?: any[];
  thread_ts?: string;
  unfurl_links?: boolean;
  unfurl_media?: boolean;
}

export interface SlackEventData {
  teamId: string;
  eventType: SlackNotificationType;
  documentId?: string;
  dataroomId?: string;
  viewId?: string;
  linkId?: string;
  viewerEmail?: string;
  viewerId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export type SlackNotificationType =
  | "document_view"
  | "dataroom_access"
  | "document_download";

export interface SlackChannelConfig {
  id: string;
  name: string;
  enabled: boolean;
  notificationTypes: SlackNotificationType[];
}
