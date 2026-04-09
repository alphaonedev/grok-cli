/**
 * Terminal Markdown Renderer — ANSI-formatted markdown for headless output.
 *
 * Converts markdown to styled terminal output with:
 * - Bold headers with color
 * - Syntax-highlighted code blocks (basic keyword coloring)
 * - Colored inline code
 * - Bold/italic via ANSI escapes
 * - Aligned tables with box-drawing
 * - Bullet/numbered lists with indent
 * - OSC 8 clickable links (iTerm2, WezTerm, Kitty, Ghostty)
 * - Horizontal rules
 *
 * Copyright (c) 2026 AlphaOne LLC. MIT License.
 */

// ANSI escape codes
const ESC = "\x1b";
const RESET = `${ESC}[0m`;
const BOLD = `${ESC}[1m`;
const DIM = `${ESC}[2m`;
const ITALIC = `${ESC}[3m`;
const UNDERLINE = `${ESC}[4m`;
const CYAN = `${ESC}[36m`;
const GREEN = `${ESC}[32m`;
const YELLOW = `${ESC}[33m`;
const BLUE = `${ESC}[34m`;
const MAGENTA = `${ESC}[35m`;
const GRAY = `${ESC}[90m`;
const WHITE = `${ESC}[97m`;
const BG_DARK = `${ESC}[48;5;236m`;

/**
 * Detect if terminal supports OSC 8 hyperlinks.
 */
function supportsHyperlinks(): boolean {
  const term = process.env.TERM_PROGRAM || "";
  const termNames = ["iterm.app", "wezterm", "kitty", "ghostty", "vscode", "hyper"];
  return termNames.some((t) => term.toLowerCase().includes(t));
}

/**
 * Wrap a URL as an OSC 8 clickable link if terminal supports it.
 */
function hyperlink(url: string, text?: string): string {
  const display = text || url;
  if (supportsHyperlinks()) {
    return `${ESC}]8;;${url}${ESC}\\${UNDERLINE}${BLUE}${display}${RESET}${ESC}]8;;${ESC}\\`;
  }
  return `${UNDERLINE}${BLUE}${display}${RESET}`;
}

/**
 * Basic syntax keyword highlighting for code blocks.
 */
