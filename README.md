# grok-cli (AlphaOne Fork)

**AI coding agent powered by xAI Grok** --- with persistent memory, security hardening, and 10 custom sub-agents.

[![Release](https://img.shields.io/github/v/release/alphaonedev/grok-cli?label=release)](https://github.com/alphaonedev/grok-cli/releases)
[![CI](https://github.com/alphaonedev/grok-cli/actions/workflows/typecheck.yml/badge.svg)](https://github.com/alphaonedev/grok-cli/actions/workflows/typecheck.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-1.x-000000?logo=bun&logoColor=white)](https://bun.sh/)

Fork of [superagent-ai/grok-cli](https://github.com/superagent-ai/grok-cli) with these enhancements:

- **Ink React terminal UI** --- full markdown rendering with headers, bold, italic, tables, code blocks, lists, links, blockquotes. Vivid syntax highlighting for 25+ languages (Python, JavaScript, TypeScript, Rust, Go, Java, C/C++, Ruby, PHP, Bash, and more)
- **TOON compression** --- 30-50% token savings on all structured tool results
- **ai-memory MCP integration** --- persistent cross-session memory with vector search and auto-recall
- **Session-scoped MCP connections** --- connect once per session, not per message
- **MCP tools in all modes** --- memory works in plan, ask, and agent modes
- **Security hardening** --- AES-256-GCM storage encryption, MCP tool name collision prevention, description sanitization, 16 red team fixes
- **10 custom sub-agents** --- architect, code-review, debug, implement, refactor, test-writer, docs, quick-fix, data-ops, security-audit
- **Smart paste detection** --- large pastes show `[Pasted N chars]` instead of flooding the input
- **Live processing timer** --- elapsed time with context-aware status (Thinking / Running tools / Generating)

Real-time **X search**, **web search**, the full Grok model lineup (grok-4.20, grok-4-1-fast), **sub-agents on by default**, **remote control via Telegram**, and a terminal UI built with **Bun** and **Ink**.

Community-built and unofficial. Not affiliated with or endorsed by xAI.

---

## Install

### One-line install (recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/alphaonedev/grok-cli/main/install.sh | bash
```

Downloads a prebuilt binary for your platform (macOS arm64, Linux x64, Windows x64) to `~/.grok/bin/grok`.

### Install a specific version

```bash
curl -fsSL https://raw.githubusercontent.com/alphaonedev/grok-cli/main/install.sh | bash -s -- --version 1.2.0
```

### Install from source (requires Bun)

```bash
git clone https://github.com/alphaonedev/grok-cli.git
cd grok-cli
bun install
bun run dev  # run in development mode
```

### Build standalone binary from source

```bash
bun run build:binary
# Binary at: dist/grok-standalone
```

### Self-management (script-installed only)

```bash
grok update
grok uninstall
grok uninstall --dry-run
grok uninstall --keep-config
```

### Prerequisites

- **Grok API key** from [x.ai](https://x.ai)
- Modern terminal emulator for the interactive Ink experience
- Headless `--prompt` mode does not depend on terminal UI support
- For host desktop automation via the computer sub-agent, enable **Accessibility** permission for your terminal app on macOS

---

## Setup

### 1. API Key

Set your xAI API key (pick one method):

```bash
# Environment variable (recommended)
export GROK_API_KEY=xai-YOUR_KEY_HERE

# Or add to ~/.grok/user-settings.json
# Or one-time: grok -k xai-YOUR_KEY_HERE
```

### 2. Configuration

Copy the example config and replace the API key:

```bash
mkdir -p ~/.grok
cp docs/user-settings-example.json ~/.grok/user-settings.json
```

Or create `~/.grok/user-settings.json` with the full configuration:

```json
{
  "apiKey": "YOUR xAI Grok API KEY GOES HERE",
  "baseURL": "https://api.x.ai/v1",
  "defaultModel": "grok-4-1-fast-non-reasoning",
  "models": [
    "grok-4.20-0309-reasoning",
    "grok-4.20-0309-non-reasoning",
    "grok-4.20-multi-agent-0309",
    "grok-4-1-fast-reasoning",
    "grok-4-1-fast-non-reasoning",
    "grok-4-fast-reasoning",
    "grok-4-fast-non-reasoning",
    "grok-4-0709",
    "grok-code-fast-1",
    "grok-3",
    "grok-3-mini"
  ],
  "settingsVersion": 2,
  "subAgents": [
    { "name": "architect",      "model": "grok-4.20-0309-reasoning",         "instruction": "Senior software architect..." },
    { "name": "code-review",    "model": "grok-4.20-0309-reasoning",         "instruction": "Thorough code reviewer..." },
    { "name": "debug",          "model": "grok-4.20-0309-reasoning",         "instruction": "Expert debugger..." },
    { "name": "security-audit", "model": "grok-4.20-0309-reasoning",         "instruction": "Application security auditor..." },
    { "name": "implement",      "model": "grok-4-1-fast-reasoning",     "instruction": "Implementation engineer..." },
    { "name": "refactor",       "model": "grok-4-1-fast-reasoning",     "instruction": "Refactoring specialist..." },
    { "name": "test-writer",    "model": "grok-4-1-fast-reasoning",     "instruction": "Test engineer..." },
    { "name": "docs",           "model": "grok-4-1-fast-non-reasoning", "instruction": "Technical writer..." },
    { "name": "quick-fix",      "model": "grok-4-1-fast-non-reasoning", "instruction": "Fast patch agent..." },
    { "name": "data-ops",       "model": "grok-4-1-fast-non-reasoning", "instruction": "Data operations agent..." }
  ]
}
```

Full sub-agent instructions in [docs/user-settings-example.json](docs/user-settings-example.json). Complete guide in [docs/CONFIGURATION.md](docs/CONFIGURATION.md).

See [docs/CONFIGURATION.md](docs/CONFIGURATION.md) for the complete guide.

### 3. ai-memory (optional, recommended)

Add persistent cross-session memory:

```bash
# Install ai-memory
curl -fsSL https://raw.githubusercontent.com/alphaonedev/ai-memory-mcp/main/install.sh | bash
```

Add to `~/.grok/user-settings.json`:

```json
{
  "mcp": {
    "servers": [
      {
        "id": "ai-memory",
        "label": "AI Memory",
        "enabled": true,
        "transport": "stdio",
        "command": "ai-memory",
        "args": ["mcp", "--tier", "semantic"]
      }
    ]
  }
}
```

The agent will automatically recall relevant memories on session start and store important findings for future sessions. See [ai-memory-mcp](https://github.com/alphaonedev/ai-memory-mcp) for details.

---

## Run it

**Interactive (default)** — launches the Ink coding agent:

```bash
grok
```

### Supported terminals

For the most reliable interactive Ink experience, use a modern terminal emulator. We currently document and recommend:

- **WezTerm** (cross-platform)
- **Alacritty** (cross-platform)
- **Ghostty** (macOS and Linux)
- **Kitty** (macOS and Linux)

Other modern terminals may work, but these are the terminal apps we currently recommend and document for interactive use.

**Pick a project directory:**

```bash
grok -d /path/to/your/repo
```

**Headless** — one prompt, then exit (scripts, CI, automation):

```bash
grok --prompt "run the test suite and summarize failures"
grok -p "show me package.json" --directory /path/to/project
grok --prompt "refactor X" --max-tool-rounds 30
grok --prompt "summarize the repo state" --format json
grok --prompt "review the repo overnight" --batch-api
grok --verify
```

`--batch-api` uses xAI's Batch API for lower-cost unattended runs. It is a good
fit for scripts, CI, schedules, and other non-interactive workflows where a
delayed result is fine.

**Continue a saved session:**

```bash
grok --session latest
grok -s <session-id>
```

Works in interactive mode too—same flag.

**Structured headless output:**

```bash
grok --prompt "summarize the repo state" --format json
```

`--format json` emits a newline-delimited JSON event stream instead of the
default human-readable text output. Events are semantic, step-level records such
as `step_start`, `text`, `tool_use`, `step_finish`, and `error`.

### Computer sub-agent

Grok ships a built-in `**computer**` sub-agent backed by `[agent-desktop](https://github.com/lahfir/agent-desktop)` for host desktop automation on macOS.

Ask for it in natural language, for example:

```bash
grok "Use the computer sub-agent to take a screenshot of my host desktop and tell me what is open."
grok "Use the computer sub-agent to launch Google Chrome, snapshot the UI, and tell me which refs correspond to the address bar and tabs."
```

Notes:

- Screenshots are saved under `**.grok/computer/**` by default.
- The primary workflow is **snapshot -> refs -> action -> snapshot** using `agent-desktop` accessibility snapshots and stable refs like `@e1`.
- `computer_screenshot` is available for visual confirmation, but the preferred path is `computer_snapshot` plus ref-based actions such as `computer_click`, `computer_type`, and `computer_scroll`.
- macOS requires **System Settings → Privacy & Security → Accessibility** access for the terminal app running `grok`.
- `agent-desktop` currently targets **macOS**.
- If Bun blocks the native binary download during install, run:

```bash
node ./node_modules/agent-desktop/scripts/postinstall.js
```

### Scheduling

Schedules let Grok run a headless prompt on a recurring schedule or once. Ask
for it in natural language, for example:

```text
Create a schedule named daily-changelog-update that runs every weekday at 9am
and updates CHANGELOG.md from the latest merged commits.
```

Recurring schedules require the background daemon:

```bash
grok daemon --background
```

Use `/schedule` in the TUI to browse saved schedules. One-time schedules start
immediately in the background; recurring schedules keep running as long as the
daemon is active.

**List Grok models and pricing hints:**

```bash
grok models
```

**Pass an opening message without another prompt:**

```bash
grok fix the flaky test in src/foo.test.ts
```

**Generate images or short videos from chat:**

```bash
grok "Generate a retro-futuristic logo for my CLI called Grok Forge"
grok "Edit ./assets/hero.png into a watercolor poster"
grok "Animate ./assets/cover.jpg into a 6 second cinematic push-in"
```

Image and video generation are exposed as agent tools inside normal chat sessions.
You keep using a text model for the session, and Grok saves generated media under
`.grok/generated-media/` by default unless you ask for a specific output path.

---

## What you actually get


| Thing                             | What it means                                                                                                                                                                                                              |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Grok-native**                   | Defaults tuned for Grok; models like `**grok-code-fast-1`**, `**grok-4-1-fast-reasoning**`, `**grok-4.20-multi-agent-0309**`, plus flagship and fast variants—run `grok models` for the full menu.                         |
| **X + web search**                | `**search_x`** and `**search_web**` tools—live posts and docs without pretending the internet stopped in 2023.                                                                                                             |
| **Media generation**              | Built-in `**generate_image`** and `**generate_video**` tools for text-to-image, image editing, text-to-video, and image-to-video flows. Generated files are saved locally so you can reuse them after the xAI URLs expire. |
| **Sub-agents (default behavior)** | Foreground `**task`** delegation (e.g. explore, general, or computer) plus background `**delegate**` for read-only deep dives—parallelize like you mean it.                                                                |
| **Verify**                        | `**/verify`** or `**--verify**` — inspects your app, builds, tests, boots it, and runs browser smoke checks in a sandboxed environment. Screenshots and video included.                                                    |
| **Computer use**                  | Built-in `**computer`** sub-agent for host desktop automation via `**agent-desktop**`. It prefers semantic accessibility snapshots and stable refs, with screenshots saved under `**.grok/computer/**` when requested.     |
| **Custom sub-agents**             | Define named agents with `**subAgents`** in `**~/.grok/user-settings.json**` and manage them from the TUI with `**/agents**`.                                                                                              |
| **Remote control**                | Pair **Telegram** from the TUI (`/remote-control` → Telegram): DM your bot, `**/pair`**, approve the code in-terminal. Keep the CLI running while you ping it from your phone.                                             |
| **No “mystery meat” UI**          | Ink React terminal UI—fast, keyboard-driven, not whatever glitchy thing you’re thinking of.                                                                                                                            |
| **Skills**                        | Agent Skills under `**.agents/skills/<name>/SKILL.md`** (project) or `**~/.agents/skills/**` (user). Use `**/skills**` in the TUI to list what’s installed.                                                                |
| **MCPs**                          | Extend with Model Context Protocol servers—configure via `**/mcps`** in the TUI or `**.grok/settings.json**` (`mcpServers`).                                                                                               |
| **Sessions**                      | Conversations persist; `**--session latest`** picks up where you left off.                                                                                                                                                 |
| **Headless**                      | `**--prompt`** / `**-p**` for non-interactive runs—pipe it, script it, bench it.                                                                                                                                           |
| **Hackable**                      | TypeScript, clear agent loop, bash-first tools—fork it, shamelessly.                                                                                                                                                       |


### Coming soon

**Deeper autonomous agent testing** — persistent sandbox sessions, richer browser workflows, and stronger "prove it works" evidence.

---

## API key (pick one)

**Environment (good for CI):**

```bash
export GROK_API_KEY=your_key_here
```

`**.env**` in the project (see `.env.example` if present):

```bash
GROK_API_KEY=your_key_here
```

**CLI once:**

```bash
grok -k your_key_here
```

**Saved in user settings** — `~/.grok/user-settings.json`:

```json
{ "apiKey": "your_key_here" }
```

Optional `**subAgents**` — custom foreground sub-agents. Each entry needs `**name**`, `**model**`, and `**instruction**`:

```json
{
  "subAgents": [
    {
      "name": "security-review",
      "model": "grok-code-fast-1",
      "instruction": "Prioritize security implications and suggest concrete fixes."
    }
  ]
}
```

Names cannot be `general`, `explore`, `vision`, `verify`, or `computer` because those are reserved for the built-in sub-agents.

Optional: `**GROK_BASE_URL**` (default `https://api.x.ai/v1`), `**GROK_MODEL**`, `**GROK_MAX_TOKENS**`.

---

## Telegram (remote control) — short version

1. Create a bot with [@BotFather](https://t.me/BotFather), copy the token.
2. Set `**TELEGRAM_BOT_TOKEN**` or add `**telegram.botToken**` in `~/.grok/user-settings.json` (the TUI `**/remote-control**` flow can save it).
3. Start `**grok**`, open `**/remote-control**` → **Telegram** if needed, then in Telegram DM your bot: `**/pair`**, enter the **6-character code** in the terminal when asked.
4. First user must be approved once; after that, it’s remembered. **Keep the CLI process running** while you use the bot (long polling lives in that process).

### Voice & audio messages

Send a voice note or audio attachment in Telegram and Grok will transcribe it locally with **[whisper.cpp](https://github.com/ggml-org/whisper.cpp)** before passing the text to the agent. No cloud STT service is involved — everything runs on your machine.

#### Prerequisites


| Dependency      | Why                                                             | Install (macOS)            |
| --------------- | --------------------------------------------------------------- | -------------------------- |
| **whisper-cli** | Runs the actual speech-to-text inference                        | `brew install whisper-cpp` |
| **ffmpeg**      | Converts Telegram voice notes (OGG/Opus) to WAV for whisper.cpp | `brew install ffmpeg`      |


After installing, verify both are available:

```bash
whisper-cli -h
ffmpeg -version
```

#### Download a Whisper model

Grok CLI auto-downloads the configured model on first use, but you can pre-download it:

```bash
mkdir -p ~/.grok/models/stt/whisper.cpp
curl -L https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin \
  -o ~/.grok/models/stt/whisper.cpp/ggml-tiny.en.bin
```

Available models (trade size for accuracy): `tiny.en` (75 MB), `base.en` (142 MB), `small.en` (466 MB).

#### Configure in `~/.grok/user-settings.json`

```json
{
  "telegram": {
    "botToken": "YOUR_BOT_TOKEN",
    "audioInput": {
      "enabled": true,
      "binaryPath": "/opt/homebrew/bin/whisper-cli",
      "model": "tiny.en",
      "modelPath": "~/.grok/models/stt/whisper.cpp/ggml-tiny.en.bin",
      "autoDownloadModel": true,
      "language": "en"
    }
  }
}
```


| Setting             | Default           | Description                                                              |
| ------------------- | ----------------- | ------------------------------------------------------------------------ |
| `enabled`           | `true`            | Set to `false` to ignore voice/audio messages entirely.                  |
| `binaryPath`        | `whisper-cli`     | Absolute path or command name for the whisper.cpp CLI binary.            |
| `model`             | `tiny.en`         | Model alias used for auto-download resolution.                           |
| `modelPath`         | *(auto-resolved)* | Explicit path to a `.bin` model file. Overrides `model` + auto-download. |
| `autoDownloadModel` | `true`            | Download the model into `~/.grok/models/stt/whisper.cpp` on first use.   |
| `language`          | `en`              | Whisper language code passed to the CLI.                                 |


Optional headless flow when you do not want the TUI open:

```bash
grok telegram-bridge
```

Treat the bot token like a password.

---

## Hooks

Hooks execute shell commands at key agent lifecycle events — enforce policies, run linters, trigger tests, or log activity.

Configure in `~/.grok/user-settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "bash",
        "hooks": [
          {
            "type": "command",
            "command": "./scripts/lint-before-edit.sh",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

Hook commands receive JSON on **stdin** (event details) and can return JSON on **stdout**. Exit code `0` = success, `2` = block the action, other = non-blocking error.

**Supported events:** `PreToolUse`, `PostToolUse`, `PostToolUseFailure`, `UserPromptSubmit`, `SessionStart`, `SessionEnd`, `Stop`, `StopFailure`, `SubagentStart`, `SubagentStop`, `TaskCreated`, `TaskCompleted`, `PreCompact`, `PostCompact`, `Notification`, `InstructionsLoaded`, `CwdChanged`.

---

## Instructions & project brain

- `**AGENTS.md**` — merged from git root down to your cwd (Codex-style; see repo docs). `**AGENTS.override.md**` wins per directory when present.

---

## Project settings

Project file: `**.grok/settings.json**` — e.g. the current model for this project.

---

## Sandbox

Grok CLI can run shell commands inside a [Shuru](https://github.com/superhq-ai/shuru) microVM sandbox so the agent can't touch your host filesystem or network.

**Requires macOS 14+ on Apple Silicon.**

Enable it with `--sandbox` on the CLI, or toggle it from the TUI with `/sandbox`.

When sandbox mode is active you can configure:

- **Network** — off by default; enable with `--allow-net`, restrict with `--allow-host`
- **Port forwards** — `--port 8080:80`
- **Resource limits** — CPUs, memory, disk size (via settings or `/sandbox` panel)
- **Checkpoints** — start from a saved environment snapshot
- **Secrets** — inject API keys without exposing them inside the VM

All settings are saved in `~/.grok/user-settings.json` (user) and `.grok/settings.json` (project).

### Verify

Run `**/verify`** in the TUI or `**--verify**` on the CLI to verify your app locally:

```bash
grok --verify
grok -d /path/to/your/app --verify
```

The agent inspects your project, figures out how to build and run it, spins up a sandbox, and produces a verification report with screenshots and video evidence. Works with any app type.

---

## Development

From a clone:

```bash
bun install
bun run build
bun run start
# or: node dist/index.js
```

Other useful commands:

```bash
bun run dev      # run from source (Bun)
bun run typecheck
bun run lint
bun run test     # vitest, also gated in CI as of v1.7.0
```

### Optional environment variables

| Variable | What it does |
|---|---|
| `GROK_DEBUG=1` | Enable per-call debug logging to `~/.grok/debug.log` (covers swallowed `.catch` paths in hooks/MCP/clipboard). Off by default. |
| `GROK_SUPPRESS_SANDBOX_WARNING=1` | Silence the yellow stderr banner that prints when `--sandbox` is off. |
| `GROK_TELEGRAM_RATE_LIMIT_MAX` | Max messages per user before pause (default `10`). |
| `GROK_TELEGRAM_RATE_LIMIT_WINDOW_MS` | Sliding window in ms (default `60000`). |
| `GROK_STORAGE_KEY` | Override the default per-machine key derivation for AES-256-GCM at-rest encryption (DB fields, wallet private key). |

If the agent crashes, a sanitized snapshot is appended to `~/.grok/crash.log`
(mode 0600). The path is also printed by the panic handler. Secrets
(`GROK_API_KEY`, `TELEGRAM_BOT_TOKEN`, `sk-*`/`xai-*`/`ghp_*`/Telegram
bot-token shapes) are redacted before write.

### Headless / CI integration

Headless runs (`grok --prompt "..." --format json`) emit one JSON event
per line. The full schema with all five event types and a jq cookbook
lives in [`docs/HEADLESS_JSON_SPEC.md`](docs/HEADLESS_JSON_SPEC.md). Exit
codes are differentiated:

| Code | Meaning |
|---|---|
| 0 | Success |
| 1 | User error (bad flag, missing API key) |
| 2 | Transient (network, rate-limit) |
| 3 | Agent / tool execution error |
| 4 | Internal panic |

---

## Built with

The interactive console is built with **[React Ink](https://github.com/vadimdemedes/ink)**
(Vadim Demedes' React renderer for terminal UIs) on the **[Bun](https://bun.sh/)**
runtime. Markdown rendering uses **[marked](https://github.com/markedjs/marked)**
+ **[marked-terminal](https://github.com/mikaelbr/marked-terminal)** with
**[chalk](https://github.com/chalk/chalk)** for ANSI colors. The agent
loop talks to the xAI API via **[Vercel AI SDK](https://github.com/vercel/ai)**.
Schema validation uses **[zod](https://github.com/colinhacks/zod)**.
Telegram integration uses **[grammY](https://grammy.dev/)**. Local tests
run on **[Vitest](https://vitest.dev/)**; lint and format with
**[Biome](https://biomejs.dev/)**.

---

## License

MIT
