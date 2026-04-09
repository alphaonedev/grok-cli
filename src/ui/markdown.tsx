import { RGBA, SyntaxStyle } from "@opentui/core";
import { useMemo } from "react";
import { CodeBlock } from "./code-block";
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

interface Chunk {
  kind: "md" | "code";
  text: string;
  lang: string;
  lines: string[];
}

function splitChunks(content: string): Chunk[] {
  const chunks: Chunk[] = [];
  const lines = content.split("\n");
  let md: string[] = [];
  let code: string[] = [];
  let inCode = false;
  let lang = "";

  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      if (inCode) {
        chunks.push({ kind: "code", text: "", lang, lines: code });
        code = [];
        lang = "";
        inCode = false;
      } else {
        if (md.length > 0) {
          chunks.push({ kind: "md", text: md.join("\n"), lang: "", lines: [] });
          md = [];
        }
        inCode = true;
        lang = line.trim().slice(3).trim();
      }
    } else if (inCode) {
      code.push(line);
    } else {
      md.push(line);
    }
  }
  if (md.length > 0) {
    chunks.push({ kind: "md", text: md.join("\n"), lang: "", lines: [] });
  }
  return chunks;
}

export function Markdown({ content, t }: { content: string; t: Theme }) {
  const syntaxStyle = useMemo(() => buildSyntaxStyle(t), [t]);
  const chunks = useMemo(() => splitChunks(content), [content]);

  // No code blocks — use <markdown> directly (fastest path)
  if (chunks.length === 1 && chunks[0].kind === "md") {
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

  // Mixed content — split into markdown + code block chunks
  return (
    <box flexDirection="column" flexShrink={0}>
      {chunks.map((chunk, i) =>
        chunk.kind === "md" ? (
          <markdown
            key={`md-${i}`}
            content={chunk.text}
            syntaxStyle={syntaxStyle}
            conceal={true}
            // @ts-expect-error MarkdownProps omits inherited Renderable.selectable
            selectable={true}
            tableOptions={TABLE_OPTIONS}
            flexShrink={0}
          />
        ) : (
          <CodeBlock key={`cb-${i}`} lang={chunk.lang} lines={chunk.lines} />
        ),
      )}
    </box>
  );
}
