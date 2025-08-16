export interface SlackChannel {
    id: string;
    name: string;
    is_archived: boolean;
    is_private: boolean;
}

export interface SlackChannelConfig {
    id: string;
    name: string;
    enabled: boolean;
    notificationTypes: string[];
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
        document_reaction: boolean;
    };
    frequency: "instant" | "daily" | "weekly";
    timezone: string;
    dailyTime?: string;
    weeklyDay?: string;
    defaultChannel?: string;
    enabledChannels: Record<string, SlackChannelConfig>;
    createdAt: string;
    updatedAt: string;
}

// API Request Types
export interface UpdateSlackIntegrationRequest {
    enabled?: boolean;
    notificationTypes?: SlackIntegration['notificationTypes'];
    frequency?: SlackIntegration['frequency'];
    timezone?: string;
    dailyTime?: string;
    weeklyDay?: string;
    defaultChannel?: string;
    enabledChannels?: Record<string, SlackChannelConfig>;
}

// API Response Types
export interface SlackChannelsResponse {
    channels: SlackChannel[];
}

export interface SlackIntegrationResponse extends SlackIntegration { } 