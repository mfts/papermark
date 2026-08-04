import { z } from "zod";

const ZDocumentProgressStatus = z.object({
  progress: z.number(),
  text: z.string(),
});

export type TDocumentProgressStatus = z.infer<typeof ZDocumentProgressStatus>;

const ZDocumentProgressMetadata = z.object({
  status: ZDocumentProgressStatus,
});

/**
 * Parse the status from the metadata.
 * Deliberately free of any @trigger.dev import so this can be bundled
 * into client components without pulling Node builtins into the browser.
 */
export function parseStatus(data: unknown): TDocumentProgressStatus {
  return ZDocumentProgressMetadata.parse(data).status;
}
