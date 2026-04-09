/**
 * Inline Image Display — iTerm2 and Kitty image protocol support.
 *
 * Renders images directly in the terminal instead of opening an external viewer.
 * Falls back gracefully when terminal doesn't support image protocols.
 *
 * Copyright (c) 2026 AlphaOne LLC. MIT License.
 */

import fs from "node:fs";

type ImageProtocol = "iterm2" | "kitty" | "none";

/**
 * Detect which image protocol the terminal supports.
 */
export function detectImageProtocol(): ImageProtocol {
  const term = (process.env.TERM_PROGRAM || "").toLowerCase();
  const termInfo = (process.env.TERM || "").toLowerCase();

  if (term.includes("iterm") || term === "iterm.app" || term === "iterm2") return "iterm2";
  if (term.includes("kitty") || termInfo.includes("xterm-kitty")) return "kitty";
  if (term.includes("wezterm")) return "iterm2"; // WezTerm supports iTerm2 protocol
  if (term.includes("ghostty")) return "kitty"; // Ghostty supports Kitty protocol

  return "none";
}

/**
 * Render an image inline in the terminal.
 * Returns the escape sequence string, or null if unsupported.
 */
export function renderInlineImage(filePath: string, options?: { width?: number; height?: number }): string | null {
  const protocol = detectImageProtocol();
  if (protocol === "none") return null;

  try {
    const data = fs.readFileSync(filePath);
    const base64 = data.toString("base64");
    const filename = filePath.split("/").pop() || "image";

    if (protocol === "iterm2") {
      return renderIterm2(base64, filename, data.length, options);
    }

    if (protocol === "kitty") {
      return renderKitty(base64, options);
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * iTerm2 inline image protocol.
 * Format: ESC ] 1337 ; File=[args] : base64data BEL
 */
function renderIterm2(
  base64: string,
  filename: string,
  size: number,
  options?: { width?: number; height?: number },
): string {
  const parts = [`name=${btoa(filename)}`, `size=${size}`, "inline=1"];
  if (options?.width) parts.push(`width=${options.width}`);
  if (options?.height) parts.push(`height=${options.height}`);

  return `\x1b]1337;File=${parts.join(";")}:${base64}\x07`;
}

/**
 * Kitty graphics protocol.
 * Sends image data in chunks of 4096 bytes.
 */
function renderKitty(base64: string, options?: { width?: number; height?: number }): string {
  const chunks: string[] = [];
  const chunkSize = 4096;

  for (let i = 0; i < base64.length; i += chunkSize) {
    const chunk = base64.slice(i, i + chunkSize);
    const isLast = i + chunkSize >= base64.length;
    const more = isLast ? 0 : 1;

    if (i === 0) {
      // First chunk — include action and format
      const widthPart = options?.width ? `,c=${options.width}` : "";
      const heightPart = options?.height ? `,r=${options.height}` : "";
      chunks.push(`\x1b_Ga=T,f=100,m=${more}${widthPart}${heightPart};${chunk}\x1b\\`);
    } else {
      chunks.push(`\x1b_Gm=${more};${chunk}\x1b\\`);
    }
  }

  return chunks.join("");
}

/**
 * Check if inline image display is available for the current terminal.
 */
export function supportsInlineImages(): boolean {
  return detectImageProtocol() !== "none";
}
