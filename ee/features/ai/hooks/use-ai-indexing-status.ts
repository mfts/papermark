"use client";

import { useCallback, useEffect, useState } from "react";

import type { AIProcessingMetadata, AIProcessingStatus } from "../lib/trigger/types";

interface UseAIIndexingStatusOptions {
  runId: string | null;
  pollInterval?: number;
}

interface UseAIIndexingStatusReturn {
  isProcessing: boolean;
  isCompleted: boolean;
  isFailed: boolean;
  status: AIProcessingStatus | undefined;
  step: string | undefined;
  progress: number;
  error: string | undefined;
  vectorStoreFileId: string | undefined;
  fileId: string | undefined;
  documentName: string | undefined;
}

interface RunStatusResponse {
  id: string;
  status: string;
  metadata?: AIProcessingMetadata;
  isCompleted: boolean;
  isFailed: boolean;
  output?: {
    vectorStoreFileId?: string;
    fileId?: string;
  };
}

/**
 * Custom hook for tracking AI indexing status via polling
 * Polls the run status API endpoint at regular intervals
 */
export function useAIIndexingStatus({
  runId,
  pollInterval = 2000,
}: UseAIIndexingStatusOptions): UseAIIndexingStatusReturn {
  const [runStatus, setRunStatus] = useState<RunStatusResponse | null>(null);
  const [error, setError] = useState<string | undefined>();

  const fetchStatus = useCallback(async () => {
    if (!runId) return;

    try {
      const response = await fetch(`/api/ai/store/runs/${runId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch run status");
      }
      const data: RunStatusResponse = await response.json();
      setRunStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch status");
    }
  }, [runId]);

  useEffect(() => {
    if (!runId) return;

    // Initial fetch
    fetchStatus();

    // Poll while processing
    const interval = setInterval(() => {
      if (runStatus?.isCompleted || runStatus?.isFailed) {
        clearInterval(interval);
        return;
      }
      fetchStatus();
    }, pollInterval);

    return () => clearInterval(interval);
  }, [runId, fetchStatus, pollInterval, runStatus?.isCompleted, runStatus?.isFailed]);

  const metadata = runStatus?.metadata;

  return {
    isProcessing: runStatus?.status === "EXECUTING",
    isCompleted: runStatus?.isCompleted ?? false,
    isFailed: (runStatus?.isFailed ?? false) || metadata?.status === "failed",
    status: metadata?.status,
    step: metadata?.step,
    progress: metadata?.progress ?? 0,
    error: metadata?.error || error,
    vectorStoreFileId: metadata?.vectorStoreFileId || runStatus?.output?.vectorStoreFileId,
    fileId: metadata?.fileId || runStatus?.output?.fileId,
    documentName: metadata?.documentName,
  };
}

/**
 * Hook for tracking multiple AI indexing runs (for dataroom batch processing)
 */
export function useAIIndexingBatchStatus() {
  // For batch tracking, we track individual statuses
  // The component using this should map over runs and call useAIIndexingStatus for each
  // This is a helper to calculate aggregate stats

  const calculateAggregateStats = (
    statuses: UseAIIndexingStatusReturn[],
  ) => {
    const total = statuses.length;
    const completed = statuses.filter((s) => s.isCompleted).length;
    const failed = statuses.filter((s) => s.isFailed).length;
    const processing = statuses.filter((s) => s.isProcessing).length;
    const pending = total - completed - failed - processing;

    return {
      total,
      completed,
      failed,
      processing,
      pending,
      progress: total > 0 ? Math.round((completed / total) * 100) : 0,
      isAllCompleted: completed === total,
      hasErrors: failed > 0,
    };
  };

  return { calculateAggregateStats };
}
