/**
 * Markdown component — hybrid rendering.
 *
 * OpenTUI's <markdown> handles: headers, bold, italic, lists, tables,
 * links, blockquotes, horizontal rules (via tree-sitter concealment).
 *
 * Code blocks are pre-rendered with our ANSI syntax highlighter
 * (terminal-markdown.ts) because OpenTUI's tree-sitter language
 * injection only supports JS/TS/Zig. We support 25+ languages.
 *
 * The pre-processed content replaces fenced code blocks with
 * indented code (which OpenTUI renders as monospace without
 * attempting tree-sitter injection), with ANSI colors already applied.
 */

import { RGBA, SyntaxStyle } from "@opentui/core";
import { useMemo } from "react";
import type { Theme } from "./theme";

// ANSI codes for code block highlighting
const ESC = "\x1b";
const RESET = `${ESC}[0m`;
const GRAY = `${ESC}[90m`;
const GREEN = `${ESC}[32m`;
const YELLOW = `${ESC}[33m`;
const MAGENTA = `${ESC}[35m`;
const BG_DARK = `${ESC}[48;5;236m`;

function highlightCode(code: string): string {
  const TOKEN =
    /\/\/.*$|#!.*$|#.*$|\/\*[\s\S]*?\*\/|(["'`])(?:(?!\1).)*?\1|\b(const|let|var|function|return|if|else|elif|for|while|import|export|from|class|new|async|await|try|catch|throw|typeof|instanceof|interface|type|enum|extends|implements|public|private|protected|static|readonly|abstract|override|def|self|True|False|None|fn|mut|pub|use|mod|struct|impl|trait|match|loop|package|main|func|go|chan|defer|select|case|switch|break|continue|range|map|nil|string|int|float|bool|void|char|double|long|short|unsigned|signed|extern|volatile|register|union|template|namespace|using|virtual|final|super|this|yield|with|as|in|is|not|and|or|lambda|pass|raise|except|finally|global|nonlocal|assert|del|print|puts|require|module|begin|end|rescue|ensure|do|then|elsif|unless|until|when|next|redo|retry|proc|val|var|object|sealed|lazy|override|implicit|where|let|rec|open|include|sig|functor)\b|\b(\d+\.?\d*)\b/gm;

  return code.replace(TOKEN, (match, quote, keyword, number) => {
    if (match.startsWith("//") || match.startsWith("/*") || (match.startsWith("#") && !match.startsWith("#!")))
      return `${GRAY}${match}${RESET}${BG_DARK}`;
    if (quote) return `${GREEN}${match}${RESET}${BG_DARK}`;
    if (keyword) return `${MAGENTA}${match}${RESET}${BG_DARK}`;
    if (number) return `${YELLOW}${match}${RESET}${BG_DARK}`;
    return match;
  });
}

/**
 * Pre-process markdown: extract fenced code blocks and replace with
 * ANSI-highlighted indented code. OpenTUI renders indented code as
 * monospace without tree-sitter injection.
 */
function preprocessCodeBlocks(md: string): string {
  const lines = md.split("\n");
  const output: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = "";
  let codeLines: string[] = [];

  for (const line of lines) {
    if (line.trimStart().startsWith("```")) {
      if (inCodeBlock) {
        // End code block — render highlighted
        // Leading space on every line prevents OpenTUI from consuming the first visible character
        const lang = codeBlockLang || "code";
        const header = ` ${GRAY}┌─ ${lang} ${"─".repeat(Math.max(0, 40 - lang.length))}${RESET}`;
        const footer = ` ${GRAY}└${"─".repeat(44)}${RESET}`;
        output.push(header);
        for (const cl of codeLines) {
          // Ensure empty lines still show dark background
          const content = cl || " ";
          output.push(` ${BG_DARK} ${highlightCode(content)} ${RESET}`);
        }
        output.push(footer);
        inCodeBlock = false;
        codeLines = [];
        codeBlockLang = "";
      } else {
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
    } else {
      output.push(line);
    }
  }

  return output.join("\n");
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

export function Markdown({ content, t }: { content: string; t: Theme }) {
  const syntaxStyle = useMemo(() => buildSyntaxStyle(t), [t]);
  const processed = useMemo(() => preprocessCodeBlocks(content), [content]);

  return (
    <markdown
      content={processed}
      syntaxStyle={syntaxStyle}
      conceal={true}
      // @ts-expect-error MarkdownProps omits inherited Renderable.selectable; needed for TUI text selection
      selectable={true}
      tableOptions={TABLE_OPTIONS}
      flexShrink={0}
    />
  );
}
