export interface SlackChannel {
    id: string;
    name: string;
    is_archived: boolean;
    is_private: boolean;
    is_member?: boolean;
}

export interface SlackIntegration {
    id: string;
    workspaceId: string;
    workspaceName: string;
    workspaceUrl: string;
    botUserId: string;
    botUsername: string;
    enabled: boolean;
    notificationTypes: {
        document_view: boolean;
        dataroom_access: boolean;
        document_download: boolean;
    };
    defaultChannel?: string;
    enabledChannels: Record<string, SlackChannelConfig>;
    createdAt: string;
    updatedAt: string;
}

// API Request Types
export interface UpdateSlackIntegrationRequest {
    enabled?: boolean;
    notificationTypes?: SlackIntegration['notificationTypes'];
    defaultChannel?: string;
    enabledChannels?: Record<string, SlackChannelConfig>;
}

// API Response Types
export interface SlackChannelsResponse {
    channels: SlackChannel[];
}

export interface SlackIntegrationResponse extends SlackIntegration { } 

export interface SlackWorkspaceInfo {
    id: string;
    name: string;
    url: string;
    domain: string;
}

export interface SlackOAuthResponse {
    ok: boolean;
    access_token: string;
    token_type: string;
    scope: string;
    bot_user_id: string;
    team: {
        name: string;
        id: string;
    };
    enterprise?: {
        name: string;
        id: string;
    };
    authed_user: {
        id: string;
        scope: string;
        access_token: string;
        token_type: string;
    };
}

export interface SlackMessage {
    channel?: string;
    text?: string;
    blocks?: any[];
    thread_ts?: string;
    unfurl_links?: boolean;
    unfurl_media?: boolean;
}

export type SlackNotificationType = 'document_view' | 'dataroom_access' | 'document_download';

export interface SlackChannelConfig {
    id: string;
    name: string;
    enabled: boolean;
    notificationTypes: SlackNotificationType[];
}