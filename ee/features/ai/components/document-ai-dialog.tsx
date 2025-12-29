"use client";

import { useState } from "react";

import { ExternalLink, Shield } from "lucide-react";

import PapermarkSparkle from "@/components/shared/icons/papermark-sparkle";
import { toast } from "sonner";
import { mutate } from "swr";

import { useFeatureFlags } from "@/lib/hooks/use-feature-flags";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { AIIndexingStatus } from "./ai-indexing-status";

interface DocumentAIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId: string;
  teamId: string;
  agentsEnabled: boolean;
  vectorStoreFileId?: string | null;
}

export function DocumentAIDialog({
  open,
  onOpenChange,
  documentId,
  teamId,
  agentsEnabled: initialEnabled,
  vectorStoreFileId,
}: DocumentAIDialogProps) {
  const { isFeatureEnabled } = useFeatureFlags();
  const isAIFeatureEnabled = isFeatureEnabled("ai");

  const [agentsEnabled, setAgentsEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);

  // Run tracking state for polling
  const [indexingRunId, setIndexingRunId] = useState<string | null>(null);

  // Don't render if AI feature is not enabled
  if (!isAIFeatureEnabled) {
    return null;
  }

  const isIndexed = !!vectorStoreFileId;

  // Disable agents (only allowed if already enabled)
  const handleDisableAgents = async () => {
    setLoading(true);

    try {
      const response = await fetch(
        `/api/teams/${teamId}/documents/${documentId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ agentsEnabled: false }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to disable agents");
      }

      setAgentsEnabled(false);
      toast.success("AI Agents disabled");

      // Mutate the document cache
      await mutate(`/api/teams/${teamId}/documents/${documentId}`);
    } catch (error) {
      console.error("Error disabling agents:", error);
      toast.error("Failed to disable agents");
    } finally {
      setLoading(false);
    }
  };

  // Enable agents and index document in one flow
  const handleEnableAndIndex = async () => {
    setIndexing(true);
    setIndexingRunId(null);

    try {
      const response = await fetch(
        `/api/ai/store/teams/${teamId}/documents/${documentId}`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to index document");
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Set up polling tracking
      if (data.runId) {
        setIndexingRunId(data.runId);
      }
    } catch (error: any) {
      console.error("Error indexing document:", error);
      toast.error(error.message || "Failed to index document");
      setIndexing(false);
    }
  };

  // Re-index an already enabled document
  const handleReindex = async () => {
    setIndexing(true);
    setIndexingRunId(null);

    try {
      const response = await fetch(
        `/api/ai/store/teams/${teamId}/documents/${documentId}`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to re-index document");
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Set up polling tracking
      if (data.runId) {
        setIndexingRunId(data.runId);
      }
    } catch (error: any) {
      console.error("Error re-indexing document:", error);
      toast.error(error.message || "Failed to re-index document");
      setIndexing(false);
    }
  };

  const handleIndexingComplete = async () => {
    setIndexing(false);
    setIndexingRunId(null);

    // Only enable agents after successful indexing
    if (!agentsEnabled) {
      try {
        const response = await fetch(
          `/api/teams/${teamId}/documents/${documentId}`,
          {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ agentsEnabled: true }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to enable agents");
        }

        setAgentsEnabled(true);
      } catch (error) {
        console.error("Error enabling agents after indexing:", error);
        toast.error("Indexed successfully but failed to enable agents");
        await mutate(`/api/teams/${teamId}/documents/${documentId}`);
        return;
      }
    }

    toast.success("Document indexed successfully");
    // Mutate the document cache
    await mutate(`/api/teams/${teamId}/documents/${documentId}`);
  };

  const handleIndexingError = (error: string) => {
    setIndexing(false);
    setIndexingRunId(null);
    toast.error(error || "Failed to index document");
    // Don't enable agentsEnabled on failure
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PapermarkSparkle className="h-5 w-5 text-primary" />
            AI Agents
          </DialogTitle>
          <DialogDescription>
            Enable AI-powered chat for this document. Visitors can ask questions
            and get intelligent answers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Status & Actions Section */}
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium">
                  {agentsEnabled ? "AI Chat Status" : "Enable AI Chat"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {agentsEnabled
                    ? isIndexed
                      ? "Document is indexed and ready for AI chat"
                      : "Document needs to be re-indexed"
                    : "Index your document to enable AI-powered chat"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {agentsEnabled && (
                  <span
                    className={cn(
                      "inline-flex h-2 w-2 rounded-full",
                      isIndexed ? "bg-green-500" : "bg-amber-500",
                    )}
                  />
                )}
                {agentsEnabled ? (
                  <>
                    <Button
                      onClick={handleReindex}
                      disabled={indexing}
                      size="sm"
                      variant="outline"
                    >
                      {indexing ? "Indexing..." : "Re-index"}
                    </Button>
                    <Button
                      onClick={handleDisableAgents}
                      disabled={loading || indexing}
                      size="sm"
                      variant="ghost"
                      className="text-destructive hover:text-destructive"
                    >
                      Disable
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={handleEnableAndIndex}
                    disabled={indexing}
                    size="sm"
                  >
                    {indexing ? "Indexing..." : "Enable AI Chat"}
                  </Button>
                )}
              </div>
            </div>

            {/* Indexing status with polling */}
            {indexingRunId && (
              <AIIndexingStatus
                runId={indexingRunId}
                onComplete={handleIndexingComplete}
                onError={handleIndexingError}
                className="pt-2 border-t"
              />
            )}
          </div>

          {/* Privacy Notice */}
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <div className="space-y-2 text-sm">
                <p className="font-medium text-green-900 dark:text-green-100">
                  Privacy & Data Usage
                </p>
                <ul className="space-y-1 text-green-800 dark:text-green-200">
                  <li>• Powered by OpenAI&apos;s API</li>
                  <li>• Your data is NOT used to train AI models</li>
                  <li>• Document embeddings stored securely</li>
                  <li>• Delete anytime by disabling AI</li>
                </ul>
                <a
                  href="https://openai.com/policies/api-data-usage-policies"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-green-700 hover:underline dark:text-green-300"
                >
                  OpenAI Data Usage Policy
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
