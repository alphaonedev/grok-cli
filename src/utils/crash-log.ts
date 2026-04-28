/**
 * Crash log writer — captures the last few minutes of a fatal error
 * to ~/.grok/crash.log so users can include it in bug reports.
 *
 * Sanitizes obvious secrets (GROK_API_KEY, TELEGRAM_BOT_TOKEN, anything
 * matching common token shapes) before writing.
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const CRASH_LOG_PATH = path.join(os.homedir(), ".grok", "crash.log");

const SECRET_ENV_KEYS = new Set(["GROK_API_KEY", "TELEGRAM_BOT_TOKEN", "OPENAI_API_KEY", "ANTHROPIC_API_KEY"]);

const SECRET_VALUE_PATTERNS = [
  /sk-[A-Za-z0-9_-]{20,}/g,
  /xai-[A-Za-z0-9_-]{20,}/g,
  /ghp_[A-Za-z0-9_-]{20,}/g,
  /gho_[A-Za-z0-9_-]{20,}/g,
  /\b\d{6,}:[A-Za-z0-9_-]{20,}\b/g, // Telegram bot tokens
];

function sanitize(value: string): string {
  let out = value;
  for (const pattern of SECRET_VALUE_PATTERNS) {
    out = out.replace(pattern, "[REDACTED]");
  }
  return out;
}

function snapshotEnv(): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v !== "string") continue;
    if (SECRET_ENV_KEYS.has(k)) {
      out[k] = "[REDACTED]";
    } else if (k.startsWith("GROK_") || k.startsWith("TELEGRAM_") || k === "PATH" || k === "HOME" || k === "SHELL") {
      out[k] = sanitize(v);
    }
  }
  return out;
}

export function writeCrashLog(kind: string, error: unknown): void {
  try {
    fs.mkdirSync(path.dirname(CRASH_LOG_PATH), { recursive: true });
    const now = new Date().toISOString();
    const stack = error instanceof Error ? (error.stack ?? `${error.name}: ${error.message}`) : String(error);
    const argv = sanitize(process.argv.join(" "));
    const env = snapshotEnv();
    const block = [
      "----------------------------------------",
      `time:    ${now}`,
      `kind:    ${kind}`,
      `version: ${process.env.npm_package_version ?? "unknown"}`,
      `node:    ${process.version}`,
      `platform: ${process.platform} ${process.arch}`,
      `argv:    ${argv}`,
      `cwd:     ${process.cwd()}`,
      `env:     ${JSON.stringify(env)}`,
      `error:`,
      sanitize(stack),
      "",
    ].join("\n");
    fs.appendFileSync(CRASH_LOG_PATH, block);
    fs.chmodSync(CRASH_LOG_PATH, 0o600);
  } catch {
    // crash logging itself failed — nothing useful we can do
  }
}

export function getCrashLogPath(): string {
  return CRASH_LOG_PATH;
}
