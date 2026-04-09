/**
 * CodeBlock component — syntax-highlighted code using native OpenTUI elements.
 *
 * Uses <text> with <span> children for per-token coloring.
 * No ANSI escape codes. No tree-sitter. Works in every terminal.
 */

import { RGBA } from "@opentui/core";

const COLORS = {
  keyword: "#c678dd",
  string: "#98c379",
  number: "#d19a66",
  comment: "#5c6370",
  default: "#abb2bf",
  bg: "#1a1a1a",
  border: "#333333",
};

const KEYWORD_RE =
  /\/\/.*$|#!.*$|#.*$|\/\*[\s\S]*?\*\/|(["'`])(?:(?!\1).)*?\1|\b(const|let|var|function|return|if|else|elif|for|while|import|export|from|class|new|async|await|try|catch|throw|typeof|instanceof|interface|type|enum|extends|implements|public|private|protected|static|readonly|abstract|def|self|True|False|None|fn|mut|pub|use|mod|struct|impl|trait|match|loop|package|main|func|go|chan|defer|select|case|switch|break|continue|range|nil|void|with|as|in|is|not|and|or|lambda|pass|raise|except|finally|assert|puts|require|module|begin|end|rescue|do|then|elsif|unless|until|val|object|print|println|fmt|string|int|float|bool|map|super|this|yield)\b|\b(\d+\.?\d*)\b/gm;

interface Token {
  text: string;
  color: string;
}

function tokenize(line: string): Token[] {
  const tokens: Token[] = [];
  let last = 0;
  let m: RegExpExecArray | null;

  KEYWORD_RE.lastIndex = 0;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop
  while ((m = KEYWORD_RE.exec(line)) !== null) {
    if (m.index > last) {
      tokens.push({ text: line.slice(last, m.index), color: COLORS.default });
    }
    const [match, quote, keyword, number] = m;
    if (match.startsWith("//") || match.startsWith("/*") || (match.startsWith("#") && !match.startsWith("#!"))) {
      tokens.push({ text: match, color: COLORS.comment });
    } else if (quote) {
      tokens.push({ text: match, color: COLORS.string });
    } else if (keyword) {
      tokens.push({ text: match, color: COLORS.keyword });
    } else if (number) {
      tokens.push({ text: match, color: COLORS.number });
    } else {
      tokens.push({ text: match, color: COLORS.default });
    }
    last = KEYWORD_RE.lastIndex;
  }
  if (last < line.length) {
    tokens.push({ text: line.slice(last), color: COLORS.default });
  }
  if (tokens.length === 0) {
    tokens.push({ text: " ", color: COLORS.default });
  }
  return tokens;
}

const bgColor = RGBA.fromHex(COLORS.bg);
const borderFg = RGBA.fromHex(COLORS.border);
const defaultFg = RGBA.fromHex(COLORS.default);

export function CodeBlock({ lang, lines }: { lang: string; lines: string[] }) {
  const label = lang || "code";

  return (
    <box flexDirection="column" flexShrink={0}>
      <text fg={borderFg}>{`  ┌─ ${label} ${"─".repeat(Math.max(1, 60 - label.length))}`}</text>
      {lines.map((line, i) => (
        <text key={`cl-${i}`} bg={bgColor} fg={defaultFg}>
          {tokenize(line).map((tok, j) => (
            <span key={`t-${j}`} fg={RGBA.fromHex(tok.color)}>
              {j === 0 ? `  │ ${tok.text}` : tok.text}
            </span>
          ))}
        </text>
      ))}
      <text fg={borderFg}>{`  └${"─".repeat(64)}`}</text>
    </box>
  );
}
