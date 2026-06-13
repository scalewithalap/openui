/**
 * Checks if a stream text chunk contains raw API syntax, status codes,
 * backend logs, or raw JSON structures that should be discarded.
 */
export function isValidStreamChunk(chunk: string): boolean {
  const trimmed = chunk.trim();
  if (!trimmed) return true;

  // Check for common API response headers or raw JSON dumps
  if (
    trimmed.includes("status: 200") ||
    trimmed.includes('"status": 200') ||
    trimmed.includes("status: 500") ||
    trimmed.includes("json: {") ||
    trimmed.startsWith("HTTP/") ||
    (trimmed.startsWith("{") && trimmed.includes('"products"')) ||
    (trimmed.startsWith("{") && trimmed.includes('"token"'))
  ) {
    return false;
  }

  // Check for regex patterns identifying status/JSON contamination
  const rawApiRegex = /(status:\s*\d+|json:\s*\{|\{\s*["']?products["']?)/i;
  if (rawApiRegex.test(trimmed)) {
    return false;
  }

  return true;
}

/**
 * Progressive sanitizer to strip leading ```html or ``` and trailing ```
 * from HTML streams.
 */
export function cleanStreamingHtml(html: string): string {
  if (!html) return "";
  let cleaned = html.trimStart();
  // Strip leading ```html or ```
  cleaned = cleaned.replace(/^```html\s*/i, "");
  cleaned = cleaned.replace(/^```\s*/i, "");
  
  // Strip trailing ```
  let endCleaned = cleaned.trimEnd();
  if (endCleaned.endsWith("```")) {
    endCleaned = endCleaned.slice(0, -3).trimEnd();
  }
  return endCleaned;
}

/**
 * Decodes and parses an SSE-formatted readable stream.
 * Chunks are buffered to handle TCP fragmentation.
 * Only chunks matching the activeStreamId are kept.
 * Polluted or malformed chunks are discarded.
 *
 * @param reader - The stream reader
 * @param activeStreamId - The stream identifier to validate against
 * @param onChunk - Callback invoked with the updated accumulated text
 * @returns The final accumulated text
 */
export async function parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  activeStreamId: string,
  onChunk: (accumulated: string) => void
): Promise<string> {
  const decoder = new TextDecoder();
  let accumulatedText = "";
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const decoded = decoder.decode(value, { stream: true });
      buffer += decoded;

      let boundary;
      while ((boundary = buffer.indexOf("\n\n")) !== -1) {
        const message = buffer.substring(0, boundary).trim();
        buffer = buffer.substring(boundary + 2);

        if (message.startsWith("data: ")) {
          const dataStr = message.slice(6);
          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.streamId === activeStreamId) {
              const text = parsed.text;
              if (isValidStreamChunk(text)) {
                accumulatedText += text;
                const cleaned = cleanStreamingHtml(accumulatedText);
                onChunk(cleaned);
              } else {
                console.warn("Discarded polluted stream chunk:", text);
              }
            } else {
              console.warn(
                `Dropped chunk from unrelated streamId: ${parsed.streamId} (expected: ${activeStreamId})`
              );
            }
          } catch (e) {
            console.warn("Failed to parse stream packet JSON:", e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  return cleanStreamingHtml(accumulatedText);
}
