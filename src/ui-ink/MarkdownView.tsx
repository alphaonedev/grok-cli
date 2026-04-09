import chalk from "chalk";
import { Text } from "ink";
import { Marked } from "marked";
import { markedTerminal } from "marked-terminal";
import React, { useMemo } from "react";

// Minimal prose options — only colors, don't override structural rendering
const md = new Marked(
  markedTerminal(
    {
      // Headers
      showSectionPrefix: false,
      firstHeading: chalk.hex("#FF79C6").bold.underline,
      heading: chalk.hex("#BD93F9").bold,

      // Inline styles
      strong: chalk.hex("#F8F8F2").bold,
      em: chalk.hex("#F1FA8C").italic,
      del: chalk.hex("#6272A4").strikethrough,
      codespan: chalk.hex("#50FA7B").bgHex("#282A36"),

      // Links
      link: chalk.hex("#8BE9FD").underline,
      href: chalk.hex("#6272A4"),

      // Code blocks
      code: chalk.hex("#F8F8F2").bgHex("#282A36"),

      // Width
      tab: 2,
      width: 90,
      reflowText: false,
      unescape: true,
    },
    {
      // Syntax highlighting theme
      theme: {
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
      },
    },
  ),
);

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
