/**
 * File tree visualization — unicode box-drawing directory view.
 *
 * Renders directory listings as readable tree structures for both
 * interactive (OpenTUI) and headless (ANSI) output.
 *
 * Copyright (c) 2026 AlphaOne LLC. MIT License.
 */

import fs from "node:fs";
import path from "node:path";

interface TreeEntry {
  name: string;
  isDir: boolean;
  children?: TreeEntry[];
}

/**
 * Build a tree structure from a directory path.
 */
function buildTree(dirPath: string, depth: number, maxDepth: number, maxItems: number): TreeEntry[] {
  if (depth >= maxDepth) return [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    const filtered = entries
      .filter((e) => !e.name.startsWith(".") && e.name !== "node_modules" && e.name !== "__pycache__")
      .sort((a, b) => {
        // Directories first, then alphabetical
        if (a.isDirectory() !== b.isDirectory()) return a.isDirectory() ? -1 : 1;
        return a.name.localeCompare(b.name);
      })
      .slice(0, maxItems);

    return filtered.map((entry) => ({
      name: entry.name,
      isDir: entry.isDirectory(),
      children: entry.isDirectory()
        ? buildTree(path.join(dirPath, entry.name), depth + 1, maxDepth, maxItems)
        : undefined,
    }));
  } catch {
    return [];
  }
}

/**
 * Render a tree structure as unicode box-drawing text.
 */
function renderEntries(entries: TreeEntry[], prefix: string, isLast: boolean[]): string[] {
  const lines: string[] = [];

  entries.forEach((entry, index) => {
    const last = index === entries.length - 1;
    const connector = last ? "└── " : "├── ";
    const icon = entry.isDir ? "\x1b[34m" : "\x1b[0m"; // Blue for dirs
    const suffix = entry.isDir ? "/" : "";
    const linePrefix = isLast.map((l) => (l ? "    " : "│   ")).join("");

    lines.push(`${linePrefix}${connector}${icon}${entry.name}${suffix}\x1b[0m`);

    if (entry.children && entry.children.length > 0) {
      lines.push(...renderEntries(entry.children, prefix, [...isLast, last]));
    }
  });

  return lines;
}

/**
 * Generate a file tree visualization from a directory path.
 *
 * @param dirPath - Root directory to visualize
 * @param maxDepth - Maximum depth to traverse (default: 3)
 * @param maxItems - Maximum items per directory (default: 20)
 */
export function fileTree(dirPath: string, maxDepth = 3, maxItems = 20): string {
  const rootName = path.basename(dirPath) || dirPath;
  const entries = buildTree(dirPath, 0, maxDepth, maxItems);

  const lines = [`\x1b[1m\x1b[34m${rootName}/\x1b[0m`, ...renderEntries(entries, "", [])];

  return lines.join("\n");
}