function highlightCode(code: string, _lang?: string): string {
  // Single-pass tokenizer to avoid ANSI codes being matched by subsequent regexes
  const TOKEN =
    /\/\/.*$|#!.*$|#.*$|\/\*[\s\S]*?\*\/|(["'`])(?:(?!\1).)*?\1|\b(const|let|var|function|return|if|else|for|while|import|export|from|class|new|async|await|try|catch|throw|typeof|instanceof|interface|type|enum|extends|implements|public|private|protected|static|readonly|abstract|override|def|self|True|False|None|fn|mut|pub|use|mod|struct|impl|trait|match|loop)\b|\b(\d+\.?\d*)\b/gm;

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
 * Render a markdown table as aligned box-drawing output.
 */
function renderTable(lines: string[]): string {
  // Parse rows
  const rows = lines
    .filter((l) => l.trim())
    .map((l) =>
      l
        .split("|")
        .map((c) => c.trim())
        .filter((c) => c),
    );

  if (rows.length < 2) return lines.join("\n");

  // Remove separator row (---|---|---)
  const dataRows = rows.filter((r) => !r.every((c) => /^[-:]+$/.test(c)));
  if (dataRows.length === 0) return lines.join("\n");

  // Calculate column widths
  const colCount = Math.max(...dataRows.map((r) => r.length));
  const widths = Array.from({ length: colCount }, (_, i) => Math.max(...dataRows.map((r) => (r[i] || "").length), 3));

  const pad = (s: string, w: number) => s + " ".repeat(Math.max(0, w - s.length));
  const border = (l: string, m: string, r: string) =>
    `${GRAY}${l}${widths.map((w) => "─".repeat(w + 2)).join(m)}${r}${RESET}`;

  const out: string[] = [];
  out.push(border("┌", "┬", "┐"));

  dataRows.forEach((row, ri) => {
    const cells = widths.map((w, ci) => ` ${pad(row[ci] || "", w)} `);
    if (ri === 0) {
      out.push(`${GRAY}│${RESET}${BOLD}${cells.join(`${GRAY}│${RESET}${BOLD}`)}${RESET}${GRAY}│${RESET}`);
      out.push(border("├", "┼", "┤"));
    } else {
      out.push(`${GRAY}│${RESET}${cells.join(`${GRAY}│${RESET}`)}${GRAY}│${RESET}`);
    }
  });

  out.push(border("└", "┴", "┘"));
  return out.join("\n");
}

/**
 * Render inline markdown formatting (bold, italic, code, links).
 */
function renderInline(text: string): string {
  let result = text;

  // Links: [text](url)
  result = result.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_m, linkText, url) => hyperlink(url, linkText));

  // Inline code: `code`
  result = result.replace(/`([^`]+)`/g, `${BG_DARK}${CYAN} $1 ${RESET}`);

  // Bold + italic: ***text*** or ___text___
  result = result.replace(/\*{3}(.+?)\*{3}/g, `${BOLD}${ITALIC}$1${RESET}`);
  result = result.replace(/_{3}(.+?)_{3}/g, `${BOLD}${ITALIC}$1${RESET}`);

  // Bold: **text** or __text__
  result = result.replace(/\*{2}(.+?)\*{2}/g, `${BOLD}$1${RESET}`);
  result = result.replace(/_{2}(.+?)_{2}/g, `${BOLD}$1${RESET}`);

  // Italic: *text* or _text_
  result = result.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, `${ITALIC}$1${RESET}`);
  result = result.replace(/(?<!_)_(?!_)(.+?)(?<!_)_(?!_)/g, `${ITALIC}$1${RESET}`);

  return result;
}

/**
 * Render markdown text as ANSI-formatted terminal output.
 */
export function renderMarkdown(markdown: string): string {
  const lines = markdown.split("\n");
  const output: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = "";
  let codeLines: string[] = [];
  let inTable = false;
  let tableLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block toggle
    if (line.trimStart().startsWith("```")) {
      if (inCodeBlock) {
        // End code block
        const highlighted = codeLines.map((cl) => `${BG_DARK} ${highlightCode(cl, codeBlockLang)} ${RESET}`);
        output.push(
          `${GRAY}┌─ ${codeBlockLang || "code"} ${"─".repeat(Math.max(0, 40 - (codeBlockLang || "code").length))}${RESET}`,
        );
        output.push(...highlighted);
        output.push(`${GRAY}└${"─".repeat(44)}${RESET}`);
        inCodeBlock = false;
        codeLines = [];
        codeBlockLang = "";
      } else {
        // Flush table if active
        if (inTable) {
          output.push(renderTable(tableLines));
          inTable = false;
          tableLines = [];
        }
        inCodeBlock = true;
        codeBlockLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Table detection
    if (line.includes("|") && line.trim().startsWith("|")) {
      if (!inTable) inTable = true;
      tableLines.push(line);
      continue;
    }
    if (inTable) {
      output.push(renderTable(tableLines));
      inTable = false;
      tableLines = [];
    }

    // Headers
    if (line.startsWith("### ")) {
      output.push(`${BOLD}${YELLOW}   ${line.slice(4)}${RESET}`);
      continue;
    }
    if (line.startsWith("## ")) {
      output.push(`${BOLD}${CYAN}  ${line.slice(3)}${RESET}`);
      continue;
    }
    if (line.startsWith("# ")) {
      output.push(`${BOLD}${WHITE}${line.slice(2)}${RESET}`);
      output.push(`${GRAY}${"─".repeat(Math.min(line.length + 10, 60))}${RESET}`);
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      output.push(`${GRAY}${"─".repeat(60)}${RESET}`);
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      output.push(`${GRAY}│${RESET} ${ITALIC}${line.slice(2)}${RESET}`);
      continue;
    }

    // Unordered list
    if (/^\s*[-*+]\s/.test(line)) {
      const indent = line.match(/^(\s*)/)?.[1] || "";
      const content = line.replace(/^\s*[-*+]\s/, "");
      output.push(`${indent}  ${CYAN}•${RESET} ${renderInline(content)}`);
      continue;
    }

    // Ordered list
    if (/^\s*\d+\.\s/.test(line)) {
      const match = line.match(/^(\s*)(\d+)\.\s(.*)/);
      if (match) {
        output.push(`${match[1]}  ${CYAN}${match[2]}.${RESET} ${renderInline(match[3])}`);
        continue;
      }
    }

    // Regular text
    output.push(renderInline(line));
  }

  // Flush remaining table
  if (inTable) {
    output.push(renderTable(tableLines));
  }

  return output.join("\n");
}

/**
 * Check if text contains markdown formatting worth rendering.
 */
export function containsMarkdown(text: string): boolean {
  return /^#{1,3}\s|```|\*\*|__|\[.*\]\(.*\)|^\s*[-*+]\s|^\|.*\|/m.test(text);
}
