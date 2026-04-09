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
    // Language injection syntax highlighting (JS/TS/Zig)
    variable: { fg: RGBA.fromHex(t.mdCodeBlockFg) },
    property: { fg: RGBA.fromHex(t.mdCodeBlockFg) },
    function: { fg: RGBA.fromHex("#61afef") },
    "function.method": { fg: RGBA.fromHex("#61afef") },
    "function.builtin": { fg: RGBA.fromHex("#61afef") },
    keyword: { fg: RGBA.fromHex("#c678dd") },
    "keyword.return": { fg: RGBA.fromHex("#c678dd") },
    "keyword.function": { fg: RGBA.fromHex("#c678dd") },
    "keyword.import": { fg: RGBA.fromHex("#c678dd") },
    "keyword.export": { fg: RGBA.fromHex("#c678dd") },
    "keyword.operator": { fg: RGBA.fromHex("#c678dd") },
    "keyword.conditional": { fg: RGBA.fromHex("#c678dd") },
    "keyword.repeat": { fg: RGBA.fromHex("#c678dd") },
    string: { fg: RGBA.fromHex("#98c379") },
    "string.special": { fg: RGBA.fromHex("#98c379") },
    number: { fg: RGBA.fromHex("#d19a66") },
    "number.float": { fg: RGBA.fromHex("#d19a66") },
    boolean: { fg: RGBA.fromHex("#d19a66") },
    comment: { fg: RGBA.fromHex("#5c6370") },
    "comment.line": { fg: RGBA.fromHex("#5c6370") },
    "comment.block": { fg: RGBA.fromHex("#5c6370") },
    operator: { fg: RGBA.fromHex("#56b6c2") },
    punctuation: { fg: RGBA.fromHex(t.mdCodeBlockFg) },
    "punctuation.bracket": { fg: RGBA.fromHex(t.mdCodeBlockFg) },
    "punctuation.delimiter": { fg: RGBA.fromHex(t.mdCodeBlockFg) },
    type: { fg: RGBA.fromHex("#e5c07b") },
    "type.builtin": { fg: RGBA.fromHex("#e5c07b") },
    constant: { fg: RGBA.fromHex("#d19a66") },
    "constant.builtin": { fg: RGBA.fromHex("#d19a66") },
    label: { fg: RGBA.fromHex("#5c6370") },
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

export function Markdown({ content, t }: { content: string; t: Theme }) {
  const syntaxStyle = useMemo(() => buildSyntaxStyle(t), [t]);

  return (
    <markdown
      content={content}
      syntaxStyle={syntaxStyle}
      conceal={true}
      // @ts-expect-error MarkdownProps omits inherited Renderable.selectable; needed for TUI text selection
      selectable={true}
      tableOptions={TABLE_OPTIONS}
      flexShrink={0}
    />
  );
}
