export interface SlackWorkspaceInfo {
    id: string;
    name: string;
    url: string;
    domain: string;
}

export interface SlackBotInfo {
    id: string;
    name: string;
    team_id: string;
}

export interface SlackChannel {
    id: string;
    name: string;
    is_private: boolean;
    is_archived: boolean;
    is_member?: boolean;
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
    channel: string;
    text?: string;
    blocks?: any[];
    thread_ts?: string;
    unfurl_links?: boolean;
    unfurl_media?: boolean;
}

export interface SlackNotificationConfig {
    document_view: boolean;
    dataroom_access: boolean;
    document_download: boolean;
    document_reaction: boolean;
}

export interface SlackChannelConfig {
    id: string;
    name: string;
    enabled: boolean;
    notificationTypes: string[];
}

export type NotificationFrequency = 'instant' | 'daily' | 'weekly';

export interface SlackIntegrationConfig {
    enabled: boolean;
    notificationTypes: SlackNotificationConfig;
    frequency: NotificationFrequency;
    timezone: string;
    dailyTime?: string; // "10:00"
    weeklyDay?: string; // "monday"
    defaultChannel?: string;
    enabledChannels: Record<string, SlackChannelConfig>;
} 