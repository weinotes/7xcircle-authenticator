# Security Policy

## What this app guarantees

- No network requests from app code. Enforced by `src/core/privacy.test.ts`.
- No server, no account, no analytics, no crash reporting.
- Android auto-backup is disabled so keys are not copied to Google Drive.
- When the app lock is enabled, stored secrets are sealed with AES-256-GCM under a
  PBKDF2-SHA256 (600,000 iterations) key that is never persisted.

## What this app does not guarantee

Read this before relying on it for high-value accounts.

- **No lock means plaintext.** Without the app lock, secrets sit unencrypted in
  SQLite / `localStorage`. Any process with the app's data directory, or anyone
  with adb backup / root, can read them.
- **Root, jailbreak and a debugger on an unlocked device are out of scope.** The
  key is in memory while unlocked; an attacker who can dump memory or attach a
  debugger reads codes exactly as the app does.
- **Offline PIN brute-forcing is slowed, not prevented.** Anyone holding the
  storage file can test guesses without rate limits. A 4-digit PIN would be
  exhausted quickly, hence the 6-digit minimum. Use a PIN you can remember but
  nobody can guess from your name, birthday or keyboard row.
- **No recovery.** A forgotten PIN, or a lost backup password, means the data is
  gone. There is no support channel that can restore it, by design.
- **Release APKs are unsigned** until a signing key is configured, so they cannot
  be installed or trusted as authored by this project. See CONTRIBUTING.md.
- **iOS is unbuilt and untested**; the Xcode project may not exist or compile.

## Reporting a vulnerability

Email **support@7xcircle.com** with `7X Circle Authenticator` in the subject.
Do not open a public issue.

- Acknowledgement within 7 days.
- Fix and disclose within 90 days, or we publish the reason for the delay.
- This is an unpaid, single-maintainer open-source project, so no bug bounty.

## Supported versions

| Version | Supported |
|---|---|
| 1.1.x | ✅ |
| < 1.1 | ❌ end of life |
