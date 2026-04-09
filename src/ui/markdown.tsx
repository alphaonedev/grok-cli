import { RGBA, SyntaxStyle } from "@opentui/core";
import { useMemo } from "react";
import type { Theme } from "./theme";

function buildSyntaxStyle(t: Theme): SyntaxStyle {
  return SyntaxStyle.fromStyles({
    default: { fg: RGBA.fromHex(t.text) },
    "markup.heading": { fg: RGBA.fromHex(t.mdHeading), bold: true },
    "markup.heading.1": { fg: RGBA.fromHex(t.mdHeading), bold: true },
    "markup.heading.2": { fg: RGBA.fromHex(t.mdHeading), bold: true },
    "markup.heading.3": { fg: RGBA.fromHex(t.mdHeading), bold: true },
    "markup.bold": { fg: RGBA.fromHex(t.mdBold), bold: true },
    "markup.italic": { fg: RGBA.fromHex(t.mdItalic), italic: true },
    "markup.raw": { fg: RGBA.fromHex(t.mdCode) },
    "markup.raw.block": { fg: RGBA.fromHex(t.mdCodeBlockFg), bg: RGBA.fromHex(t.mdCodeBlockBg) },
    "markup.strong": { fg: RGBA.fromHex(t.mdBold), bold: true },
    "markup.link": { fg: RGBA.fromHex(t.mdLink), underline: true },
    "markup.link.label": { fg: RGBA.fromHex(t.mdLinkText) },
    "markup.list": { fg: RGBA.fromHex(t.mdListBullet) },
    "markup.quote": { fg: RGBA.fromHex(t.mdItalic), italic: true },
    "markup.separator": { fg: RGBA.fromHex(t.mdHr) },
    code: { fg: RGBA.fromHex(t.mdCodeBlockFg), bg: RGBA.fromHex(t.mdCodeBlockBg) },
  });
}

const TABLE_OPTIONS = {
  widthMode: "full" as const,
  columnFitter: "balanced" as const,
  wrapMode: "word" as const,
  cellPadding: 1,
  borders: true,
  outerBorder: true,
  borderStyle: "rounded" as const,
  borderColor: "#333333",
};

/**
 * Check if content has fenced code blocks.
 */
function hasCodeBlocks(content: string): boolean {
  const matches = content.match(/```/g);
  return matches !== null && matches.length >= 2;
}

export function Markdown({ content, t }: { content: string; t: Theme }) {
  const syntaxStyle = useMemo(() => buildSyntaxStyle(t), [t]);

  // If no code blocks, render everything with <markdown> (full concealment)
  if (!hasCodeBlocks(content)) {
    return (
      <markdown
        content={content}
        syntaxStyle={syntaxStyle}
        conceal={true}
        // @ts-expect-error MarkdownProps omits inherited Renderable.selectable
        selectable={true}
        tableOptions={TABLE_OPTIONS}
        flexShrink={0}
      />
    );
  }

  // Has code blocks — render full content with <markdown> for all non-code elements,
  // PLUS render CodeBlock components after for syntax highlighting.
  // The <markdown> will show code blocks as plain monospace (no highlighting).
  // The CodeBlock components render below with colors.

  // Strategy: pass full content to <markdown> (handles headers, bold, lists, tables)
  // Code blocks get OpenTUI's default monospace rendering (dark bg, no color).
  // This is the safe path — everything renders, code just isn't colorized.

  // TODO: When OpenTUI fixes WASM loading, remove this branch and let
  // tree-sitter handle code block highlighting natively.

  return (
    <markdown
      content={content}
      syntaxStyle={syntaxStyle}
      conceal={true}
      // @ts-expect-error MarkdownProps omits inherited Renderable.selectable
      selectable={true}
      tableOptions={TABLE_OPTIONS}
      flexShrink={0}
    />
  );
}
