declare module "marked-terminal" {
  import type { MarkedExtension } from "marked";

  type ChalkStyle = (text: string) => string;

  interface TerminalRendererOptions {
    showSectionPrefix?: boolean;
    firstHeading?: ChalkStyle;
    heading?: ChalkStyle;
    strong?: ChalkStyle;
    em?: ChalkStyle;
    del?: ChalkStyle;
    codespan?: ChalkStyle;
    link?: ChalkStyle;
    href?: ChalkStyle;
    listitem?: ChalkStyle;
    blockquote?: ChalkStyle | ((text: string) => string);
    hr?: ChalkStyle | (() => string);
    code?: ChalkStyle | ((code: string) => string);
    table?: ChalkStyle;
    paragraph?: ChalkStyle;
    image?: ChalkStyle;
    html?: ChalkStyle;
    text?: ChalkStyle;
    tab?: number;
    width?: number;
    reflowText?: boolean;
    unescape?: boolean;
    tableOptions?: Record<string, unknown>;
  }

  export function markedTerminal(
    options?: TerminalRendererOptions,
    highlightOptions?: Record<string, unknown>,
  ): MarkedExtension;

  export default class Renderer {
    constructor(options?: TerminalRendererOptions, highlightOptions?: Record<string, unknown>);
  }
}
