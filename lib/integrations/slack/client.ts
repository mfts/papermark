import {
  SlackChannel,
  SlackMessage,
  // SlackOAuthResponse,
  // SlackWorkspaceInfo,
} from "@/lib/integrations/slack/types";
import { decryptSlackToken } from "@/lib/integrations/slack/utils";

export class SlackClient {
  private clientId: string;
  private clientSecret: string;
  private baseUrl = "https://slack.com/api";
  // private oauthUrl = "https://slack.com/oauth/v2/authorize";

  constructor() {
    this.clientId = process.env.SLACK_CLIENT_ID as string;
    this.clientSecret = process.env.SLACK_CLIENT_SECRET as string;

    if (!this.clientId || !this.clientSecret) {
      throw new Error("SLACK_CLIENT_ID and SLACK_CLIENT_SECRET must be set");
    }
  }

  // private decryptToken(accessToken: string): string {
  //   return decryptSlackToken(accessToken);
  // }

  /**
   * Get OAuth URL for Slack app installation
   */
  // getOAuthUrl(state: string, redirectUri: string): string {
  //   const params = new URLSearchParams({
  //     client_id: this.clientId,
  //     scope:
  //       // "channels:read,groups:read,mpim:read,im:read,chat:write,chat:write.public,team:read,users:read,users:read.email",
  //       "channels:read,chat:write,chat:write.public,groups:read,team:read,users:read",
  //     redirect_uri: redirectUri,
  //     state: state,
  //   });

  //   const oauthUrl = `${this.oauthUrl}?${params.toString()}`;

  //   return oauthUrl;
  // }

  /**
   * Exchange authorization code for access token
   */
  // async exchangeCodeForToken(
  //   code: string,
  //   redirectUri: string,
  // ): Promise<SlackOAuthResponse> {
  //   const ac = new AbortController();
  //   const t = setTimeout(() => ac.abort(), 10000);
  //   const response = await fetch(`${this.baseUrl}/oauth.v2.access`, {
  //     method: "POST",
  //     headers: {
  //       "Content-Type": "application/x-www-form-urlencoded",
  //     },
  //     body: new URLSearchParams({
  //       client_id: this.clientId,
  //       client_secret: this.clientSecret,
  //       code: code,
  //       redirect_uri: redirectUri,
  //     }),
  //     signal: ac.signal,
  //   })
  //     .catch((e) => {
  //       throw new Error(`Slack OAuth network error: ${e}`);
  //     })
  //     .finally(() => clearTimeout(t));

  //   if (!response.ok) {
  //     throw new Error(`Slack OAuth failed: ${response.statusText}`);
  //   }

  //   const data = await response.json();

  //   if (!data.ok) {
  //     throw new Error(`Slack OAuth error: ${data.error}`);
  //   }

  //   return data;
  // }

  /**
   * Get workspace information
   */
  // async getWorkspaceInfo(accessToken: string): Promise<SlackWorkspaceInfo> {
  //   const decryptedToken = this.decryptToken(accessToken);
  //   const response = await fetch(`${this.baseUrl}/team.info`, {
  //     headers: {
  //       Authorization: `Bearer ${decryptedToken}`,
  //       "Content-Type": "application/x-www-form-urlencoded",
  //     },
  //   });

  //   if (!response.ok) {
  //     throw new Error(`Failed to get workspace info: ${response.statusText}`);
  //   }

  //   const data = await response.json();

  //   if (!data.ok) {
  //     throw new Error(`Slack API error: ${data.error}`);
  //   }

  //   return {
  //     id: data.team.id,
  //     name: data.team.name,
  //     url: `https://${data.team.domain}.slack.com`, // not in use
  //     domain: data.team.domain,
  //   };
  // }

  /**
   * Get bot information
   */
  // async getBotInfo(accessToken: string): Promise<{ id: string; name: string }> {
  //   const decryptedToken = this.decryptToken(accessToken);
  //   const response = await fetch(`${this.baseUrl}/auth.test`, {
  //     headers: {
  //       Authorization: `Bearer ${decryptedToken}`,
  //       "Content-Type": "application/json",
  //     },
  //   });

  //   if (!response.ok) {
  //     throw new Error(`Failed to get bot info: ${response.statusText}`);
  //   }

  //   const data = await response.json();

  //   if (!data.ok) {
  //     throw new Error(`Slack API error: ${data.error}`);
  //   }

  //   return {
  //     id: data.bot_id,
  //     name: data.user,
  //   };
  // }

