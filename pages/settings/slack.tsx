import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { CircleHelpIcon, Hash, Settings, X, XCircleIcon } from "lucide-react";
import { toast } from "sonner";

import AppLayout from "@/components/layouts/app";
import { SettingsHeader } from "@/components/settings/settings-header";
import SlackChannelModal from "@/components/settings/slack-channel-modal";
import SlackFrequencySettings from "@/components/settings/slack-frequency-settings";
import SlackSettingsSkeleton from "@/components/settings/slack-settings-skeleton";
import { SlackIcon } from "@/components/shared/icons/slack-icon";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CommonAlertDialog } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { BadgeTooltip } from "@/components/ui/tooltip";

interface SlackIntegration {
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
  enabledChannels: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export default function SlackSettings() {
  const router = useRouter();
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;
  const [error, setError] = useState<string | null>(null);
  const [integration, setIntegration] = useState<SlackIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);

  const handleIntegrationUpdate = (updatedIntegration: SlackIntegration) => {
    setIntegration(updatedIntegration);
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;

    if (router.query.success) {
      toast.success("Slack integration connected successfully!");

      if (router.query.warning) {
        toast.warning(`Warning: ${router.query.warning}`);
      }

      timeoutId = setTimeout(() => {
        router.replace("/settings/slack", undefined, { shallow: true });
      }, 100);
    } else if (router.query.error) {
      toast.error(`Failed to connect Slack: ${router.query.error}`);
      timeoutId = setTimeout(() => {
        router.replace("/settings/slack", undefined, { shallow: true });
      }, 100);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [router.query]);

  const fetchIntegration = async (controller: AbortController) => {
    try {
      setError(null);
      setLoading(true);

      const response = await fetch(`/api/teams/${teamId}/slack`, {
        signal: controller.signal,
      });

      if (response.ok) {
        const data = await response.json();
        setIntegration(data);
        setError(null);
      } else if (response.status === 404) {
        setIntegration(null);
        setError(null);
      } else {
        let errorData: { error?: string } = {};
        try {
          errorData = await response.json();
        } catch {
          console.log("error");
        }
        setError(errorData.error || "Failed to fetch integration");
        setIntegration(null);
      }
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === "AbortError") {
      } else {
        console.error("Error fetching Slack integration:", error);
        setError("Failed to fetch integration");
        setIntegration(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!teamId) {
      setIntegration(null);
      setLoading(false);
      setError(null);
      return;
    }

    const controller = new AbortController();

    fetchIntegration(controller);

    return () => controller.abort();
  }, [teamId]);

  const handleConnect = async () => {
    if (!teamId) return;

    setConnecting(true);
    try {
      const response = await fetch(
        `/api/teams/${teamId}/slack/oauth/authorize`,
      );
      const data = await response.json();

      if (response.ok) {
        // Redirect to Slack OAuth
        window.location.href = data.oauthUrl;
      } else {
        toast.error(data.error || "Failed to start OAuth process");
      }
    } catch (error) {
      console.error("Error starting OAuth:", error);
      toast.error("Failed to start OAuth process");
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    const disconnectPromise = async () => {
      const response = await fetch(`/api/teams/${teamId}/slack`, {
        method: "DELETE",
      });

      if (response.ok) {
        setIntegration(null);
      } else {
        const data = await response.json();
        throw new Error(data.error || "Failed to disconnect Slack");
      }
    };

    toast.promise(disconnectPromise(), {
      loading: "Disconnecting Slack integration...",
      success: "Slack integration disconnected successfully",
      error: "Failed to disconnect Slack integration. Please try again.",
    });
  };

  const handleChannelsUpdate = async (channels: Record<string, any>) => {
    if (!teamId || !integration) return;

    await toast.promise(
      async () => {
        const response = await fetch(`/api/teams/${teamId}/slack`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...integration,
            enabledChannels: channels,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.error || "Failed to update channel settings",
          );
        }

        const updatedIntegration = await response.json();
        setIntegration(updatedIntegration);
      },
      {
        loading: "Updating channels...",
        success: "Channel settings updated successfully",
        error: (err) => err?.message || "Failed to update channel settings",
      },
    );
  };

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <SettingsHeader />

        <div>
          {error && (
            <Alert className="mb-4">
              <XCircleIcon className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {loading ? (
            <SlackSettingsSkeleton />
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
                <div className="space-y-1">
                  <h3 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
                    <SlackIcon className="h-6 w-6" />
                    Slack Integration
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications in your Slack channels when documents
                    are viewed or accessed
                  </p>
                </div>
                {!integration ? (
                  <Button onClick={handleConnect} disabled={connecting}>
                    {connecting ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                        Connecting...
                      </>
                    ) : (
                      <>
                        <SlackIcon className="mr-2 h-4 w-4" />
                        Connect to Slack
                      </>
                    )}
                  </Button>
                ) : (
                  <CommonAlertDialog
                    title="Disconnect Slack Integration"
                    description="Are you sure you want to disconnect Slack? This will remove all notification settings and stop sending notifications to your Slack channels."
                    action="Disconnect"
                    actionUpdate="Disconnecting"
                    onAction={handleDisconnect}
                  />
                )}
              </div>
              {!integration ? (
                // Not connected state
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <SlackIcon className="h-5 w-5" />
                      Connect Slack
                    </CardTitle>
                    <CardDescription>
                      Connect your Slack workspace to receive real-time
                      notifications about document activity.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <Switch disabled={true} />
                        <span className="text-sm font-medium">
                          Slack notifications
                        </span>
                        <Badge variant="secondary">Not connected</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                // Connected state
                <div className="space-y-6">
                  {/* General Settings */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        General Settings
                      </CardTitle>
                      <CardDescription>
                        Connected to {integration.workspaceName}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Slack Notification Toggle */}
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <SlackIcon className="h-5 w-5" />
                              <h4 className="font-medium">
                                Slack notification
                              </h4>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Receive notifications in your Slack channels
                            </p>
                          </div>
                          <Switch
                            checked={integration.enabled}
                            onCheckedChange={async (checked) => {
                              try {
                                const response = await fetch(
                                  `/api/teams/${teamId}/slack`,
                                  {
                                    method: "PUT",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      ...integration,
                                      enabled: checked,
                                    }),
                                  },
                                );
                                if (response.ok) {
                                  setIntegration(await response.json());
                                  toast.success(
                                    checked
                                      ? "Slack notifications enabled"
                                      : "Slack notifications disabled",
                                  );
                                }
                              } catch (error) {
                                toast.error(
                                  "Failed to update notification settings",
                                );
                              }
                            }}
                          />
                        </div>

                        <Separator />
                        <div className="space-y-3">
                          <div>
                            <label className="flex items-center gap-2 text-sm font-medium">
                              Slack channel(s) *
                              <BadgeTooltip
                                content="Get notifications in Slack based on frequency settings when someone views, downloads, or interacts with your documents and datarooms"
                                key="tag_tooltip"
                              >
                                <CircleHelpIcon className="h-4 w-4 shrink-0 text-muted-foreground hover:text-foreground" />
                              </BadgeTooltip>
                            </label>
                            <p className="text-sm text-muted-foreground">
                              Select the Slack channel(s) where you want to
                              receive new mentions.
                            </p>
                          </div>

                          <div className="flex items-center rounded-lg border border-border bg-background">
                            <div className="flex flex-1 items-center gap-2 px-1">
                              {Object.keys(integration.enabledChannels || {})
                                .length > 0 ? (
                                Object.entries(integration.enabledChannels).map(
                                  ([channelId, channel]: [string, any]) => (
                                    <div
                                      key={channelId}
                                      className="flex items-center gap-1.5 rounded-md border bg-background px-2 py-1 text-sm shadow-sm"
                                    >
                                      <Hash className="h-3 w-3 text-muted-foreground" />
                                      <span className="text-sm font-medium text-foreground">
                                        {channel.name}
                                      </span>
                                      <button
                                        onClick={() =>
                                          handleChannelsUpdate(
                                            Object.fromEntries(
                                              Object.entries(
                                                integration.enabledChannels,
                                              ).filter(
                                                ([id]) => id !== channelId,
                                              ),
                                            ),
                                          )
                                        }
                                        className="ml-1 rounded-full p-0.5 text-muted-foreground transition-all duration-200 hover:scale-110 hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                                        aria-label={`Remove ${channel.name} channel`}
                                      >
                                        <X className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ),
                                )
                              ) : (
                                <span className="pl-2 text-sm text-muted-foreground">
                                  No channels selected
                                </span>
                              )}
                            </div>
                            <div className="h-9 w-px bg-border" />
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => setShowChannelModal(true)}
                              className="shrink-0 rounded-l-none border-0 px-3 py-1.5 text-sm font-medium"
                            >
                              Select Channels
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <SlackFrequencySettings
                    teamId={teamId!}
                    integration={integration!}
                    onUpdate={handleIntegrationUpdate}
                  />
                  <SlackChannelModal
                    open={showChannelModal}
                    onOpenChange={setShowChannelModal}
                    teamId={teamId!}
                    onChannelsUpdate={handleChannelsUpdate}
                    currentChannels={integration.enabledChannels}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </AppLayout>
  );
}
