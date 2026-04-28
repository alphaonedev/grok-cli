# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.7.0] - 2026-04-28

Full-spectrum security, performance, release-engineering, and DX hardening
based on a six-agent code review of the entire codebase.

### Security
- **Wallet private keys are now AES-256-GCM encrypted at rest.** Previously
  `~/.grok/wallet.json` stored the privateKey in plaintext (mode 0600).
  Existing plaintext wallets are migrated to encrypted form transparently
  on first read. Encryption key derives from `GROK_STORAGE_KEY` (preferred)
  or a per-machine fallback.
- **Schedule daemon and detached headless runs no longer spread `process.env`.**
  Replaced with an explicit allowlist (`PATH`/`HOME`/`SHELL`/`USER`/`LANG`/
  `TERM`/`TMPDIR`/`TZ`/`EDITOR` plus `GROK_*`/`NODE_*`/`BUN_*`/`LC_*`/`XDG_*`
  prefixes) and an explicit blocklist for `TELEGRAM_BOT_TOKEN`,
  `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `AWS_SECRET_ACCESS_KEY`,
  `AWS_SESSION_TOKEN`. Bounds the blast radius if the daemon's env is
  visible via `/proc` on Linux or process listings.
- **Schedule directory traversal hardened.** `validateScheduleDirectory()`
  realpath-resolves the target, enforces `isDirectory`, and rejects
  sensitive system roots (`/etc`, `/usr`, `/sbin`, `/bin`, `/boot`,
  `/proc`, `/sys`, `/dev`, `/root`, `/System`, `/Library`, `/Applications`,
  and the `/private/*` macOS mirrors). Validation runs at both schedule
  create time and detached spawn time, so a tampered stored schedule
  cannot escape.
- **Per-user Telegram rate limit.** Sliding-window cap (default 10
  messages / 60s, tunable via `GROK_TELEGRAM_RATE_LIMIT_MAX` and
  `GROK_TELEGRAM_RATE_LIMIT_WINDOW_MS`). Bounds API spend if the bot
  token leaks or an approved user goes rogue.
- **Sandbox-off warning banner.** When the agent is about to run shell
  commands directly on the host (current `--no-sandbox` default), a
  yellow stderr banner prints once at startup. Suppressible via
  `GROK_SUPPRESS_SANDBOX_WARNING=1`. Default behavior unchanged
  (flipping to `--sandbox` default is reserved for a major version bump).

### Release engineering
- **Atomic, size-verified install.** `install.sh` and the in-process
  auto-update path (`src/utils/install-manager.ts`) now HEAD-probe
  Content-Length, verify post-download size on disk, retry transient
  failures with exponential backoff, refuse to proceed on an empty
  `checksums.txt`, and write to a `.new` / `.part` staging file before
  atomic rename. Roots out a real-world failure mode where a 71 MB
  release landed as a 21 MB truncated binary that passed the HTTP
  success check but got SIGKILL'd by macOS Gatekeeper at first launch.
- **Optional macOS codesign + notarization** in the release workflow
  (`.github/workflows/release.yml`), gated on five GitHub Actions
  secrets. Documented in [`docs/RELEASE_SIGNING.md`](docs/RELEASE_SIGNING.md).
  Without the secrets, the workflow ships unsigned binaries (current
  behavior).
- **Vitest now runs in CI** between typecheck and binary build. Forty-nine
  test files / 281 tests previously never ran on PR.
- **Fixed stale `superagent-ai/grok-cli` reference** in the in-process
  update checker; auto-updates now resolve correctly to
  `alphaonedev/grok-cli`. README/Pages still credit upstream as the
  fork source (intentional attribution).

### Performance
- **OpenTUI subsystem and 21 unused tree-sitter packages removed.** The
  `src/ui/` directory (12 files, 7,541 LOC) was unmaintained and never
  loaded — only `src/ui-ink/` is wired to `src/index.ts`. Dropping
  `@opentui/core`, `@opentui/react`, `web-tree-sitter`, every
  `tree-sitter-*` dep, the brittle `postinstall` hook (which patched a
  hardcoded chunk filename inside `@opentui/core`), and the `patches/`
  directory removes 25 packages and ~15–20 MB from the standalone
  binary.
- **Markdown re-parse storm during streaming fixed.** `MarkdownView`
  accepts a `streaming` prop that debounces parses to 120ms while the
  buffer is rapidly growing (~8/sec instead of ~50/sec). Static
  completed messages still parse synchronously and benefit from Ink's
  `<Static>` memoization.
- **Tool-result lookup is O(1).** Replaced `tools.find(t => t.call.id === ...)`
  with a `Map<string, entry>` indexed by call id.

### Code quality
- **`noUncheckedIndexedAccess` enabled** in `tsconfig.json`. Resolved
  all 82 surfaced array/record accesses across 17 files (refactored
  bounded for-loops to `for..of`, added explicit guards or `??` fallbacks
  at parse boundaries, applied non-null assertions where index validity
  was already established by control flow).
- **Silent fire-and-forget `.catch(() => {})` replaced with logger
  breadcrumbs.** New `src/utils/debug-log.ts` writes to
  `~/.grok/debug.log` only when `GROK_DEBUG` is set. 26 sites now
  leave a trail without changing observable behavior — hook/MCP/clipboard
  failures become debuggable.
- **Crash log writer** (`src/utils/crash-log.ts`). On uncaught
  exception or unhandled rejection, a sanitized snapshot (timestamp,
  kind, version, node, platform, argv, cwd, scoped env, full stack)
  is appended to `~/.grok/crash.log` (mode 0600). Secrets like
  `GROK_API_KEY`, `TELEGRAM_BOT_TOKEN`, `sk-*`, `xai-*`, `ghp_*`,
  Telegram bot-token shapes are redacted before write.
- **Differentiated exit codes:** 0 (success), 1 (user error), 2
  (transient), 3 (agent/tool error), 4 (panic). Documented in
  [`docs/HEADLESS_JSON_SPEC.md`](docs/HEADLESS_JSON_SPEC.md).

### UX
- **Missing-API-key error now points to <https://console.x.ai>** with
  formatted setup instructions for all three valid paths (env var,
  CLI flag, settings file).
- **Removed JSX import source dependency on `@opentui/react`** in
  `tsconfig.json`. Standard React JSX is used throughout (Ink-native).

### Documentation
- New [`docs/HEADLESS_JSON_SPEC.md`](docs/HEADLESS_JSON_SPEC.md):
  full schema for the `--format json` JSONL stream — all five event
  types, ordering guarantees, exit-code matrix, pipe-friendly `jq`
  examples.
- New [`docs/RELEASE_SIGNING.md`](docs/RELEASE_SIGNING.md): macOS
  codesign + notarization setup with the five required GitHub Actions
  secrets and step-by-step `.p12` export instructions.
- README and GitHub Pages site (`docs/index.html`) updated to credit
  React Ink for the terminal UI.
- `AGENTS.md` "Known issues" section corrected — both previously
  documented bugs (`bun run dev` import-type issue, ESLint flat-config
  mismatch) had already been fixed in source but never reflected in
  the doc.

### Tests
- **49 test files / 281 tests** (was 47 / 257). Three modules
  previously had zero coverage and now have unit tests:
  `src/storage/migrations.test.ts` (4 tests, in-memory mock of the
  SQLiteDatabase interface), `src/hooks/config.test.ts` (12 tests
  covering `isHookEvent`, `getMatchingHooks`, `getMatchQuery`),
  `src/payments/service.test.ts` (8 tests covering
  `formatInspectionOutput` paths and Brin scan rendering).

## [1.1.3] - 2026-04-01

### Added
- @-mention file autocomplete (#236)

## [1.1.2] - 2026-04-01

### Added
- Switch computer sub-agent to agent-desktop (#233)

### Removed
- Tracked telegram pair code from repo (#234)

## [1.1.1] - 2026-04-01

### Added
- Verify workflow with sandboxed testing and browser smoke checks (#228)
- Batch mode for headless Grok CLI runs (#231)

## [1.1.0] - 2026-03-26

### Added
- CLI update checker (#223)

### Changed
- Replace commit scan with PR security scan (#224)

### Fixed
- Issue with schedule modal (#226)

## [1.0.0-rc7] - 2026-03-26

### Added
- Scheduled headless runs with daemon and agent tools (#214)
- Shuru sandbox mode for agent shell execution (#215)
- Configurable sandbox settings (network, resources, ports, secrets) (#217)

## [1.0.0-rc6] - 2026-03-24

### Added
- Telegram file attachments — `telegram_send_file` tool for uploading media to Telegram chats (#212)
- Telegram voice/audio transcription via local whisper.cpp with auto model download and ffmpeg conversion (#210)
- Built-in Vision sub-agent for image validation through xAI Responses API (#209)
- Grok media tools (#207)
- Changelog (#206)

### Changed
- Updated app UI (#206)
- Clarify terminal support and unofficial status (#204)

### Fixed
- Mirror Telegram tool activity in TUI (#202)

## [1.0.0-rc5] - 2026-03-23

### Fixed
- Only send reasoningEffort for grok-3-mini (#200)

## [1.0.0-rc4] - 2026-03-23

### Added
- Support for multi-agent Grok models (#197)
- Custom sub-agents with /agents TUI and reliable interrupt (#192)
- Loading animation on streaming (#190)

### Changed
- Clarify headless json output format

## [1.0.0-rc3] - 2026-03-22

### Added
- JSON output mode for headless runs (#185)
- Test helper coverage for rewrite utilities (#184)
- Compaction (#183)
- Support for review command (#182)

### Fixed
- Use package.json version instead of hardcoded "1.0.0" (#188)

### Removed
- Grok.md support (#181)

## [1.0.0-rc2] - 2026-03-20

### Fixed
- Lint issues (#180)

### Changed
- Asset link in README.md
- Image source link in README.md (#179)
- Readme and version (#178)

## [1.0.0-rc1] - 2026-03-20

Initial release.