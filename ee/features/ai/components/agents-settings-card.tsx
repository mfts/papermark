"use client";

import { useEffect, useState } from "react";

import { CheckCircle, Loader2, XCircle } from "lucide-react";

import PapermarkSparkle from "@/components/shared/icons/papermark-sparkle";
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
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";

import { useAIIndexingStatus } from "../hooks/use-ai-indexing-status";

interface AgentsSettingsCardProps {
  dataroomId: string;
  teamId: string;
  agentsEnabled: boolean;
  vectorStoreId?: string | null;
  onUpdate?: () => void;
}

interface IndexingRun {
  documentId: string;
  documentName: string;
  runId: string;
}

export function AgentsSettingsCard({
  dataroomId,
  teamId,
  agentsEnabled: initialEnabled,
  vectorStoreId,
  onUpdate,
}: AgentsSettingsCardProps) {
  const [agentsEnabled, setAgentsEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);

  // Run tracking state for polling
  const [indexingRuns, setIndexingRuns] = useState<IndexingRun[]>([]);

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
      const response = await fetch(
        `/api/teams/${teamId}/datarooms/${dataroomId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ agentsEnabled: enabled }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to update agents setting");
      }

      setAgentsEnabled(enabled);
      toast.success(`AI Agents ${enabled ? "enabled" : "disabled"}`);

      // Mutate the relevant SWR cache
      await mutate(`/api/teams/${teamId}/datarooms/${dataroomId}`);

      onUpdate?.();
    } catch (error) {
      console.error("Error toggling agents:", error);
      toast.error("Failed to update agents setting");
      setAgentsEnabled(!enabled); // Revert on error
    } finally {
      setLoading(false);
    }
  };

  const handleIndexDataroom = async () => {
    setIndexing(true);
    setIndexingRuns([]);

    try {
      const response = await fetch(
        `/api/ai/store/teams/${teamId}/datarooms/${dataroomId}`,
        {
          method: "POST",
        },
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to index dataroom");
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Dataroom batch indexing
      if (data.runs && data.runs.length > 0) {
        // Track runs for documents that need indexing
        setIndexingRuns(data.runs);

        // Show info about skipped documents
        if (data.skippedCount > 0) {
          toast.info(
            `${data.skippedCount} document${data.skippedCount > 1 ? "s" : ""} already indexed, indexing ${data.triggeredCount} new document${data.triggeredCount > 1 ? "s" : ""}`,
          );
        }
      } else if (data.skippedCount > 0 && data.triggeredCount === 0) {
        // All documents were already indexed
        toast.success(
          `All ${data.skippedCount} document${data.skippedCount > 1 ? "s are" : " is"} already indexed`,
        );
        setIndexing(false);
      } else if (data.totalDocuments === 0) {
        // No documents in dataroom
        toast.info("No documents found in dataroom to index");
        setIndexing(false);
      }

      if (data.errors && data.errors.length > 0) {
        toast.warning(`Some documents had errors: ${data.errors.join(", ")}`);
      }
    } catch (error: any) {
      console.error("Error indexing dataroom:", error);
      toast.error(error.message || "Failed to index dataroom");
      setIndexing(false);
    }
  };

  // Handle batch indexing completion
  const handleBatchIndexingComplete = async () => {
    setIndexing(false);
    setIndexingRuns([]);
    toast.success("All documents indexed successfully");

    // Mutate the dataroom cache
    await mutate(`/api/teams/${teamId}/datarooms/${dataroomId}`);
    onUpdate?.();
  };

  const isIndexed = !!vectorStoreId;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PapermarkSparkle className="h-5 w-5 text-primary" />
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
          Enable AI-powered chat to let visitors ask questions about documents
          in this dataroom. Documents must be indexed for chat to work.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="agents-enabled" className="flex flex-col space-y-1">
            <span>Enable AI Agents</span>
            <span className="text-xs font-normal leading-snug text-muted-foreground">
              Allow visitors to chat with AI about these documents
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
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center justify-between space-x-2">
              <div className="flex flex-col space-y-1">
                <span className="text-sm font-medium">Index Status</span>
                <span className="text-xs text-muted-foreground">
                  {isIndexed
                    ? "Dataroom indexed and ready"
                    : "Dataroom needs to be indexed"}
                </span>
              </div>
              <Button
                onClick={handleIndexDataroom}
                disabled={indexing}
                size="sm"
              >
                {indexing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Indexing...
                  </>
                ) : (
                  <>Index Dataroom</>
                )}
              </Button>
            </div>

            {/* Batch dataroom indexing status */}
            {indexingRuns.length > 0 && (
              <DataroomIndexingStatus
                runs={indexingRuns}
                onAllComplete={handleBatchIndexingComplete}
              />
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between rounded-b-lg border-t bg-muted px-6 py-3">
        <p className="text-sm text-muted-foreground transition-colors">
          AI Agents use OpenAI to answer questions. Supports PDF, DOCX, PPTX,
          Excel, CSV, and image files.
        </p>
      </CardFooter>
    </Card>
  );
}

/**
 * Component for displaying batch indexing status for datarooms
 */
function DataroomIndexingStatus({
  runs,
  onAllComplete,
}: {
  runs: IndexingRun[];
  onAllComplete: () => void;
}) {
  const [completedRuns, setCompletedRuns] = useState<Set<string>>(new Set());
  const [failedRuns, setFailedRuns] = useState<Set<string>>(new Set());

  const handleRunComplete = (runId: string) => {
    setCompletedRuns((prev) => new Set(prev).add(runId));
  };

  const handleRunError = (runId: string) => {
    setFailedRuns((prev) => new Set(prev).add(runId));
  };

  // Check if all runs are finished (completed or failed)
  useEffect(() => {
    const allFinished = runs.every(
      (run) => completedRuns.has(run.runId) || failedRuns.has(run.runId),
    );
    if (allFinished && runs.length > 0) {
      onAllComplete();
    }
  }, [completedRuns, failedRuns, runs, onAllComplete]);

  const completedCount = completedRuns.size;
  const failedCount = failedRuns.size;
  const totalCount = runs.length;
  const progress = Math.round(
    ((completedCount + failedCount) / totalCount) * 100,
  );

  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-sm font-medium">
            Indexing {totalCount} document{totalCount > 1 ? "s" : ""}
          </span>
        </div>
        <span className="text-xs text-muted-foreground">
          {completedCount}/{totalCount} completed
          {failedCount > 0 && `, ${failedCount} failed`}
        </span>
      </div>

      <Progress value={progress} className="h-1.5" />

      <div className="max-h-40 space-y-2 overflow-y-auto">
        {runs.map((run) => (
          <DataroomDocumentIndexingRow
            key={run.runId}
            run={run}
            isCompleted={completedRuns.has(run.runId)}
            isFailed={failedRuns.has(run.runId)}
            onComplete={() => handleRunComplete(run.runId)}
            onError={() => handleRunError(run.runId)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Individual document row in batch indexing status
 */
function DataroomDocumentIndexingRow({
  run,
  isCompleted,
  isFailed,
  onComplete,
  onError,
}: {
  run: IndexingRun;
  isCompleted: boolean;
  isFailed: boolean;
  onComplete: () => void;
  onError: () => void;
}) {
  const status = useAIIndexingStatus({ runId: run.runId });

  // Trigger callbacks when status changes
  useEffect(() => {
    if (status.isCompleted && !isCompleted) {
      onComplete();
    }
    if (status.isFailed && !isFailed) {
      onError();
    }
  }, [
    status.isCompleted,
    status.isFailed,
    isCompleted,
    isFailed,
    onComplete,
    onError,
  ]);

  return (
    <div className="flex items-center justify-between rounded border px-2 py-1.5">
      <span className="max-w-[60%] truncate text-xs" title={run.documentName}>
        {run.documentName}
      </span>
      <div className="flex items-center gap-2">
        {status.isProcessing && (
          <>
            <Loader2 className="h-3 w-3 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">
              {status.progress}%
            </span>
          </>
        )}
        {isCompleted && <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
        {isFailed && <XCircle className="h-3.5 w-3.5 text-red-500" />}
        {!status.isProcessing && !isCompleted && !isFailed && (
          <span className="text-xs text-muted-foreground">Queued</span>
        )}
      </div>
    </div>
  );
}
