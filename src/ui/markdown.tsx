/**
 * Markdown component — hybrid rendering.
 *
 * Splits content into markdown chunks and code blocks.
 * - Markdown chunks → OpenTUI <markdown> (headers, bold, italic, lists, tables, links)
 * - Code blocks → native OpenTUI <text> elements with fg/bg color props
 *
 * This bypasses OpenTUI's broken tree-sitter language injection
 * (only JS/TS/Zig load) while keeping everything else working.
 */

import { RGBA, SyntaxStyle } from "@opentui/core";
import { useMemo } from "react";
import type { Theme } from "./theme";

// Code highlighting colors (One Dark theme)
const C = {
  keyword: "#c678dd",
  string: "#98c379",
  number: "#d19a66",
  comment: "#5c6370",
  function: "#61afef",
  operator: "#56b6c2",
  type: "#e5c07b",
  default: "#abb2bf",
  bg: "#1a1a1a",
  border: "#333333",
  label: "#5c6370",
};

interface Token {
  text: string;
  color: string;
}

function tokenizeLine(line: string): Token[] {
  const tokens: Token[] = [];
  const TOKEN =
    /\/\/.*$|#!.*$|#.*$|\/\*[\s\S]*?\*\/|(["'`])(?:(?!\1).)*?\1|\b(const|let|var|function|return|if|else|elif|for|while|import|export|from|class|new|async|await|try|catch|throw|typeof|instanceof|interface|type|enum|extends|implements|public|private|protected|static|readonly|abstract|override|def|self|True|False|None|fn|mut|pub|use|mod|struct|impl|trait|match|loop|package|main|func|go|chan|defer|select|case|switch|break|continue|range|nil|void|char|double|long|short|unsigned|extern|union|template|namespace|using|virtual|final|super|this|yield|with|as|in|is|not|and|or|lambda|pass|raise|except|finally|global|assert|del|puts|require|module|begin|end|rescue|ensure|do|then|elsif|unless|until|when|val|object|sealed|lazy|where|rec|open|include|sig|functor|print|println|fmt|string|int|float|bool|map)\b|\b(\d+\.?\d*)\b/gm;

  let lastIndex = 0;
  let m: RegExpExecArray | null;

  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop
  while ((m = TOKEN.exec(line)) !== null) {
    // Text before this match
    if (m.index > lastIndex) {
      tokens.push({ text: line.slice(lastIndex, m.index), color: C.default });
    }

    const [match, quote, keyword, number] = m;
    if (match.startsWith("//") || match.startsWith("/*") || (match.startsWith("#") && !match.startsWith("#!"))) {
      tokens.push({ text: match, color: C.comment });
    } else if (quote) {
      tokens.push({ text: match, color: C.string });
    } else if (keyword) {
      tokens.push({ text: match, color: C.keyword });
    } else if (number) {
      tokens.push({ text: match, color: C.number });
    } else {
      tokens.push({ text: match, color: C.default });
    }

    lastIndex = TOKEN.lastIndex;
  }

  // Remaining text
  if (lastIndex < line.length) {
    tokens.push({ text: line.slice(lastIndex), color: C.default });
  }

  if (tokens.length === 0) {
    tokens.push({ text: " ", color: C.default });
  }

  return tokens;
}

interface Chunk {
  type: "markdown" | "codeblock";
  content: string;
  lang?: string;
  lines?: string[];
}

function splitContent(content: string): Chunk[] {
  const chunks: Chunk[] = [];
  const lines = content.split("\n");
  let mdLines: string[] = [];
  let codeLines: string[] = [];
  let inCode = false;
  let codeLang = "";

  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      if (inCode) {
        // End code block
        chunks.push({ type: "codeblock", content: "", lang: codeLang, lines: codeLines });
        codeLines = [];
        codeLang = "";
        inCode = false;
      } else {
        // Start code block — flush markdown
        if (mdLines.length > 0) {
          chunks.push({ type: "markdown", content: mdLines.join("\n") });
          mdLines = [];
        }
        inCode = true;
        codeLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCode) {
      codeLines.push(line);
    } else {
      mdLines.push(line);
    }
  }

  // Flush remaining
  if (mdLines.length > 0) {
    chunks.push({ type: "markdown", content: mdLines.join("\n") });
  }

  return chunks;
}

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

function CodeBlock({ lang, lines }: { lang: string; lines: string[] }) {
  const borderFg = RGBA.fromHex(C.border);
  const bgColor = RGBA.fromHex(C.bg);
  const label = lang || "code";
  // Fixed width for consistent box
  const W = 80;
  const topRule = "─".repeat(Math.max(0, W - label.length - 4));
  const botRule = "─".repeat(W);

  return (
    <box flexDirection="column" flexShrink={0} marginTop={1} marginBottom={1}>
      <text fg={borderFg}>{`┌─ ${label} ${topRule}`}</text>
      {lines.map((line, i) => {
        const tokens = tokenizeLine(line);
        const textLen = tokens.reduce((sum, tok) => sum + tok.text.length, 0);
        const pad = Math.max(0, W - textLen - 2);
        return (
          <text key={i} bg={bgColor} fg={RGBA.fromHex(C.default)}>
            <span> </span>
            {tokens.map((tok, j) => (
              <span key={j} fg={RGBA.fromHex(tok.color)}>
                {tok.text}
              </span>
            ))}
            <span>{" ".repeat(pad + 1)}</span>
          </text>
        );
      })}
      <text fg={borderFg}>{`└${botRule}`}</text>
    </box>
  );
}

export function Markdown({ content, t }: { content: string; t: Theme }) {
  const syntaxStyle = useMemo(() => buildSyntaxStyle(t), [t]);
  const chunks = useMemo(() => splitContent(content), [content]);

  return (
    <box flexDirection="column" flexShrink={0}>
      {chunks.map((chunk, i) =>
        chunk.type === "markdown" ? (
          <markdown
            key={i}
            content={chunk.content}
            syntaxStyle={syntaxStyle}
            conceal={true}
            // @ts-expect-error MarkdownProps omits inherited Renderable.selectable
            selectable={true}
            tableOptions={TABLE_OPTIONS}
            flexShrink={0}
          />
        ) : (
          <CodeBlock key={i} lang={chunk.lang || ""} lines={chunk.lines || []} />
        ),
      )}
    </box>
  );
}
