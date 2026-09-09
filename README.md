# 7X Circle Authenticator

[简体中文](README.zh-CN.md) | English

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

Offline TOTP / HOTP two-factor authenticator for the [7X Circle](https://7xcircle.com) trading club. React + Capacitor, Android and web, no backend, no telemetry.

## What it does

| Feature | Status |
|---|---|
| TOTP (RFC 6238) and HOTP (RFC 4226) | ✅ |
| SHA1 / SHA256 / SHA512, 6 / 7 / 8 digits, custom period | ✅ |
| Add by QR scan (`otpauth://`) | ✅ native Android |
| Add and edit by manual entry | ✅ |
| Search, one-tap copy, live countdown | ✅ |
| JSON backup export / import | ✅ password-encrypted |
| PIN app lock with at-rest encryption | ✅ opt-in |
| Auto re-lock when backgrounded | ✅ |
| iOS build | ❌ not configured or tested |
| Release-signed APK | ✅ auto-signed by CI when a `v*` tag is pushed |
| Biometric unlock | ❌ not implemented |

## Security model, stated plainly

- **No network activity.** App code never calls `fetch`, `XMLHttpRequest`, `WebSocket` or `sendBeacon`, and contains no remote endpoint. This is enforced by `src/core/privacy.test.ts`, not just claimed. The `INTERNET` permission stays in the manifest because the Android WebView needs it to serve the bundled assets.
- **Where secrets live.** SQLite on native (`sevencircle_auth`), `localStorage` on web (`sevencircle_auth_tokens`).
- **Encryption is opt-in.** With the app lock enabled, the token payload (web) and each `secret` column (native) are sealed with an AES-256-GCM key derived from your PIN via PBKDF2-SHA256 with 600,000 iterations. The derived key is non-extractable and exists only in memory; only the salt and an encrypted probe are persisted.
- **Without the app lock, secrets are stored in plaintext.** The Settings screen states this. If you only need a code generator on a device you control, that may be fine; if not, enable the lock.
- **Offline brute-force is not stopped, only slowed.** Anyone who can read the storage file can test PINs offline. 600k PBKDF2 rounds make each guess expensive, which is why the PIN must be at least 6 digits and may not be sequential or repeated.
- **Android auto-backup is disabled** (`allowBackup="false"`) so a Google Drive backup cannot carry a copy of your keys.
- **Losing the PIN means losing the data.** There is no recovery path; restore from an encrypted backup instead. Backups are encrypted with a separate password you choose at export time.

## Development

Requires Node >= 20 and pnpm 11.

```bash
pnpm install
pnpm dev         # Vite dev server
pnpm test        # unit tests (vitest)
pnpm type-check  # tsc -b
pnpm lint        # oxlint
pnpm build       # web bundle into dist/
```

### Android

```bash
pnpm build
npx cap sync android
npx cap open android   # or: cd android && ./gradlew assembleDebug
```

Needs a JDK 21 and an Android SDK with `platforms;android-36`. CI builds the same steps — see `.github/workflows/build-apk.yml`.

## Project layout

```
src/
├── core/          # pure logic: OTP, URI parsing, crypto, brand, app lock
├── db/            # Database facade + SQLite / localStorage adapters
├── store/         # zustand state
├── hooks/         # useTOTP (per-second refresh), useBarcodeScanner
├── components/    # TokenList, TokenCard, LockScreen
└── pages/         # Add, Edit, Settings, LockSettings
```

Brand strings, storage key prefixes and the app id all come from
[`src/core/brand.ts`](src/core/brand.ts). `brand.test.ts` fails the build if a
legacy identifier returns or if the version drifts from `package.json`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Report vulnerabilities via [SECURITY.md](SECURITY.md) rather than a public issue.

## License

Apache-2.0 — see [LICENSE](LICENSE).

Copyright 2026 Davey Wong / 7X Circle.
