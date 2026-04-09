/**
 * ai-memory MCP integration — auto-recall and compaction storage.
 *
 * When ai-memory is connected as an MCP server, this module provides:
 * 1. Auto-recall: On session start, recall relevant memories and inject into system prompt
 * 2. Compaction store: When context is compacted, store the summary as a memory
 *
 * These are passive integrations — they enhance the agent silently without
 * requiring explicit user action.
 */

import type { ToolSet } from "ai";

const AI_MEMORY_PREFIX = "mcp_ai-memory__";

/**
 * Check if ai-memory MCP tools are available in the tool set.
 */
export function hasAiMemory(tools: ToolSet): boolean {
  return Object.keys(tools).some((name) => name.startsWith(AI_MEMORY_PREFIX));
}

/**
 * Auto-recall memories relevant to the current project context.
 * Returns formatted memory block for system prompt injection, or empty string.
 */
export async function autoRecall(tools: ToolSet, cwd: string): Promise<string> {
  const recallTool = tools[`${AI_MEMORY_PREFIX}memory_recall`];
  if (!recallTool) return "";

  try {
    // Derive project context from cwd
    const projectName = cwd.split("/").pop() || "project";
    const context = `session context project overview ${projectName}`;

    if (!recallTool.execute) return "";
    const result = await recallTool.execute(
      {
        context,
        limit: 5,
        format: "toon_compact",
      },
      { toolCallId: "auto-recall", messages: [], abortSignal: undefined as unknown as AbortSignal },
    );

    const output = typeof result === "string" ? result : JSON.stringify(result);
    if (!output || output === "null" || output.includes("count:0")) return "";

    return `\n\n[Session Memory — recalled from previous sessions]\n${output}\n`;
  } catch {
    return "";
  }
}

/**
 * Store a compaction summary as a mid-tier memory.
 * Called automatically when context is compacted.
 */
export async function storeCompactionSummary(
  tools: ToolSet,
  summary: string,
  cwd: string,
  sessionId?: string,
): Promise<void> {
  const storeTool = tools[`${AI_MEMORY_PREFIX}memory_store`];
  if (!storeTool || !summary) return;

  try {
    const projectName = cwd.split("/").pop() || "project";
    const title = `Session compaction: ${projectName} (${new Date().toISOString().slice(0, 10)})`;

    if (!storeTool.execute) return;
    await storeTool.execute(
      {
        title,
        content: summary.slice(0, 4000), // Cap at 4K chars
        tier: "mid",
        namespace: projectName,
        tags: JSON.stringify(["compaction", "session-context", projectName]),
        source: "claude",
        priority: 4,
      },
      { toolCallId: "auto-compaction-store", messages: [], abortSignal: undefined as unknown as AbortSignal },
    );
  } catch {
    // Silent failure — compaction store is best-effort
  }
}
