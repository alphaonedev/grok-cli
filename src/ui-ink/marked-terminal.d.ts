declare module "marked-terminal" {
  import type { MarkedExtension } from "marked";

  interface TerminalRendererOptions {
    showSectionPrefix?: boolean;
    tab?: number;
    reflowText?: boolean;
    width?: number;
    code?: (code: string, lang?: string) => string;
  }

  class TerminalRenderer {
    constructor(options?: TerminalRendererOptions);
  }

  export default function markedTerminal(options?: TerminalRendererOptions): MarkedExtension;
  export { TerminalRenderer };
}
