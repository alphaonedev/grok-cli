# Grok CLI Configuration Guide

## User Settings

The primary configuration file is `~/.grok/user-settings.json`. This file is **never committed to git** (`.grok/` is in `.gitignore`).

### Quick Start

```bash
mkdir -p ~/.grok
cp docs/user-settings-example.json ~/.grok/user-settings.json
# Edit the file and replace the API key placeholder with your actual key
```

### Full Configuration

The complete `~/.grok/user-settings.json` with all fields:

```json
{
  "apiKey": "YOUR xAI Grok API KEY GOES HERE",
  "baseURL": "https://api.x.ai/v1",
  "defaultModel": "grok-4-1-fast-reasoning",
  "models": [
    "grok-4.20-reasoning",
    "grok-4.20-non-reasoning",
    "grok-4.20-multi-agent-0309",
    "grok-4-1-fast-reasoning",
    "grok-4-1-fast-non-reasoning",
    "grok-4-fast-reasoning",
    "grok-4-fast-non-reasoning",
    "grok-4",
    "grok-4-latest",
    "grok-code-fast-1",
    "grok-3",
    "grok-3-latest",
    "grok-3-fast",
    "grok-3-mini",
    "grok-3-mini-fast"
  ],
  "settingsVersion": 2,
  "subAgents": [
    {
      "name": "architect",
      "model": "grok-4.20-reasoning",
      "instruction": "Senior software architect. Design systems, evaluate trade-offs, plan implementations, review PRs for architectural issues. Think deeply about scalability, maintainability, and failure modes."
    },
    {
      "name": "code-review",
      "model": "grok-4.20-reasoning",
      "instruction": "Thorough code reviewer. Find bugs, security vulnerabilities, race conditions, memory leaks, and logic errors. Suggest concrete fixes with code. Check for OWASP top 10, input validation, and error handling."
    },
    {
      "name": "debug",
      "model": "grok-4.20-reasoning",
      "instruction": "Expert debugger. Analyze stack traces, reproduce issues, trace data flow, identify root causes. Walk through code step by step. Never guess — prove the cause before suggesting a fix."
    },
    {
      "name": "implement",
      "model": "grok-4-1-fast-reasoning",
      "instruction": "Implementation engineer. Write clean, production-ready code. Follow existing project conventions. Include error handling and edge cases. No unnecessary abstractions. Test what you build."
    },
    {
      "name": "refactor",
      "model": "grok-4-1-fast-reasoning",
      "instruction": "Refactoring specialist. Improve code structure without changing behavior. Reduce duplication, improve naming, simplify control flow. Preserve all existing tests. Small, safe, incremental changes."
    },
    {
      "name": "test-writer",
      "model": "grok-4-1-fast-reasoning",
      "instruction": "Test engineer. Write unit tests, integration tests, and edge case coverage. Use the project's existing test framework and patterns. Cover happy path, error cases, and boundary conditions."
    },
    {
      "name": "docs",
      "model": "grok-4-1-fast-non-reasoning",
      "instruction": "Technical writer. Generate API documentation, docstrings, README sections, and inline comments. Match existing project style. Be concise — explain why, not what."
    },
    {
      "name": "quick-fix",
      "model": "grok-4-1-fast-non-reasoning",
      "instruction": "Fast patch agent. Small fixes, typos, import errors, config changes, dependency updates. Speed over depth. One change at a time."
    },
    {
      "name": "data-ops",
      "model": "grok-4-1-fast-non-reasoning",
      "instruction": "Data operations agent. JSON/CSV/SQL transformations, schema migrations, data validation, format conversion, bulk text processing. Optimize for throughput."
    },
    {
      "name": "security-audit",
      "model": "grok-4.20-reasoning",
      "instruction": "Application security auditor. Analyze code for injection vulnerabilities, auth bypasses, insecure deserialization, secrets exposure, SSRF, and privilege escalation. Reference CWE IDs. Provide severity ratings and remediation steps."
    }
  ]
}
```

---

## Configuration Fields

### API Key

Set your xAI API key via **one** of these methods (in priority order):

1. **User settings file** (persistent):
   ```json
   { "apiKey": "YOUR xAI Grok API KEY GOES HERE" }
   ```

2. **Environment variable** (recommended for CI):
   ```bash
   export GROK_API_KEY=xai-YOUR_KEY_HERE
   ```

3. **CLI one-time set**:
   ```bash
   grok -k xai-YOUR_KEY_HERE
   ```

> **Security**: Never commit API keys. The `.gitignore` excludes `.grok/` and `.env` files.

### Base URL

```json
{ "baseURL": "https://api.x.ai/v1" }
```

The xAI API endpoint. Only change this if using a proxy or custom endpoint. Override with `GROK_BASE_URL` environment variable.

### Default Model

```json
{ "defaultModel": "grok-4-1-fast-reasoning" }
```

Recommended default for most development work:
- 2M token context window (largest available across all frontier models)
- Reasoning enabled (chain-of-thought for complex problem solving)
- $0.20/M input, $0.50/M output (10x cheaper than flagship grok-4.20)

Override per-session with `grok --model grok-4.20-reasoning` or per-project in `.grok/settings.json`.

### Settings Version

```json
{ "settingsVersion": 2 }
```

Schema version for the settings file. Do not change.

---

## Model Catalog

