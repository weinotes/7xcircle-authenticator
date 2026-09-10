# Security Policy

Author: Davey Wong <wgwcko@gmail.com> (https://www.guangweiblog.com)

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
- **Build provenance.** Only the release APKs attached to this repository's
  GitHub Releases are signed with the project key. An APK from anywhere else — a
  fork, a mirror, a messaging app — is not attested by this project; check the
  source before installing. See CONTRIBUTING.md.
- **iOS is out of scope for now.** There is no Xcode project, so only the Android
  and web builds are supported and tested.

## Reporting a vulnerability

Email **support@7xcircle.com** — or the maintainer directly at
**wgwcko@gmail.com** — with `7X Circle Authenticator` in the subject. Do not open
a public issue.

- Acknowledgement within 7 days.
- Fix and disclose within 90 days, or we publish the reason for the delay.
- This is an unpaid, single-maintainer open-source project, so no bug bounty.

## Supported versions

| Version | Supported |
|---|---|
| 1.3.x | ✅ |
| 1.2.x | ⚠️ security fixes only |
| 1.1.x | ⚠️ security fixes only |
| < 1.1 | ❌ end of life |
