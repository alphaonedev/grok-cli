declare module "marked-terminal" {
  import type { MarkedExtension } from "marked";

  interface TerminalRendererOptions {
    showSectionPrefix?: boolean;
    tab?: number;
    reflowText?: boolean;
    width?: number;
  }

  export function markedTerminal(options?: TerminalRendererOptions): MarkedExtension;
  export default class Renderer {
    constructor(options?: TerminalRendererOptions);
  }
}
