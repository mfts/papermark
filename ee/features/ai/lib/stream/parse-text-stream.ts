/**
 * Parser for AI SDK's toTextStreamResponse() format
 * Handles plain text stream (no SSE, no JSON structure)
 */

export interface TextStreamCallbacks {
  onTextDelta?: (delta: string, accumulated: string) => void;
  onTextEnd?: (content: string) => void;
  onError?: (error: Error) => void;
}

export interface TextStreamResult {
  content: string;
}

/**
 * Parse the text stream from toTextStreamResponse()
 * This is a simple text-only stream with no structured events
 */
export async function parseTextStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  callbacks: TextStreamCallbacks,
): Promise<TextStreamResult> {
  const decoder = new TextDecoder();
  let content = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      content += chunk;
      callbacks.onTextDelta?.(chunk, content);
    }

    // Flush decoder
    const remaining = decoder.decode();
    if (remaining) {
      content += remaining;
      callbacks.onTextDelta?.(remaining, content);
    }
  } catch (error) {
    callbacks.onError?.(error as Error);
    throw error;
  }

  callbacks.onTextEnd?.(content);

  return { content };
}

