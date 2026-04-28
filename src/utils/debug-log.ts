/**
 * Debug logger for swallowed errors. Writes to ~/.grok/debug.log when
 * GROK_DEBUG is set; otherwise no-op. Never throws.
 *
 * Use in fire-and-forget paths (hook calls, MCP cleanup, clipboard ops)
 * where you want to swallow errors but still leave a breadcrumb.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ENABLED = Boolean(process.env.GROK_DEBUG);
const LOG_PATH = path.join(os.homedir(), ".grok", "debug.log");

let initialized = false;

function ensureLogDir(): void {
  if (initialized) return;
  initialized = true;
  if (!ENABLED) return;
  try {
    fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  } catch {
    // best-effort; if we can't create the dir we just won't log
  }
}

function formatError(err: unknown): string {
  if (err instanceof Error) {
    return err.stack ?? `${err.name}: ${err.message}`;
  }
  try {
    return typeof err === "string" ? err : JSON.stringify(err);
  } catch {
    return String(err);
  }
}

/**
 * Returns a logger bound to a scope name. The returned function is
 * safe to pass directly to `.catch(...)`.
 */
export function debugLogger(scope: string): (err: unknown) => void {
  return (err: unknown) => {
    if (!ENABLED) return;
    ensureLogDir();
    try {
      const line = `[${new Date().toISOString()}] [${scope}] ${formatError(err)}\n`;
      fs.appendFileSync(LOG_PATH, line);
    } catch {
      // logging itself failed — nothing useful we can do here
    }
  };
}
