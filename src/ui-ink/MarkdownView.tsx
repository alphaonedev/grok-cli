import chalk from "chalk";
import { Text } from "ink";
import { Marked } from "marked";
import { markedTerminal } from "marked-terminal";
import React, { useMemo } from "react";

// ── Prose styling (headers, bold, italic, links, lists, etc.) ────────────────

const proseOptions = {
  // Headers — bold + colored, no # prefix
  showSectionPrefix: false,
  heading: chalk.hex("#BD93F9").bold, // vivid purple bold

  // Text styles
  strong: chalk.hex("#F8F8F2").bold, // bright white bold
  em: chalk.hex("#F1FA8C").italic, // vivid yellow italic
  del: chalk.hex("#6272A4").strikethrough, // gray strikethrough
  codespan: chalk.hex("#50FA7B").bgHex("#282A36"), // green on dark bg (inline code)

  // Links
  link: chalk.hex("#8BE9FD").underline, // cyan underline
  href: chalk.hex("#6272A4"), // muted gray for URL

  // Lists — use chalk.reset to not interfere with default numbering/bullets
  listitem: chalk.reset,

  // Blockquotes
  blockquote: chalk.hex("#6272A4").italic,

  // Horizontal rule
  hr: chalk.hex("#44475A"),

  // Tables
  tableOptions: {
    style: {
      head: ["cyan"],
      border: ["gray"],
    },
  },

  // Code blocks
  code: chalk.hex("#F8F8F2").bgHex("#282A36"),

  // Paragraph spacing
  tab: 2,
  width: 90,
  reflowText: false,

  // Images
  image: chalk.hex("#6272A4").italic,

  // First heading gets extra emphasis
  firstHeading: chalk.hex("#FF79C6").bold.underline,
};

// ── Syntax highlighting theme (inside code blocks) ───────────────────────────

const syntaxTheme = {
  keyword: chalk.hex("#FF5555").bold,
  built_in: chalk.hex("#55FFFF"),
  type: chalk.hex("#FF79C6"),
  literal: chalk.hex("#55FFFF").bold,
  number: chalk.hex("#FFB86C"),
  regexp: chalk.hex("#50FA7B"),
  string: chalk.hex("#F1FA8C"),
  subst: chalk.hex("#F8F8F2"),
  symbol: chalk.hex("#FFB86C"),
  class: chalk.hex("#FF79C6").bold,
  function: chalk.hex("#50FA7B").bold,
  title: chalk.hex("#50FA7B").bold,
  params: chalk.hex("#F8F8F2"),
  comment: chalk.hex("#6272A4").italic,
  doctag: chalk.hex("#6272A4").italic,
  meta: chalk.hex("#55FFFF"),
  "meta-keyword": chalk.hex("#FF5555"),
  "meta-string": chalk.hex("#F1FA8C"),
  section: chalk.hex("#BD93F9").bold,
  tag: chalk.hex("#FF79C6"),
  name: chalk.hex("#50FA7B"),
  attr: chalk.hex("#55FFFF"),
  attribute: chalk.hex("#55FFFF"),
  variable: chalk.hex("#FFB86C"),
  bullet: chalk.hex("#FFB86C"),
  code: chalk.hex("#F1FA8C"),
  emphasis: chalk.italic,
  strong: chalk.bold,
  formula: chalk.inverse,
  link: chalk.hex("#8BE9FD").underline,
  quote: chalk.hex("#6272A4").italic,
  addition: chalk.hex("#50FA7B").bold,
  deletion: chalk.hex("#FF5555").bold,
};

// ── Create renderer ──────────────────────────────────────────────────────────

const md = new Marked(markedTerminal(proseOptions, { theme: syntaxTheme }));

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
