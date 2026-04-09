/**
 * Markdown component — pre-renders markdown to ANSI-styled text.
 *
 * Replaces OpenTUI's <markdown> component which relies on concealment
 * escape sequences that Apple Terminal.app doesn't support.
 *
 * Uses terminal-markdown.ts to convert markdown → ANSI, then renders
 * as a plain <text> element in OpenTUI. Works in every terminal.
 */

import { useMemo } from "react";
import { containsMarkdown, renderMarkdown } from "../utils/terminal-markdown";
import type { Theme } from "./theme";

export function Markdown({ content, t: _t }: { content: string; t: Theme }) {
  const rendered = useMemo(() => {
    if (!content) return "";
    if (containsMarkdown(content)) {
      return renderMarkdown(content);
    }
    return content;
  }, [content]);

  return <text flexShrink={0}>{rendered}</text>;
}
