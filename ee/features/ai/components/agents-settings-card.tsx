"use client";

import { useState } from "react";

import { Bot, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { mutate } from "swr";

import { useFeatureFlags } from "@/lib/hooks/use-feature-flags";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
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

interface AgentsSettingsCardProps {
  type: "document" | "dataroom" | "team";
  entityId: string;
  teamId: string;
  agentsEnabled: boolean;
  vectorStoreId?: string | null;
  onUpdate?: () => void;
}

export function AgentsSettingsCard({
  type,
  entityId,
  teamId,
  agentsEnabled: initialEnabled,
  vectorStoreId,
  onUpdate,
}: AgentsSettingsCardProps) {
  const [agentsEnabled, setAgentsEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);

  // Check if AI feature is enabled for this team
  const { isFeatureEnabled, isLoading: featuresLoading } = useFeatureFlags();
  const isAIFeatureEnabled = isFeatureEnabled("ai");

  // Don't render if feature flags are still loading
  if (featuresLoading) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center">
          <LoadingSpinner className="h-6 w-6" />
        </CardContent>
      </Card>
    );
  }

  // Don't render if AI feature is not enabled for this team
  if (!isAIFeatureEnabled) {
    return null;
  }

  const handleToggleAgents = async (enabled: boolean) => {
    setLoading(true);

    try {
      const endpoint =
        type === "document"
          ? `/api/teams/${teamId}/documents/${entityId}`
          : type === "dataroom"
            ? `/api/teams/${teamId}/datarooms/${entityId}`
            : `/api/teams/${teamId}`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ agentsEnabled: enabled }),
      });

      if (!response.ok) {
        throw new Error("Failed to update agents setting");
      }

      setAgentsEnabled(enabled);
      toast.success(`AI Agents ${enabled ? "enabled" : "disabled"}`);

      // Mutate the relevant SWR cache
      if (type === "document") {
        await mutate(`/api/teams/${teamId}/documents/${entityId}`);
      } else if (type === "dataroom") {
        await mutate(`/api/teams/${teamId}/datarooms/${entityId}`);
      }

      onUpdate?.();
    } catch (error) {
      console.error("Error toggling agents:", error);
      toast.error("Failed to update agents setting");
      setAgentsEnabled(!enabled); // Revert on error
    } finally {
      setLoading(false);
    }
  };

  const handleIndexDocuments = async () => {
    setIndexing(true);

    try {
      const endpoint =
        type === "document"
          ? `/api/ai/store/teams/${teamId}/documents/${entityId}`
          : `/api/ai/store/teams/${teamId}/datarooms/${entityId}`;

      const response = await fetch(endpoint, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to index documents");
      }

      const data = await response.json();

      if (data.errors && data.errors.length > 0) {
        toast.warning(
          `Indexed ${data.filesIndexed}/${data.totalDocuments || "N/A"} documents with some errors`,
        );
      } else {
        toast.success(
          `Successfully indexed ${type === "document" ? "document" : `${data.filesIndexed} documents`}`,
        );
      }

      onUpdate?.();
    } catch (error: any) {
      console.error("Error indexing documents:", error);
      toast.error(error.message || "Failed to index documents");
    } finally {
      setIndexing(false);
    }
  };

  const isIndexed = type === "document" ? !!vectorStoreId : !!vectorStoreId;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle>AI Agents</CardTitle>
          </div>
          <span
            className="relative ml-auto flex h-4 w-4"
            title={`AI Agents are ${agentsEnabled ? "" : "not"} enabled`}
          >
            <span
              className={cn(
                "absolute inline-flex h-full w-full rounded-full opacity-75",
                agentsEnabled ? "animate-ping bg-green-400" : "",
              )}
            />
            <span
              className={cn(
                "relative inline-flex h-4 w-4 rounded-full",
                agentsEnabled ? "bg-green-500" : "bg-gray-400",
              )}
            />
          </span>
        </div>
        <CardDescription>
          Enable AI-powered chat to let visitors ask questions about{" "}
          {type === "document" ? "this document" : "documents in this " + type}.
          Documents must be indexed for chat to work.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="agents-enabled" className="flex flex-col space-y-1">
            <span>Enable AI Agents</span>
            <span className="text-xs font-normal leading-snug text-muted-foreground">
              Allow visitors to chat with AI about{" "}
              {type === "document" ? "this document" : "these documents"}
            </span>
          </Label>
          <Switch
            id="agents-enabled"
            checked={agentsEnabled}
            onCheckedChange={handleToggleAgents}
            disabled={loading}
          />
        </div>

        {agentsEnabled && (
          <div className="flex items-center justify-between space-x-2 border-t pt-4">
            <div className="flex flex-col space-y-1">
              <span className="text-sm font-medium">Index Status</span>
              <span className="text-xs text-muted-foreground">
                {isIndexed
                  ? `${type === "document" ? "Document" : "Documents"} indexed and ready`
                  : `${type === "document" ? "Document needs" : "Documents need"} to be indexed`}
              </span>
            </div>
            <Button
              onClick={handleIndexDocuments}
              disabled={indexing}
              size="sm"
            >
              {indexing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Indexing...
                </>
              ) : (
                <>Index {type === "document" ? "Document" : "Documents"}</>
              )}
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between rounded-b-lg border-t bg-muted px-6 py-3">
        <p className="text-sm text-muted-foreground transition-colors">
          AI Agents use OpenAI to answer questions. Only PDF documents are
          currently supported.
        </p>
      </CardFooter>
    </Card>
  );
}
