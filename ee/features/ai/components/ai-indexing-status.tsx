"use client";

import { useEffect } from "react";

import { CheckCircle, Loader2, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

import { Progress } from "@/components/ui/progress";

import { useAIIndexingStatus } from "../hooks/use-ai-indexing-status";

interface AIIndexingStatusProps {
  runId: string | null;
  onComplete?: (vectorStoreFileId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

/**
 * AI indexing status display component with polling
 * Shows progress, current step, and final status
 */
export function AIIndexingStatus({
  runId,
  onComplete,
  onError,
  className,
}: AIIndexingStatusProps) {
  const {
    isProcessing,
    isCompleted,
    isFailed,
    step,
    progress,
    error,
    vectorStoreFileId,
  } = useAIIndexingStatus({ runId });

  // Handle completion callback
  useEffect(() => {
    if (isCompleted && vectorStoreFileId && onComplete) {
      onComplete(vectorStoreFileId);
    }
  }, [isCompleted, vectorStoreFileId, onComplete]);

  // Handle error callback
  useEffect(() => {
    if (isFailed && error && onError) {
      onError(error);
    }
  }, [isFailed, error, onError]);

  if (!runId) {
    return null;
  }

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {isProcessing && (
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-sm text-muted-foreground">{step || "Processing..."}</span>
            <Progress value={progress} className="h-1.5" />
          </div>
          <span className="text-xs text-muted-foreground">{progress}%</span>
        </div>
      )}

      {isCompleted && (
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span className="text-sm text-green-600">Indexed successfully</span>
        </div>
      )}

      {isFailed && (
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-500" />
          <span className="text-sm text-red-600">
            {error || "Indexing failed"}
          </span>
        </div>
      )}
    </div>
  );
}

interface AIIndexingBatchStatusProps {
  runs: Array<{
    documentId: string;
    documentName: string;
    runId: string;
  }>;
  onAllComplete?: () => void;
  className?: string;
}

/**
 * Status display for batch AI indexing (multiple documents)
 */
export function AIIndexingBatchStatus({
  runs,
  onAllComplete,
  className,
}: AIIndexingBatchStatusProps) {
  if (runs.length === 0) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="text-sm font-medium">
        Indexing {runs.length} document{runs.length > 1 ? "s" : ""}...
      </div>
      <div className="max-h-60 space-y-2 overflow-y-auto">
        {runs.map((run) => (
          <div key={run.documentId} className="rounded border p-2">
            <div className="mb-1 text-xs font-medium truncate">
              {run.documentName}
            </div>
            <AIIndexingStatus runId={run.runId} />
          </div>
        ))}
      </div>
    </div>
  );
}