  /**
   * Fetch channels from Slack using a specific token
   */
  private async fetchChannelsWithToken(
    token: string,
    types: string,
  ): Promise<SlackChannel[]> {
    const channels: SlackChannel[] = [];
    let cursor: string | undefined = undefined;

    do {
      const url = new URL(`${this.baseUrl}/conversations.list`);
      url.searchParams.set("types", types);
      url.searchParams.set("exclude_archived", "true");
      if (cursor) url.searchParams.set("cursor", cursor);

      const requestUrl = url.toString();
      const ac = new AbortController();
      const to = setTimeout(() => ac.abort(), 10000);
      const resp = await fetch(requestUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        signal: ac.signal,
      }).finally(() => clearTimeout(to));

      // Basic 429 handling
      if (resp.status === 429) {
        const retry = Number(resp.headers.get("retry-after") || 1);
        await new Promise((r) => setTimeout(r, retry * 1000));
        continue;
      }
      if (!resp.ok) {
        throw new Error(
          `Failed to get channels: ${resp.status} ${resp.statusText}`,
        );
      }
      const data = await resp.json();
      if (!data.ok) throw new Error(`Slack API error: ${data.error}`);
      channels.push(
        ...data.channels.map((channel: any) => ({
          id: channel.id,
          name: channel.name,
          is_private: channel.is_private,
          is_archived: channel.is_archived,
          is_member: channel.is_member,
        })),
      );
      cursor = data.response_metadata?.next_cursor || undefined;
    } while (cursor);

    return channels;
  }

  /**
   * Get channels from Slack workspace
   * Uses user token for private channels (when available) and bot token for public channels
   *
   * @param botAccessToken - The encrypted bot access token
   * @param userAccessToken - Optional encrypted user access token for private channel access
   */
  async getChannels(
    botAccessToken: string,
    userAccessToken?: string,
  ): Promise<SlackChannel[]> {
    const decryptedBotToken = decryptSlackToken(botAccessToken);
    if (!decryptedBotToken) {
      throw new Error("Missing Slack access token");
    }

    const channelMap = new Map<string, SlackChannel>();

    // First, fetch public channels with bot token
    try {
      const publicChannels = await this.fetchChannelsWithToken(
        decryptedBotToken,
        "public_channel",
      );
      publicChannels.forEach((channel) => {
        channelMap.set(channel.id, channel);
      });
    } catch (error) {
      console.error("Error fetching public channels with bot token:", error);
      throw error;
    }

    // If user token is available, use it for private channels
    // User token can see all private channels the user is a member of
    if (userAccessToken) {
      try {
        const decryptedUserToken = decryptSlackToken(userAccessToken);
        if (decryptedUserToken) {
          const privateChannels = await this.fetchChannelsWithToken(
            decryptedUserToken,
            "private_channel",
          );
          privateChannels.forEach((channel) => {
            channelMap.set(channel.id, channel);
          });
        }
      } catch (error) {
        // Log but don't fail - fall back to bot token for private channels
        console.warn(
          "Error fetching private channels with user token, falling back to bot token:",
          error,
        );
      }
    }

    // Fall back: If no user token or user token failed, try bot token for private channels
    // Note: Bot token can only see private channels where bot has been explicitly added
    if (!userAccessToken || channelMap.size === 0) {
      try {
        const botPrivateChannels = await this.fetchChannelsWithToken(
          decryptedBotToken,
          "private_channel",
        );
        botPrivateChannels.forEach((channel) => {
          // Only add if not already present from user token
          if (!channelMap.has(channel.id)) {
            channelMap.set(channel.id, channel);
          }
        });
      } catch (error) {
        // Bot may not have groups:read scope, which is fine
        console.warn(
          "Could not fetch private channels with bot token (may not have groups:read scope):",
          error,
        );
      }
    }

    return Array.from(channelMap.values());
  }

  /**
   * Send message to Slack channel
   */
  async sendMessage(
    accessToken: string,
    message: SlackMessage,
  ): Promise<{ ok: boolean; ts?: string; error?: string }> {
    const decryptedToken = decryptSlackToken(accessToken);
    if (!decryptedToken) {
      throw new Error("Missing Slack access token");
    }

    const requestUrl = `${this.baseUrl}/chat.postMessage`;
    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${decryptedToken}`,
        "Content-Type": "application/json",
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

// Lazily instantiate
let _slackClient: SlackClient | null = null;
export function getSlackClient(): SlackClient {
  if (!_slackClient) _slackClient = new SlackClient();
  return _slackClient;
}
