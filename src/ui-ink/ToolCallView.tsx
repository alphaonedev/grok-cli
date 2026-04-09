import { Box, Text } from "ink";
import React from "react";
import type { ToolCall, ToolResult } from "../types/index";

export function ToolCallView({ toolCall, toolResult }: { toolCall: ToolCall; toolResult?: ToolResult }) {
  const name = toolCall.function.name;
  let preview = "";
  try {
    const args = JSON.parse(toolCall.function.arguments);
    if (name === "bash") preview = args.command?.slice(0, 60) || "";
    else if (name === "read_file") preview = args.file_path || args.path || "";
    else if (name === "write_file" || name === "edit_file") preview = args.file_path || args.path || "";
    else preview = JSON.stringify(args).slice(0, 60);
  } catch {
    preview = toolCall.function.arguments.slice(0, 60);
  }

  const done = !!toolResult;
  const icon = done ? (toolResult?.success ? "✓" : "✗") : "▸";
  const color = done ? (toolResult?.success ? "green" : "red") : "yellow";

  return (
    <Box marginLeft={2}>
      <Text color={color} bold>
        {icon} {name}
      </Text>
      {preview ? <Text dimColor> {preview}</Text> : null}
    </Box>
  );
}
