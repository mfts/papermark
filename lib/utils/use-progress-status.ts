"use client";

import { type RunStatus } from "@trigger.dev/core/v3";
import { useRealtimeRunsWithTag } from "@trigger.dev/react-hooks";

import { parseStatus } from "@/lib/utils/generate-trigger-status";

interface IDocumentProgressStatus {
  state: RunStatus;
  progress: number;
  text: string;
}

export function useDocumentProgressStatus(
  documentVersionId: string,
  publicAccessToken: string | undefined,
) {
  const { runs, error } = useRealtimeRunsWithTag(
    `version:${documentVersionId}`,
    {
      enabled: !!publicAccessToken,
      accessToken: publicAccessToken,
    },
  );

  const run = runs[0];
  const status: IDocumentProgressStatus = {
    state: run?.status ?? "QUEUED",
    progress: 0,
    text: "Initializing...",
  };

  // Parse metadata if available
  if (run?.metadata) {
    const { progress, text } = parseStatus(run.metadata);
    status.progress = progress;
    status.text = text;
  }

  return {
    status,
    error,
    run,
  };
}