The `models` array defines which models appear in the model selector. All models below have a 2M token context window unless noted.

### Flagship & Reasoning Models

| Model | Context | Input $/M | Output $/M | Best For |
|-------|---------|-----------|------------|----------|
| `grok-4.20-reasoning` | 2M | $2.00 | $6.00 | Deep architecture, complex debugging, security analysis |
| `grok-4.20-non-reasoning` | 2M | $2.00 | $6.00 | Fast flagship without thinking tokens, lower latency |
| `grok-4.20-multi-agent-0309` | 2M | $2.00 | $6.00 | Server-side multi-agent orchestration (Responses API only) |

### Fast & Long-Context Models

| Model | Context | Input $/M | Output $/M | Best For |
|-------|---------|-----------|------------|----------|
| `grok-4-1-fast-reasoning` | 2M | $0.20 | $0.50 | **Default** — daily coding, refactoring, implementation |
| `grok-4-1-fast-non-reasoning` | 2M | $0.20 | $0.50 | Bulk transforms, documentation, quick fixes |
| `grok-4-fast-reasoning` | 2M | varies | varies | Previous-gen fast model (still supported) |
| `grok-4-fast-non-reasoning` | 2M | varies | varies | Previous-gen fast non-reasoning |

### Legacy Models

| Model | Context | Best For |
|-------|---------|----------|
| `grok-4` / `grok-4-latest` | 256K | Frontier quality, smaller context window |
| `grok-code-fast-1` | 2M | Legacy code-specialized model |
| `grok-3` / `grok-3-latest` | varies | Previous generation |
| `grok-3-fast` | varies | Previous generation fast |
| `grok-3-mini` / `grok-3-mini-fast` | varies | Lightweight, supports reasoning effort control |

---

## Sub-Agents

Custom sub-agents specialize the Grok agent for different tasks. Each needs `name`, `model`, and `instruction`.

**Reserved names** (cannot be used): `general`, `explore`, `vision`, `verify`, `computer` — these are built-in sub-agents.

### 10 Sub-Agents Across 3 Tiers

| Tier | Model | Cost | Sub-Agents |
|------|-------|------|------------|
| **Deep** | `grok-4.20-reasoning` | $2.00 / $6.00 per M | architect, code-review, debug, security-audit |
| **Standard** | `grok-4-1-fast-reasoning` | $0.20 / $0.50 per M | implement, refactor, test-writer |
| **Fast** | `grok-4-1-fast-non-reasoning` | $0.20 / $0.50 per M | docs, quick-fix, data-ops |

### Sub-Agent Descriptions

| Agent | Tier | Purpose |
|-------|------|---------|
| **architect** | Deep | System design, trade-offs, implementation planning, PR architecture review |
| **code-review** | Deep | Bug hunting, security vulnerabilities, OWASP top 10, concrete fix suggestions |
| **debug** | Deep | Stack trace analysis, root cause identification, step-by-step data flow tracing |
| **security-audit** | Deep | Injection vulns, auth bypasses, CWE IDs, severity ratings, remediation steps |
| **implement** | Standard | Clean production code, project conventions, error handling, edge cases |
| **refactor** | Standard | Structure improvement without behavior change, incremental safe changes |
| **test-writer** | Standard | Unit/integration tests, edge cases, existing framework patterns |
| **docs** | Fast | API docs, docstrings, README sections, concise inline comments |
| **quick-fix** | Fast | Typos, import errors, config changes, dependency updates |
| **data-ops** | Fast | JSON/CSV/SQL transforms, schema migrations, bulk text processing |

### Usage

```
> /task architect "Design the caching layer for the API"
> /task code-review "Review the auth middleware changes"
> /task debug "Trace why the webhook handler returns 500"
> /task security-audit "Audit the payment processing module"
> /task implement "Add rate limiting to the /api/search endpoint"
> /task refactor "Simplify the user authentication flow"
> /task test-writer "Add tests for the order processing module"
> /task docs "Document the REST API endpoints"
> /task quick-fix "Fix the typo in the error message on line 42"
> /task data-ops "Convert the CSV export to JSON format"
```

---

## ai-memory Integration (Optional)

Add persistent cross-session memory via [ai-memory MCP](https://github.com/alphaonedev/ai-memory-mcp):

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

When connected, the agent will:
- **Auto-recall** relevant memories on session start
- **Auto-store** compaction summaries as mid-tier memories
- **Proactively use** memory tools to store findings and recall context
- Memory tools available in **all modes** (agent, plan, ask)

Tiers: `keyword` (FTS only), `semantic` (+ vector search, recommended), `smart` (+ Ollama LLM), `autonomous` (+ cross-encoder reranking).

---

## Project Settings

Per-project overrides go in `.grok/settings.json` at the project root:

```json
{
  "model": "grok-4-1-fast-reasoning",
  "sandbox": {
    "allowNet": true,
    "cpus": 4,
    "memory": 2048
  }
}
```

---

## Security Checklist

- [ ] API keys are in `~/.grok/user-settings.json` or environment variables — never in code
- [ ] `.grok/` is in `.gitignore` (verified)
- [ ] `.env` files are in `.gitignore` (verified)
- [ ] No secrets in commit messages or PR descriptions
- [ ] GPG signing enabled for all commits
- [ ] MCP tool name collision prevention active (39 reserved built-in names)
- [ ] MCP tool description sanitization active (prompt injection defense)
