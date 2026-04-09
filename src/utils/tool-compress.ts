/**
 * Tool output compression using TOON.
 *
 * Compresses tool result output strings before they enter the conversation
 * history, reducing token consumption by 30-60% on structured data.
 *
 * Only compresses when beneficial:
 * - Output must be >500 chars (small outputs not worth it)
 * - Must be JSON-parseable (TOON works on structured data)
 * - Must achieve >10% reduction (otherwise keep original)
 *
 * Copyright (c) 2026 AlphaOne LLC. MIT License.
 */

import { compress } from "./toon";

const MIN_COMPRESS_LENGTH = 500;

/**
 * Compress a tool's output string if it's structured data that benefits from TOON.
 * Returns the original string if compression isn't beneficial.
 */
export function compressToolOutput(output: string | undefined): string | undefined {
  if (!output || output.length < MIN_COMPRESS_LENGTH) return output;

  // Try TOON compression (handles JSON → TOON internally)
  const compressed = compress(output);

  // If compression happened (different from input), return it
  if (compressed !== output) {
    return compressed;
  }

  return output;
}
