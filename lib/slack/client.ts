import { SlackOAuthResponse, SlackChannel, SlackMessage, SlackWorkspaceInfo } from './types';

export class SlackClient {
    private clientId: string;
    private clientSecret: string;
    private baseUrl = 'https://slack.com/api';
    private oauthUrl = 'https://slack.com/oauth/v2/authorize';

    constructor() {
        this.clientId = process.env.SLACK_CLIENT_ID!;
        this.clientSecret = process.env.SLACK_CLIENT_SECRET!;

        if (!this.clientId || !this.clientSecret) {
            throw new Error('SLACK_CLIENT_ID and SLACK_CLIENT_SECRET must be set');
        }
    }

    /**
     * Get OAuth URL for Slack app installation
     */
    getOAuthUrl(state: string, redirectUri: string): string {
        const params = new URLSearchParams({
            client_id: this.clientId,
            scope: 'channels:read,groups:read,mpim:read,im:read,chat:write,chat:write.public,team:read,users:read,users:read.email',
            redirect_uri: redirectUri,
            state: state,
        });

        // Point at the correct OAuth authorization endpoint:
        const oauthUrl = `${this.oauthUrl}?${params.toString()}`;

        // Debug logging
        console.log('SlackClient: Generated OAuth URL:', oauthUrl);
        console.log('SlackClient: Client ID:', this.clientId);
        console.log('SlackClient: Redirect URI:', redirectUri);
        console.log('SlackClient: State:', state);

        return oauthUrl;
    }

    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(code: string, redirectUri: string): Promise<SlackOAuthResponse> {
        const response = await fetch(`${this.baseUrl}/oauth.v2.access`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                code: code,
                redirect_uri: redirectUri,
            }),
        });

        if (!response.ok) {
            throw new Error(`Slack OAuth failed: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.ok) {
            throw new Error(`Slack OAuth error: ${data.error}`);
        }

        return data;
    }

    /**
     * Get workspace information
     */
    async getWorkspaceInfo(accessToken: string): Promise<SlackWorkspaceInfo> {
        const response = await fetch(`${this.baseUrl}/team.info`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get workspace info: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.ok) {
            throw new Error(`Slack API error: ${data.error}`);
        }

        return {
            id: data.team.id,
            name: data.team.name,
            url: data.team.url,
            domain: data.team.domain,
        };
    }

    /**
     * Get bot information
     */
    async getBotInfo(accessToken: string): Promise<{ id: string; name: string }> {
        const response = await fetch(`${this.baseUrl}/auth.test`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Failed to get bot info: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.ok) {
            throw new Error(`Slack API error: ${data.error}`);
        }

        return {
            id: data.bot_id,
            name: data.user,
        };
    }

    /**
     * Get list of channels
     */
    async getChannels(accessToken: string): Promise<SlackChannel[]> {
        try {
            const response = await fetch(`${this.baseUrl}/conversations.list?types=public_channel,private_channel`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`Failed to get channels: ${response.statusText}`);
            }

            const data = await response.json();

            if (!data.ok) {
                throw new Error(`Slack API error: ${data.error}`);
            }

            return data.channels.map((channel: any) => ({
                id: channel.id,
                name: channel.name,
                is_private: channel.is_private,
                is_archived: channel.is_archived,
                is_member: channel.is_member,
            }));
        } catch (error) {
            console.error('SlackClient.getChannels error:', error);
            console.error('Access token (first 10 chars):', accessToken ? accessToken.substring(0, 10) + '...' : 'undefined');
            throw error;
        }
    }

    /**
     * Send message to Slack channel
     */
    async sendMessage(accessToken: string, message: SlackMessage): Promise<{ ok: boolean; ts?: string; error?: string }> {
        const response = await fetch(`${this.baseUrl}/chat.postMessage`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(message),
        });

        if (!response.ok) {
            throw new Error(`Failed to send message: ${response.statusText}`);
        }

        const data = await response.json();

        if (!data.ok) {
            return {
                ok: false,
                error: data.error,
            };
        }

        return {
            ok: true,
            ts: data.ts,
        };
    }
}

// Export singleton instance
export const slackClient = new SlackClient(); 