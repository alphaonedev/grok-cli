import chalk from "chalk";
import { Text } from "ink";
import { Marked } from "marked";
import { markedTerminal } from "marked-terminal";
import { useMemo } from "react";

// Only syntax highlighting colors — no structural overrides
const md = new Marked(
  markedTerminal(
    {},
    {
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

function cleanLinks(text: string): string {
  // "Link Text (https://example.com)" → "Link Text"
  // Keep the styled link text, remove the raw URL in parens
  return text.replace(/ \(https?:\/\/[^)]+\)/g, "");
}

export function MarkdownView({ content }: { content: string }) {
  const rendered = useMemo(() => {
    if (!content) return "";
    try {
      return cleanLinks(md.parse(content) as string);
    } catch {
      return content;
    }
  }, [content]);

  return <Text>{rendered}</Text>;
}
