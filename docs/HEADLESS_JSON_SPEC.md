# Headless JSONL stream spec

`grok --prompt "..." --format json` emits one JSON object per line on
stdout, terminated by a newline. The stream is suitable for piping
into `jq`, log shippers, CI parsers, or per-line stream processors.

This document defines the schema, ordering, and exit semantics. It is
versioned implicitly with `package.json#version`. Source of truth is
`src/headless/output.ts`.

## Invocation

```
grok --prompt "rename foo to bar" --format json --max-tool-rounds 200
```

Exit codes:

| Code | Meaning |
|---|---|
| `0` | Success |
| `1` | User error (bad flag, missing API key, invalid config) |
| `2` | Transient error (network blip, rate-limit) |
| `3` | Agent / tool execution error |
| `4` | Internal panic (uncaught exception, unhandled rejection) |

A non-zero exit may be paired with a final `error` event; consumers
should not assume one implies the other.

## Event types

All events share these fields:

| Field | Type | Notes |
|---|---|---|
| `type` | `string` | One of `step_start`, `text`, `tool_use`, `step_finish`, `error` |
| `timestamp` | `number` | `Date.now()` ms epoch |
| `sessionID` | `string \| undefined` | Present when a session id was assigned (most cases) |
| `stepNumber` | `number` | 1-indexed turn within the headless run, except on `error` events |

### `step_start`

Emitted at the beginning of each agent turn.

```json
{ "type": "step_start", "sessionID": "ses_abc123", "stepNumber": 1, "timestamp": 1714323456789 }
```

### `text`

Emitted once per turn after the model produces assistant text. The
`text` field contains the full assistant message for that step (it is
**not** a token-level stream — that is reserved for the (unstable)
`raw` mode).

```json
{
  "type": "text",
  "sessionID": "ses_abc123",
  "stepNumber": 1,
  "text": "I'll rename `foo` to `bar` in three places.",
  "timestamp": 1714323457123
}
```

### `tool_use`

Emitted once per tool call, after both invocation and result are
known. `timing` is optional and present when the agent's per-tool
observer hooks ran.

```json
{
  "type": "tool_use",
  "sessionID": "ses_abc123",
  "stepNumber": 1,
  "timestamp": 1714323458001,
  "toolCall": {
    "id": "call_01",
    "name": "edit_file",
    "args": { "path": "src/foo.ts", "diff": "..." }
  },
  "toolResult": {
    "id": "call_01",
    "success": true,
    "output": "Edited src/foo.ts"
  },
  "timing": {
    "startedAt": 1714323457900,
    "finishedAt": 1714323458001,
    "durationMs": 101
  }
}
```

### `step_finish`

Closes a turn. `finishReason` is the model's reported finish reason
(e.g. `stop`, `tool_calls`, `length`). `usage` carries token
accounting; `costUsdTicks` is in 1e-6 USD units (so `1500` means
$0.0015).

```json
{
  "type": "step_finish",
  "sessionID": "ses_abc123",
  "stepNumber": 1,
  "timestamp": 1714323459200,
  "finishReason": "stop",
  "usage": {
    "inputTokens": 432,
    "outputTokens": 187,
    "totalTokens": 619,
    "costUsdTicks": 1239
  }
}
```

### `error`

Emitted on a failure. The run exits non-zero immediately after.

```json
{
  "type": "error",
  "sessionID": "ses_abc123",
  "message": "Tool `bash` denied: command not in allowlist",
  "timestamp": 1714323460000
}
```

## Ordering guarantees

Within a single step:

```
step_start
  (text)?
  (tool_use)*
step_finish
```

`text` and `tool_use` events for the same step share a `stepNumber`.
A multi-turn run produces multiple step blocks back-to-back. The
runtime never interleaves steps.

## Stability

- New event types and new optional fields **may be added** in any
  release without bumping a major version. Consumers should ignore
  unknown event types and unknown fields.
- Existing field types and required fields will not change without
  a major version bump.
- Field ordering inside a JSON object is not guaranteed.

## Pipe-friendly examples

```bash
# Total token usage across all turns
grok --prompt "..." --format json | jq -s '
  [.[] | select(.type == "step_finish") | .usage.totalTokens // 0] | add'

# Names and durations of tool calls
grok --prompt "..." --format json | jq '
  select(.type == "tool_use") | {tool: .toolCall.name, ms: .timing.durationMs}'

# Surface only errors to stderr
grok --prompt "..." --format json | jq -c 'select(.type == "error")' >&2
```
