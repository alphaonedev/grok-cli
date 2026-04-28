# Release signing — macOS notarization

The release workflow at `.github/workflows/release.yml` includes an
**optional** step that codesigns and notarizes the macOS binary so it
launches without Gatekeeper warnings. It is gated on the presence of
the secrets below and is silently skipped if they are missing — the
release will still publish, just unsigned. Apple Silicon will still
run an unsigned (or ad-hoc signed via `bun build --compile`) Mach-O,
but Gatekeeper will warn on first launch from outside the App Store.

## Required GitHub Actions secrets

Set these on the repository under **Settings → Secrets and variables
→ Actions**. All five must be set; partially configured will fail the
job.

| Secret | What it is |
|---|---|
| `APPLE_DEVELOPER_ID_APPLICATION_CERT_BASE64` | Your **Developer ID Application** certificate exported as a `.p12`, then base64-encoded. From the macOS keychain: select the cert, File → Export, save as `.p12`, then `base64 -i cert.p12 \| pbcopy`. |
| `APPLE_DEVELOPER_ID_APPLICATION_CERT_PASSWORD` | The password you set when exporting the `.p12`. |
| `APPLE_ID` | Your Apple Developer account email (e.g. `releases@alphaonedev.com`). |
| `APPLE_APP_SPECIFIC_PASSWORD` | An app-specific password generated at <https://account.apple.com/account/manage> → Sign-In and Security → App-Specific Passwords. **Not** your normal Apple ID password. |
| `APPLE_TEAM_ID` | Your 10-character Team ID. Find it at <https://developer.apple.com/account> → Membership. |

## What the step does

1. Creates a temporary keychain on the macOS runner.
2. Imports the `.p12` cert into it.
3. Looks up the Developer ID Application identity.
4. Runs `codesign --force --options runtime --timestamp --sign <id> release/grok`.
5. Zips the binary (`notarytool` requires a container).
6. Submits to `xcrun notarytool submit ... --wait`. The job blocks
   until Apple either accepts (success) or rejects (job fails).
7. Deletes the temporary keychain and unzipped artifact.

Standalone binaries (not `.app` bundles) **cannot be stapled**, so
the notary ticket lives in Apple's CDN and Gatekeeper performs an
online check on first launch. This is the same model `homebrew` uses
for unbottled formulae.

## Troubleshooting

* **"Could not locate Developer ID Application identity in keychain"** —
  the `.p12` was exported with the wrong cert type (e.g. *Developer ID
  Installer* instead of *Developer ID Application*) or the import failed.
  Re-export, re-base64, re-set the secret.
* **`notarytool submit ... --wait` returns "Invalid"** — log in to
  <https://appstoreconnect.apple.com> → your team → Notary Submissions
  to read the structured rejection. The most common issue is the
  `--options runtime` flag missing from `codesign` (we set it; if you
  modify the workflow, keep it).
* **`Errors during notarization`** — usually a stale app-specific
  password. They expire silently when you change your Apple ID
  password. Generate a fresh one and update the secret.

## Skipping signing locally

The `bun run build:binary` script in `package.json` still ad-hoc signs
the local build with `codesign --force --sign -`. That keeps the
arm64 launch-check happy on the developer's own machine without any
Apple Developer account.
