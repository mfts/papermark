import { useRouter } from "next/router";

import { useEffect, useState } from "react";

import { useTeam } from "@/context/team-context";
import { ExternalLink, Shield, Sparkles } from "lucide-react";

import PapermarkSparkle from "@/components/shared/icons/papermark-sparkle";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import useSWR from "swr";

import { useFeatureFlags } from "@/lib/hooks/use-feature-flags";
import { useGetTeam } from "@/lib/swr/use-team";
import { CustomUser } from "@/lib/types";
import { fetcher } from "@/lib/utils";

import AppLayout from "@/components/layouts/app";
import { SettingsHeader } from "@/components/settings/settings-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { Switch } from "@/components/ui/switch";

interface AISettings {
  agentsEnabled: boolean;
  vectorStoreId: string | null;
}

export default function AISettings() {
  const router = useRouter();
  const { data: session } = useSession();
  const teamInfo = useTeam();
  const teamId = teamInfo?.currentTeam?.id;
  const { team, loading: teamLoading } = useGetTeam();

  const [updating, setUpdating] = useState(false);

  // Check if AI feature is enabled for this team
  const { isFeatureEnabled, isLoading: featuresLoading } = useFeatureFlags();
  const isAIFeatureEnabled = isFeatureEnabled("ai");

  // Fetch AI settings
  const {
    data: aiSettings,
    isLoading: aiSettingsLoading,
    mutate: mutateAISettings,
  } = useSWR<AISettings>(
    teamId && isAIFeatureEnabled ? `/api/teams/${teamId}/ai-settings` : null,
    fetcher,
  );

  const userId = (session?.user as CustomUser)?.id;

  // Check if current user is admin
  const isAdmin = team?.users.some(
    (user) => user.role === "ADMIN" && user.userId === userId,
  );

  // Redirect if feature is not enabled
  useEffect(() => {
    if (!featuresLoading && !isAIFeatureEnabled) {
      router.push("/settings/general");
      toast.error("AI features are not available for your team");
    }
  }, [featuresLoading, isAIFeatureEnabled, router]);

  const handleToggleAI = async (enabled: boolean) => {
    if (!teamId || !isAdmin) return;

    setUpdating(true);

    try {
      const response = await fetch(`/api/teams/${teamId}/ai-settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agentsEnabled: enabled }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update AI settings");
      }

      await mutateAISettings();
      toast.success(
        `AI Agents ${enabled ? "enabled" : "disabled"} for your team`,
      );
    } catch (error) {
      console.error("Error updating AI settings:", error);
      toast.error((error as Error).message || "Failed to update AI settings");
    } finally {
      setUpdating(false);
    }
  };

  if (featuresLoading || teamLoading) {
    return (
      <AppLayout>
        <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
          <SettingsHeader />
          <div className="flex h-64 items-center justify-center">
            <LoadingSpinner className="h-8 w-8" />
          </div>
        </main>
      </AppLayout>
    );
  }

  if (!isAIFeatureEnabled) {
    return null;
  }

  return (
    <AppLayout>
      <main className="relative mx-2 mb-10 mt-4 space-y-8 overflow-hidden px-1 sm:mx-3 md:mx-5 md:mt-5 lg:mx-7 lg:mt-8 xl:mx-10">
        <SettingsHeader />

        <div className="mb-4 flex items-center justify-between md:mb-8 lg:mb-12">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">
                AI Agents
              </h3>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="h-3 w-3" />
                Beta
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Configure AI-powered chat for your documents and datarooms
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Main AI Toggle Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <PapermarkSparkle className="h-5 w-5 text-primary" />
                <CardTitle>Enable AI Agents</CardTitle>
              </div>
              <CardDescription>
                Allow AI-powered chat on documents and datarooms in your team.
                When enabled, you can activate AI chat on individual documents.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-center justify-between space-x-2">
                <Label htmlFor="ai-enabled" className="flex flex-col space-y-1">
                  <span>AI Agents for Team</span>
                  <span className="text-xs font-normal leading-snug text-muted-foreground">
                    {isAdmin
                      ? "Enable to allow AI chat on documents in your team"
                      : "Only team admins can change this setting"}
                  </span>
                </Label>
                <Switch
                  id="ai-enabled"
                  checked={aiSettings?.agentsEnabled ?? false}
                  onCheckedChange={handleToggleAI}
                  disabled={updating || aiSettingsLoading || !isAdmin}
                />
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between rounded-b-lg border-t bg-muted px-6 py-3">
              <p className="text-sm text-muted-foreground transition-colors">
                Once enabled, you can turn on AI chat for individual documents
                from their settings page.
              </p>
            </CardFooter>
          </Card>

          {/* Privacy & Data Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                <CardTitle>Privacy & Data Usage</CardTitle>
              </div>
              <CardDescription>
                How we handle your data with AI features
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30">
                    ✓
                  </div>
                  <div>
                    <p className="font-medium">Powered by OpenAI</p>
                    <p className="text-muted-foreground">
                      We use OpenAI&apos;s API to power AI chat features. Your
                      documents are processed to enable intelligent Q&A.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30">
                    ✓
                  </div>
                  <div>
                    <p className="font-medium">No Training on Your Data</p>
                    <p className="text-muted-foreground">
                      OpenAI does not use data sent through their API to train
                      their models. Your content remains private.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30">
                    ✓
                  </div>
                  <div>
                    <p className="font-medium">Data Retention</p>
                    <p className="text-muted-foreground">
                      Document embeddings are stored securely and can be deleted
                      at any time by disabling AI for a document.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between rounded-b-lg border-t bg-muted px-6 py-3">
              <a
                href="https://openai.com/policies/api-data-usage-policies"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:underline"
              >
                Learn more about OpenAI&apos;s data usage policies
                <ExternalLink className="h-3 w-3" />
              </a>
            </CardFooter>
          </Card>

          {/* How it Works Card */}
          <Card>
            <CardHeader>
              <CardTitle>How AI Agents Work</CardTitle>
              <CardDescription>
                A quick overview of the AI chat feature
              </CardDescription>
            </CardHeader>

            <CardContent>
              <ol className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    1
                  </span>
                  <div>
                    <p className="font-medium">Enable AI for your team</p>
                    <p className="text-muted-foreground">
                      Turn on the toggle above (admin only)
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    2
                  </span>
                  <div>
                    <p className="font-medium">Activate AI on documents</p>
                    <p className="text-muted-foreground">
                      Go to a document&apos;s settings and enable AI Agents
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    3
                  </span>
                  <div>
                    <p className="font-medium">Index your documents</p>
                    <p className="text-muted-foreground">
                      Click &quot;Index Document&quot; to prepare it for AI chat
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                    4
                  </span>
                  <div>
                    <p className="font-medium">Visitors can chat</p>
                    <p className="text-muted-foreground">
                      Viewers can ask questions and get AI-powered answers about
                      your document
                    </p>
                  </div>
                </li>
              </ol>
            </CardContent>
          </Card>
        </div>
      </main>
    </AppLayout>
  );
}
