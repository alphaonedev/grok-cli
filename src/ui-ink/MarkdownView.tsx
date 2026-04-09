import chalk from "chalk";
import { Text } from "ink";
import { Marked } from "marked";
import { markedTerminal } from "marked-terminal";
import React, { useMemo } from "react";

// ── Prose styling ────────────────────────────────────────────────────────────

const proseOptions = {
  // Headers
  showSectionPrefix: false,
  firstHeading: chalk.hex("#FF79C6").bold.underline,
  heading: chalk.hex("#BD93F9").bold,

  // Text styles
  strong: chalk.hex("#F8F8F2").bold,
  em: chalk.hex("#F1FA8C").italic,
  del: chalk.hex("#6272A4").strikethrough,
  codespan: chalk.hex("#50FA7B").bgHex("#282A36"),

  // Links — show styled text, dim URL
  link: chalk.hex("#8BE9FD").underline,
  href: chalk.hex("#6272A4").dim,

  // Lists
  listitem: chalk.reset,

  // Blockquote — add left bar indicator
  blockquote: (text: string) => {
    const lines = text.split("\n");
    return lines.map((line) => chalk.hex("#44475A")("  │ ") + chalk.hex("#6272A4").italic(line)).join("\n");
  },

  // Horizontal rule — single clean line
  hr: () => chalk.hex("#44475A")("─".repeat(60)),

  // Tables — compact single-line, no padding
  tableOptions: {
    chars: {
      top: "─",
      "top-mid": "┬",
      "top-left": "┌",
      "top-right": "┐",
      bottom: "─",
      "bottom-mid": "┴",
      "bottom-left": "└",
      "bottom-right": "┘",
      left: "│",
      "left-mid": "├",
      mid: "─",
      "mid-mid": "┼",
      right: "│",
      "right-mid": "┤",
      middle: "│",
    },
    style: {
      head: ["cyan", "bold"],
      border: ["gray"],
      "padding-left": 1,
      "padding-right": 1,
    },
    colWidths: null,
    wordWrap: false,
  },

  // Code blocks — add language label, dark background
  code: (code: string) => chalk.bgHex("#282A36").hex("#F8F8F2")(code),

  // General
  tab: 2,
  width: 90,
  reflowText: false,
  paragraph: chalk.reset,
  image: chalk.hex("#6272A4").italic,

  // Unescape HTML entities
  unescape: true,
};

// ── Syntax highlighting theme ────────────────────────────────────────────────

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

// ── Build renderer ───────────────────────────────────────────────────────────

const extension = markedTerminal(proseOptions, { theme: syntaxTheme });

// Post-process: fix bullets (* → •) and add code block labels
function postProcess(text: string): string {
  // Replace asterisk bullets with dot bullets
  let result = text.replace(/^(\s+)\* /gm, "$1• ");
  result = result.replace(/^(\s+)\* /gm, "$1• "); // nested

  // Remove double horizontal rules (marked-terminal sometimes emits both styled and raw)
  result = result.replace(/─{10,}\n\s*-{3,}\n/g, "─".repeat(60) + "\n");
  result = result.replace(/\n-{3,}\n/g, "\n");

  // Clean up links: "Text (https://url)" → "Text — url" (compact, no parens)
  result = result.replace(/\(https?:\/\/([^)]+)\)/g, chalk.hex("#6272A4")("— $1"));

  // Clean up tables: remove empty lines between rows (caused by cli-table3 padding)
  result = result.replace(/│\n\n/g, "│\n");
  result = result.replace(/┤\n\n/g, "┤\n");

  return result;
}

const md = new Marked(extension);

export function MarkdownView({ content }: { content: string }) {
  const rendered = useMemo(() => {
    if (!content) return "";
    try {
      const raw = md.parse(content) as string;
      return postProcess(raw);
    } catch {
      return content;
    }
  }, [content]);

  return <Text>{rendered}</Text>;
}
