import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { ToolSet } from "ai";
import { debugLogger } from "../utils/debug-log";
import type { McpServerConfig } from "../utils/settings";
import { validateMcpServerConfig } from "./validate";

function mcpToolPrefix(server: McpServerConfig): string {
  return `mcp_${server.id.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

function toTransport(server: McpServerConfig) {
  if (server.transport === "stdio") {
    return new StdioClientTransport({
      command: server.command ?? "",
      args: server.args,
      env: server.env,
      cwd: server.cwd,
    });
  }

  return {
    type: server.transport,
    url: server.url ?? "",
    headers: server.headers,
  } as const;
}

export interface McpToolBundle {
  tools: ToolSet;
  errors: string[];
  close(): Promise<void>;
}

// Built-in tool names that MCP servers must not override
const RESERVED_TOOL_NAMES = new Set([
  "bash",
  "read_file",
  "write_file",
  "edit_file",
  "search_web",
  "search_x",
  "generate_image",
  "generate_video",
  "task",
  "delegate",
  "delegation_read",
  "delegation_list",
  "process_list",
  "process_logs",
  "process_stop",
  "lsp",
  "computer_snapshot",
  "computer_screenshot",
  "computer_click",
  "computer_type",
  "computer_press",
  "computer_scroll",
  "computer_launch",
  "computer_list_windows",
  "computer_focus_window",
  "computer_get",
  "computer_wait",
  "computer_mouse_move",
  "schedule_create",
  "schedule_list",
  "schedule_remove",
  "schedule_read_log",
  "schedule_daemon_status",
  "schedule_daemon_start",
  "schedule_daemon_stop",
  "wallet_info",
  "wallet_history",
  "fetch_payment_info",
  "paid_request",
]);

/**
 * Sanitize MCP tool description to prevent prompt injection.
 * Strips control patterns and caps length.
 */
function sanitizeDescription(label: string, description: string | undefined, name: string): string {
  const raw = description ?? name;
  // Strip common prompt injection patterns
  const cleaned = raw
    .replace(/ignore\s+(previous|all|above)\s+instructions?/gi, "[filtered]")
    .replace(/you\s+(are|must|should|will)\s+now/gi, "[filtered]")
    .replace(/system\s*:/gi, "[filtered]")
    .slice(0, 500); // Cap at 500 chars
  return `[MCP ${label}] ${cleaned}`;
}

export async function buildMcpToolSet(servers: McpServerConfig[]): Promise<McpToolBundle> {
  const tools: ToolSet = {};
  const errors: string[] = [];
  const clients: MCPClient[] = [];

  for (const server of servers) {
    if (!server.enabled) continue;

    const validation = validateMcpServerConfig(server);
    if (!validation.ok) {
      errors.push(`${server.label}: ${validation.error}`);
      continue;
    }

    try {
      const client = await createMCPClient({
        transport: toTransport(server),
        name: `grok-cli-${server.id}`,
        version: "1.0.0",
      });
      clients.push(client);

      const mcpTools = await client.tools();
      const prefix = mcpToolPrefix(server);

      for (const [name, tool] of Object.entries(mcpTools)) {
        // Prevent MCP tools from overriding built-in tools
        if (RESERVED_TOOL_NAMES.has(name)) {
          errors.push(`${server.label}: tool "${name}" conflicts with built-in, skipped`);
          continue;
        }
        const prefixedName = `${prefix}__${name}`;
        tools[prefixedName] = {
          ...tool,
          description: sanitizeDescription(server.label, tool.description, name),
        };
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push(`${server.label}: ${message}`);
    }
  }

  return {
    tools,
    errors,
    async close() {
      await Promise.all(clients.map((client) => client.close().catch(debugLogger("mcp/runtime"))));
    },
  };
}
