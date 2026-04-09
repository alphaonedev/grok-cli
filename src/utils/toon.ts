/**
 * TOON — Token-Oriented Object Notation
 *
 * ~40% token savings vs JSON for structured data sent to LLMs.
 * Port of the Python TOON module from AlphaOne Sentinel.
 *
 * Format spec: https://toonformat.dev/
 *
 * Copyright (c) 2026 AlphaOne LLC. MIT License.
 */

type ToonValue = null | boolean | number | string | ToonValue[] | { [key: string]: ToonValue };

function needsQuote(s: string): boolean {
  if (!s || s === "true" || s === "false" || s === "null") return true;
  if (s.includes(",") || s.includes(":") || s.includes("\n") || s.includes("|")) return true;
  if (s.startsWith(" ") || s.endsWith(" ")) return true;
  // Check if it looks like a number
  if (!Number.isNaN(Number(s)) && s.trim() !== "") return true;
  return false;
}

function escapeValue(s: string): string {
  return needsQuote(s) ? `"${s.replace(/"/g, '\\"')}"` : s;
}

/**
 * Convert a JSON-compatible value to TOON format.
 *
 * - Objects → `key: value` lines
 * - Uniform arrays of objects → tabular `[N]{col1,col2,...}:` format
 * - Primitive arrays → `[N]: val1,val2,...`
 * - Strings with special chars are auto-quoted
 */
export function jsonToToon(obj: ToonValue, indent = 0): string {
  const prefix = "  ".repeat(indent);

  if (obj === null || obj === undefined) return "null";
  if (typeof obj === "boolean") return obj ? "true" : "false";
  if (typeof obj === "number") return String(obj);
  if (typeof obj === "string") return escapeValue(obj);

  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[0]:";

    // Tabular: uniform array of objects with same keys
    if (obj.every((item) => item !== null && typeof item === "object" && !Array.isArray(item))) {
      const keys = Object.keys(obj[0] as Record<string, ToonValue>);
      const allSameKeys = obj.every((item) => {
        const itemKeys = Object.keys(item as Record<string, ToonValue>);
        return itemKeys.length === keys.length && keys.every((k) => itemKeys.includes(k));
      });
      if (allSameKeys && keys.length > 0) {
        const header = `[${obj.length}]{${keys.join(",")}}:`;
        const rows = obj.map((item) => {
          const record = item as Record<string, ToonValue>;
          return `${prefix}  ${keys.map((k) => jsonToToon(record[k])).join(",")}`;
        });
        return `${header}\n${rows.join("\n")}`;
      }
    }

    // All primitives
    if (
      obj.every(
        (item) => item === null || typeof item === "string" || typeof item === "number" || typeof item === "boolean",
      )
    ) {
      const vals = obj.map((item) => jsonToToon(item));
      return `[${obj.length}]: ${vals.join(",")}`;
    }

    // Mixed
    const lines = [`[${obj.length}]:`];
    for (const item of obj) {
      lines.push(`${prefix}  - ${jsonToToon(item, indent + 2)}`);
    }
    return lines.join("\n");
  }

  // Object
  if (typeof obj === "object") {
    const entries = Object.entries(obj);
    if (entries.length === 0) return "";

    const lines: string[] = [];
    for (const [k, v] of entries) {
      if (v !== null && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length > 0) {
        lines.push(`${prefix}${k}:\n${jsonToToon(v, indent + 1)}`);
      } else if (Array.isArray(v)) {
        lines.push(`${prefix}${k}${jsonToToon(v, indent + 1)}`);
      } else {
        lines.push(`${prefix}${k}: ${jsonToToon(v)}`);
      }
    }
    return lines.join("\n");
  }

  return String(obj);
}

/**
 * Try to compress a JSON string to TOON format.
 * Falls back to original text if not JSON or savings < 10%.
 */
export function compress(text: string): string {
  try {
    const obj = JSON.parse(text) as ToonValue;
    const toon = jsonToToon(obj);
    // Only use TOON if it actually saves tokens (>10% reduction)
    if (toon.length < text.length * 0.9) {
      return toon;
    }
  } catch {
    // Not valid JSON — return as-is
  }
  return text;
}

/**
 * Format a dict/object as TOON with depth limit for large nested structures.
 */
export function formatObject(data: Record<string, ToonValue>, maxDepth = 4): string {
  function truncate(obj: ToonValue, depth: number): ToonValue {
    if (depth >= maxDepth) {
      if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {
        return `{...${Object.keys(obj).length} keys}`;
      }
      if (Array.isArray(obj)) {
        return `[...${obj.length} items]`;
      }
      return obj;
    }
    if (obj !== null && typeof obj === "object" && !Array.isArray(obj)) {
      const result: Record<string, ToonValue> = {};
      for (const [k, v] of Object.entries(obj)) {
        result[k] = truncate(v, depth + 1);
      }
      return result;
    }
    if (Array.isArray(obj)) {
      return obj.slice(0, 20).map((v) => truncate(v, depth + 1));
    }
    return obj;
  }

  return jsonToToon(truncate(data, 0));
}
