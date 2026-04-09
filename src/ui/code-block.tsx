/**
 * CodeBlock — syntax-highlighted code using native OpenTUI elements.
 *
 * Clean design: language label on top, dark background, left accent bar,
 * no right border. Matches Claude Code's code block style.
 */

import { RGBA } from "@opentui/core";

const C = {
  keyword: "#c678dd",
  string: "#98c379",
  number: "#d19a66",
  comment: "#5c6370",
  default: "#abb2bf",
  bg: "#1e1e1e",
  accent: "#3b3b3b",
  label: "#6a6a6a",
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
  KEYWORD_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  // biome-ignore lint/suspicious/noAssignInExpressions: standard regex exec loop
  while ((m = KEYWORD_RE.exec(line)) !== null) {
    if (m.index > last) tokens.push({ text: line.slice(last, m.index), color: C.default });
    const [match, quote, keyword, number] = m;
    if (match.startsWith("//") || match.startsWith("/*") || (match.startsWith("#") && !match.startsWith("#!")))
      tokens.push({ text: match, color: C.comment });
    else if (quote) tokens.push({ text: match, color: C.string });
    else if (keyword) tokens.push({ text: match, color: C.keyword });
    else if (number) tokens.push({ text: match, color: C.number });
    else tokens.push({ text: match, color: C.default });
    last = KEYWORD_RE.lastIndex;
  }
  if (last < line.length) tokens.push({ text: line.slice(last), color: C.default });
  if (tokens.length === 0) tokens.push({ text: " ", color: C.default });
  return tokens;
}

const bg = RGBA.fromHex(C.bg);
const accent = RGBA.fromHex(C.accent);
const labelFg = RGBA.fromHex(C.label);
const defaultFg = RGBA.fromHex(C.default);

export function CodeBlock({ lang, lines }: { lang: string; lines: string[] }) {
  return (
    <box flexDirection="column" flexShrink={0}>
      <text fg={labelFg} bg={accent}>{`  ${lang || "code"}  `}</text>
      {lines.map((line, i) => (
        <text key={`cl-${i}`} bg={bg} fg={defaultFg}>
          {tokenize(line).map((tok, j) => (
            <span key={`t-${j}`} fg={RGBA.fromHex(tok.color)}>
              {j === 0 ? `  ${tok.text}` : tok.text}
            </span>
          ))}
        </text>
      ))}
    </box>
  );
}
