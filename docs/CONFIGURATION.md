# Grok CLI Configuration Guide

## User Settings

The primary configuration file is `~/.grok/user-settings.json`. This file is **never committed to git** (`.grok/` is in `.gitignore`).

### Setup

```bash
mkdir -p ~/.grok
cp docs/user-settings-example.json ~/.grok/user-settings.json
# Edit to add your API key:
# "apiKey": "xai-YOUR_API_KEY_HERE"
```

### API Key

Set your xAI API key via **one** of these methods (in priority order):

1. **Environment variable** (recommended for CI):
   ```bash
   export GROK_API_KEY=xai-YOUR_API_KEY_HERE
   ```

2. **User settings file**:
   ```json
   { "apiKey": "xai-YOUR_API_KEY_HERE" }
   ```

3. **CLI one-time set**:
   ```bash
   grok -k xai-YOUR_API_KEY_HERE
   ```

> **Security**: Never commit API keys. The `.gitignore` excludes `.grok/` and `.env` files.

### Default Model

```json
{ "defaultModel": "grok-4-1-fast-reasoning" }
```

Recommended default for most development work:
- 2M token context window (largest available)
- Reasoning enabled (chain-of-thought)
- $0.20/M input, $0.50/M output (10x cheaper than flagship)

### Model Catalog

The `models` array defines which models appear in the model selector. Current catalog:

| Model | Context | Input $/M | Output $/M | Best For |
|-------|---------|-----------|------------|----------|
| `grok-4.20-reasoning` | 2M | $2.00 | $6.00 | Deep architecture, complex debugging |
| `grok-4.20-non-reasoning` | 2M | $2.00 | $6.00 | Fast flagship without thinking tokens |
| `grok-4.20-multi-agent-0309` | 2M | $2.00 | $6.00 | Server-side multi-agent orchestration |
| `grok-4-1-fast-reasoning` | 2M | $0.20 | $0.50 | **Default** — daily coding, refactoring |
| `grok-4-1-fast-non-reasoning` | 2M | $0.20 | $0.50 | Bulk transforms, docs, quick fixes |
| `grok-4` | 256K | varies | varies | Frontier quality, smaller context |
| `grok-code-fast-1` | 2M | varies | varies | Legacy code model |
| `grok-3` / `grok-3-fast` / `grok-3-mini` | varies | varies | varies | Previous generation |

### Sub-Agents

Custom sub-agents specialize the Grok agent for different tasks. Each needs `name`, `model`, and `instruction`.

Reserved names (cannot be used): `general`, `explore`, `vision`, `verify`, `computer`.

The example configuration provides 10 sub-agents across 3 model tiers:

| Tier | Model | Sub-Agents | Cost Profile |
|------|-------|------------|-------------|
| **Deep** | `grok-4.20-reasoning` | architect, code-review, debug, security-audit | $2/$6 per M — complex analysis |
| **Standard** | `grok-4-1-fast-reasoning` | implement, refactor, test-writer | $0.20/$0.50 per M — daily work |
| **Fast** | `grok-4-1-fast-non-reasoning` | docs, quick-fix, data-ops | $0.20/$0.50 per M — no thinking overhead |

Usage in the CLI:
```
> /task architect "Design the caching layer for the API"
> /task code-review "Review the auth middleware changes"
> /task debug "Trace why the webhook handler returns 500"
> /task security-audit "Audit the payment processing module"
```

### Full Example

See [`docs/user-settings-example.json`](user-settings-example.json) for a complete working configuration (replace `xai-YOUR_API_KEY_HERE` with your actual key).

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

## Security Checklist

- [ ] API keys are in `~/.grok/user-settings.json` or environment variables, never in code
- [ ] `.grok/` is in `.gitignore` (verified)
- [ ] `.env` files are in `.gitignore` (verified)
- [ ] No secrets in commit messages or PR descriptions
- [ ] GPG signing enabled for all commits
