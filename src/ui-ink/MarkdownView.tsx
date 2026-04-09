import chalk from "chalk";
import { Text } from "ink";
import { Marked } from "marked";
import { markedTerminal } from "marked-terminal";
import React, { useMemo } from "react";

// Vivid neon syntax theme — maximum contrast on dark backgrounds
const VIVID_THEME = {
  keyword: chalk.hex("#FF5555").bold, // vivid red
  built_in: chalk.hex("#55FFFF"), // vivid cyan
  type: chalk.hex("#FF79C6"), // hot pink
  literal: chalk.hex("#55FFFF").bold, // vivid cyan bold
  number: chalk.hex("#FFB86C"), // vivid orange
  regexp: chalk.hex("#50FA7B"), // vivid green
  string: chalk.hex("#F1FA8C"), // vivid yellow
  subst: chalk.hex("#F8F8F2"), // white
  symbol: chalk.hex("#FFB86C"), // vivid orange
  class: chalk.hex("#FF79C6").bold, // hot pink bold
  function: chalk.hex("#50FA7B").bold, // vivid green bold
  title: chalk.hex("#50FA7B").bold, // vivid green bold
  params: chalk.hex("#F8F8F2"), // white
  comment: chalk.hex("#6272A4").italic, // muted blue italic
  doctag: chalk.hex("#6272A4").italic, // muted blue italic
  meta: chalk.hex("#55FFFF"), // vivid cyan
  "meta-keyword": chalk.hex("#FF5555"),
  "meta-string": chalk.hex("#F1FA8C"),
  section: chalk.hex("#BD93F9").bold, // vivid purple bold
  tag: chalk.hex("#FF79C6"), // hot pink
  name: chalk.hex("#50FA7B"), // vivid green
  attr: chalk.hex("#55FFFF"), // vivid cyan
  attribute: chalk.hex("#55FFFF"), // vivid cyan
  variable: chalk.hex("#FFB86C"), // vivid orange
  bullet: chalk.hex("#FFB86C"), // vivid orange
  code: chalk.hex("#F1FA8C"), // vivid yellow
  emphasis: chalk.italic,
  strong: chalk.bold,
  formula: chalk.inverse,
  link: chalk.hex("#8BE9FD").underline, // bright cyan underline
  quote: chalk.hex("#6272A4").italic, // muted blue italic
  addition: chalk.hex("#50FA7B").bold, // vivid green
  deletion: chalk.hex("#FF5555").bold, // vivid red
};

const md = new Marked(
  markedTerminal({
    showSectionPrefix: false,
    tab: 2,
  }),
);

// Override the highlight options by patching the renderer
const mdHighlight = new Marked(
  markedTerminal(
    {
      showSectionPrefix: false,
      tab: 2,
    },
    {
      theme: VIVID_THEME,
    },
  ),
);

export function MarkdownView({ content }: { content: string }) {
  const rendered = useMemo(() => {
    if (!content) return "";
    try {
      return mdHighlight.parse(content) as string;
    } catch {
      return content;
    }
  }, [content]);

  return <Text>{rendered}</Text>;
}
