import { metadata } from "@trigger.dev/sdk";

import type { TDocumentProgressStatus } from "@/lib/utils/parse-trigger-status";

export { parseStatus } from "@/lib/utils/parse-trigger-status";
export type { TDocumentProgressStatus };

/**
 * Update the status of the convert document task. Wraps the `metadata.set` method.
 */
export function updateStatus(status: TDocumentProgressStatus) {
  metadata.set("status", status);
}
