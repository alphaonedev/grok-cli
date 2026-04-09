/**
 * Ink-based interactive UI for grok-cli.
 * Replaces OpenTUI's app.tsx with a simpler, markdown-capable UI.
 */

import { Box, Text, useApp, useInput, useStdout } from "ink";
import Spinner from "ink-spinner";
import TextInput from "ink-text-input";
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { Agent } from "../agent/agent";
import type { StreamChunk, ToolCall, ToolResult } from "../types/index";
import { MarkdownView } from "./MarkdownView";
import { ToolCallView } from "./ToolCallView";

interface Message {
  role: "user" | "assistant";
  content: string;
  toolCalls?: Array<{ call: ToolCall; result?: ToolResult }>;
}

export function App({ agent, initialMessage }: { agent: Agent; initialMessage?: string }) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamContent, setStreamContent] = useState("");
  const [activeTools, setActiveTools] = useState<Array<{ call: ToolCall; result?: ToolResult }>>([]);
  const [inputText, setInputText] = useState("");
  const [inputDisplay, setInputDisplay] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const processedInitial = useRef(false);

  const model = agent.getModel();
  const mode = agent.getMode();
  const cols = stdout?.columns || 80;

  const processMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      setIsProcessing(true);
      setStreamContent("");
      setActiveTools([]);
      setError("");
      setMessages((m) => [...m, { role: "user", content: text }]);

      let accumulated = "";
      const tools: Array<{ call: ToolCall; result?: ToolResult }> = [];

      try {
        for await (const chunk of agent.processMessage(text) as AsyncIterable<StreamChunk>) {
          switch (chunk.type) {
            case "content":
              if (chunk.content) {
                accumulated += chunk.content;
                setStreamContent(accumulated);
              }
              break;
            case "tool_calls":
              if (chunk.toolCalls) {
                for (const tc of chunk.toolCalls) {
                  tools.push({ call: tc });
                }
                setActiveTools([...tools]);
              }
              break;
            case "tool_result":
              if (chunk.toolCall && chunk.toolResult) {
                const existing = tools.find((t) => t.call.id === chunk.toolCall?.id);
                if (existing) {
                  existing.result = chunk.toolResult;
                } else {
                  tools.push({ call: chunk.toolCall, result: chunk.toolResult });
                }
                setActiveTools([...tools]);
              }
              break;
            case "done":
              if (accumulated) {
                setMessages((m) => [
                  ...m,
                  { role: "assistant", content: accumulated, toolCalls: tools.length > 0 ? [...tools] : undefined },
                ]);
              }
              setStreamContent("");
              setActiveTools([]);
              break;
            case "error":
              setError(chunk.content || "Unknown error");
              break;
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setIsProcessing(false);
      }
    },
    [agent],
  );

  // Handle initial message
  useEffect(() => {
    if (initialMessage && !processedInitial.current) {
      processedInitial.current = true;
      processMessage(initialMessage);
    }
  }, [initialMessage, processMessage]);

  // Ctrl+C to exit
  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit();
    }
  });

  const PASTE_THRESHOLD = 100;

  const handleInputChange = useCallback(
    (value: string) => {
      // Detect paste: if input grows by more than PASTE_THRESHOLD chars in one event
      const delta = value.length - inputText.length;
      if (delta > PASTE_THRESHOLD) {
        const pasted = value.slice(inputText.length);
        const chars = pasted.length;
        const lines = pasted.split("\n").length;
        const label =
          lines > 1
            ? `[Pasted ${chars.toLocaleString()} chars, ${lines} lines]`
            : `[Pasted ${chars.toLocaleString()} chars]`;
        setPastedText(pasted);
        setInputDisplay(inputText + label);
        setInputText(value);
        return;
      }
      setPastedText("");
      setInputDisplay(value);
      setInputText(value);
    },
    [inputText],
  );

  const handleSubmit = useCallback(
    (text: string) => {
      if (isProcessing) return;
      // Send actual text (including full paste content), not display text
      const actualText = pastedText ? inputText : text;
      setInputText("");
      setInputDisplay("");
      setPastedText("");
      processMessage(actualText);
    },
    [isProcessing, processMessage, inputText, pastedText],
  );

  // Show last N messages that fit
  const maxVisible = 10;
  const visibleMessages = messages.slice(-maxVisible);

  return (
    <Box flexDirection="column" width={cols}>
      {/* Header */}
      <Box paddingX={1} marginBottom={1}>
        <Text bold color="cyan">
          grok
        </Text>
        <Text dimColor>
          {" "}
          {mode} · {model}
        </Text>
      </Box>

      {/* Messages */}
      {visibleMessages.map((msg, i) => (
        <Box key={`msg-${i}`} flexDirection="column" paddingX={1} marginBottom={1}>
          <Text bold color={msg.role === "user" ? "blue" : "green"}>
            {msg.role === "user" ? "You" : "Agent"}
          </Text>
          {msg.role === "assistant" ? (
            <Box marginLeft={2}>
              <MarkdownView content={msg.content} />
            </Box>
          ) : (
            <Box marginLeft={2}>
              <Text>{msg.content}</Text>
            </Box>
          )}
          {msg.toolCalls?.map((tc, j) => (
            <ToolCallView key={`tc-${j}`} toolCall={tc.call} toolResult={tc.result} />
          ))}
        </Box>
      ))}

      {/* Streaming content */}
      {streamContent && (
        <Box flexDirection="column" paddingX={1} marginBottom={1}>
          <Text bold color="green">
            Agent
          </Text>
          <Box marginLeft={2}>
            <MarkdownView content={streamContent} />
          </Box>
        </Box>
      )}

      {/* Active tools */}
      {activeTools.map((tc, i) => (
        <ToolCallView key={`atc-${i}`} toolCall={tc.call} toolResult={tc.result} />
      ))}

      {/* Processing spinner */}
      {isProcessing && !streamContent && activeTools.length === 0 && (
        <Box paddingX={1}>
          <Text color="cyan">
            <Spinner type="dots" />
          </Text>
          <Text dimColor> Thinking...</Text>
        </Box>
      )}

      {/* Error */}
      {error && (
        <Box paddingX={1}>
          <Text color="red">Error: {error}</Text>
        </Box>
      )}

      {/* Input */}
      <Box borderStyle="round" borderColor={isProcessing ? "gray" : "cyan"} paddingX={1} marginTop={1}>
        <Text color="cyan">{mode === "agent" ? "Agent" : mode === "plan" ? "Plan" : "Ask"} </Text>
        <TextInput
          value={inputDisplay}
          onChange={handleInputChange}
          onSubmit={handleSubmit}
          placeholder={isProcessing ? "Processing..." : "Message Grok..."}
        />
      </Box>

      {/* Footer */}
      <Box paddingX={1}>
        <Text dimColor>{model} · ctrl+c exit</Text>
      </Box>
    </Box>
  );
}
