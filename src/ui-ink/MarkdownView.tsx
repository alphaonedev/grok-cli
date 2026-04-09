import { Text } from "ink";
import { Marked } from "marked";
import markedTerminal from "marked-terminal";
import React, { useMemo } from "react";

const md = new Marked(markedTerminal());

export function MarkdownView({ content }: { content: string }) {
  const rendered = useMemo(() => {
    if (!content) return "";
    try {
      return md.parse(content) as string;
    } catch {
      return content;
    }
  }, [content]);

  return <Text>{rendered}</Text>;
}
