import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { format } from "date-fns";
import { CircleHelpIcon, CopyIcon } from "lucide-react";
import { toast } from "sonner";
import useSWR from "swr";

import AppLayout from "@/components/layouts/app";
import { SettingsHeader } from "@/components/settings/settings-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BadgeTooltip } from "@/components/ui/tooltip";

import { fetcher } from "@/lib/utils";

interface Webhook {
  id: string;
  name: string;
  webhookId: string;
  createdAt: string;
}

export default function WebhookSettings() {
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;
  const router = useRouter();
  const [name, setName] = useState("");
  const [webhookId, setWebhookId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Feature flag check
  const { data: features } = useSWR<{ incomingWebhooks: boolean }>(
    teamId ? `/api/feature-flags?teamId=${teamId}` : null,
    fetcher,
  );

  // Redirect if feature is not enabled
  useEffect(() => {
    if (features && !features.incomingWebhooks) {
      router.push("/settings/general");
      toast.error("This feature is not available for your team");
    }
  }, [features, router]);

  const { data: webhooks, mutate } = useSWR<Webhook[]>(
    teamId ? `/api/teams/${teamId}/incoming-webhooks` : null,
    fetcher,
  );

  const createWebhook = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/teams/${teamId}/incoming-webhooks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create webhook");
      }

      const data = await response.json();
      setWebhookId(data.webhookId);
      toast.success("Webhook created successfully");

      // Refresh the webhooks list
      mutate();
    } catch (error) {
      toast.error("Failed to create webhook");
    } finally {
      setIsLoading(false);
    }
  };

  const deleteWebhook = async (webhookId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/incoming-webhooks`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ webhookId }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete webhook");
      }

      mutate();
      toast.success("Webhook deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete webhook");
    }
  };

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <SettingsHeader />

        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="flex flex-col items-center justify-between gap-4 space-y-3 border-b border-gray-200 p-5 sm:flex-row sm:space-y-0 sm:p-10">
            <div className="flex max-w-screen-sm flex-col space-y-3">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-medium">Incoming Webhooks</h2>
                <BadgeTooltip content="Use webhooks to receive data from external services">
                  <CircleHelpIcon className="h-4 w-4 text-gray-500" />
                </BadgeTooltip>
              </div>
              <p className="text-sm text-gray-500">
                Create incoming webhooks to receive data from external services
                and automatically create new documents in Papermark.
              </p>
            </div>
          </div>

          <div className="p-5 sm:p-10">
            <div className="flex flex-col space-y-4">
              <div>
                <Label htmlFor="webhook-name">Webhook Name</Label>
                <Input
                  id="webhook-name"
                  placeholder="Enter a name for your webhook"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              {webhookId && (
                <div className="rounded-lg bg-gray-50 p-4">
                  <Label>Your Webhook URL (copy it now)</Label>
                  <code className="mt-2 block break-all rounded bg-gray-100 p-2 font-mono text-sm">
                    {`${process.env.NEXT_PUBLIC_WEBHOOK_BASE_URL}/services/${webhookId}`}
                  </code>
                </div>
              )}

              <Button
                onClick={createWebhook}
                disabled={!name || isLoading}
                className="w-fit"
              >
                {isLoading ? "Creating..." : "Create Webhook"}
              </Button>

              {/* Webhooks List */}
              <div className="mt-8">
                <h3 className="mb-4 text-lg font-medium">Existing Webhooks</h3>
                <div className="rounded-lg border border-gray-200">
                  {webhooks?.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">
                      No webhooks created yet
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {webhooks?.map((webhook) => (
                        <div
                          key={webhook.id}
                          className="flex items-center justify-between p-4"
                        >
                          <div className="space-y-1">
                            <p className="font-medium">{webhook.name}</p>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <div className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 font-mono">
                                <span className="max-w-[200px] overflow-x-auto whitespace-nowrap md:max-w-[400px]">
                                  {`${process.env.NEXT_PUBLIC_WEBHOOK_BASE_URL}/services/${webhook.webhookId}`}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      `${process.env.NEXT_PUBLIC_WEBHOOK_BASE_URL}/services/${webhook.webhookId}`,
                                    );
                                    toast.success(
                                      "Webhook URL copied to clipboard",
                                    );
                                  }}
                                >
                                  <CopyIcon className="h-3 w-3" />
                                </Button>
                              </div>
                              <span>•</span>
                              <span>
                                {format(
                                  new Date(webhook.createdAt),
                                  "MMM d, yyyy",
                                )}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteWebhook(webhook.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
