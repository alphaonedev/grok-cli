# AGENTS.md

## Cursor Cloud specific instructions

### Overview

Grok CLI (`@vibe-kit/grok-cli`) is a single-package TypeScript CLI tool — no databases, Docker, or background services. See `README.md` for full documentation and usage.

### Quick reference


| Action        | Command                                                               |
| ------------- | --------------------------------------------------------------------- |
| Install deps  | `bun install` (installs Husky; pre-commit runs Biome on staged files) |
| Typecheck     | `bun run typecheck`                                                   |
| Build         | `bun run build`                                                       |
| Run built CLI | `node dist/index.js`                                                  |
| Headless mode | `node dist/index.js --prompt "..." --max-tool-rounds N`               |
| CLI help      | `node dist/index.js --help`                                           |


### Linting

Biome is the only linter (`bun run lint` → `biome check src/`). There is no
ESLint config; `bun run typecheck` and `bun run lint` both run in CI.

### Environment

- **Bun** must be installed (not pre-installed on Cloud VMs). The update script handles this.
- `GROK_API_KEY` environment variable is required for API calls. Set it as a secret.