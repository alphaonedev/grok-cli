import chalk from "chalk";
import { Text } from "ink";
import { Marked } from "marked";
import { markedTerminal } from "marked-terminal";
import React, { useMemo } from "react";

// GitHub-inspired bright syntax theme
const GITHUB_THEME = {
  keyword: chalk.hex("#ff7b72"), // bright red-orange (like GitHub)
  built_in: chalk.hex("#79c0ff"), // bright blue
  type: chalk.hex("#ff7b72"), // bright red-orange
  literal: chalk.hex("#79c0ff"), // bright blue
  number: chalk.hex("#79c0ff"), // bright blue
  regexp: chalk.hex("#7ee787"), // bright green
  string: chalk.hex("#a5d6ff"), // light blue
  subst: chalk.hex("#c9d1d9"), // light gray
  symbol: chalk.hex("#ffa657"), // orange
  class: chalk.hex("#ffa657"), // orange
  function: chalk.hex("#d2a8ff"), // purple
  title: chalk.hex("#d2a8ff"), // purple
  params: chalk.hex("#c9d1d9"), // light gray
  comment: chalk.hex("#8b949e"), // medium gray
  doctag: chalk.hex("#8b949e"), // medium gray
  meta: chalk.hex("#79c0ff"), // bright blue
  "meta-keyword": chalk.hex("#ff7b72"),
  "meta-string": chalk.hex("#a5d6ff"),
  section: chalk.hex("#d2a8ff").bold, // purple bold
  tag: chalk.hex("#7ee787"), // bright green
  name: chalk.hex("#7ee787"), // bright green
  attr: chalk.hex("#79c0ff"), // bright blue
  attribute: chalk.hex("#79c0ff"), // bright blue
  variable: chalk.hex("#ffa657"), // orange
  bullet: chalk.hex("#ffa657"), // orange
  code: chalk.hex("#a5d6ff"), // light blue
  emphasis: chalk.italic,
  strong: chalk.bold,
  formula: chalk.inverse,
  link: chalk.hex("#79c0ff").underline,
  quote: chalk.hex("#8b949e").italic,
  addition: chalk.hex("#7ee787"), // green
  deletion: chalk.hex("#ff7b72"), // red
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
      theme: GITHUB_THEME,
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
