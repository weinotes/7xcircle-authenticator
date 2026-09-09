# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] — 2026-09-10

### Changed

- **BREAKING (brand)**: renamed to **7X Circle Authenticator / 7X Circle 验证器**,
  aligned with the club's finalized `7xcircle.com` domain.
- **BREAKING (identity)**: `appId` / Gradle `namespace` / Java package moved to
  `com.sevencircle.auth`. Android treats this as a *different application*, so an
  existing install of the previous build is not upgraded — it coexists. Uninstall
  the old build after importing a backup.
- **BREAKING (storage keys)**: `juezhao_*` keys and the `juezhao_auth` SQLite
  database became `sevencircle_auth*`. No migration is provided because no build
  of the previous brand was ever released.
- Package name `juezhao-auth` → `7xcircle-authenticator`; version is now read by
  Gradle from `package.json`, so `versionName` can no longer drift.
- Android `strings.xml` app name was inconsistent with the UI (`绝招` vs `觉照`);
  both are now the single `BRAND.nameZh`.
- Logo assets renamed to brand-neutral `public/logo.*`. **The artwork is still
  the old monogram** and needs to be redrawn to the 7X Circle mark.

### Fixed

- `pnpm build` failed before Vite started: `pnpm-workspace.yaml` held an unfilled
  `allowBuilds` placeholder, so `pnpm install` exited with
  `ERR_PNPM_IGNORED_BUILDS`. Set to `esbuild: true`.
- `SQLiteAdapter.addToken` executed a 13-parameter `INSERT` with **no bound
  values**, inserting an all-NULL row that violates the `NOT NULL` columns — i.e.
  saving a token failed on every native run. Now uses the parameterized `run()` API.
- The web "encrypted" adapter stored its key in the same `localStorage` as the
  ciphertext, which is obfuscation, not encryption.
- Backups exported every TOTP secret as plaintext JSON.
- Removed the dead `LocalStorageAdapter` (never wired into `Database`).
- Lint warning for an unused `catch` binding in `app-store.ts`.

### Added

- **App lock**: PIN (≥ 6 digits, rejects sequential/repeated) derives a
  non-extractable AES-256-GCM key via PBKDF2-SHA256 with 600k iterations; the key
  lives only in memory. Wrong-PIN rejection relies on the GCM auth tag, with a
  cooldown after 5 failures. Auto re-lock on `visibilitychange`.
- Per-column encryption of native SQLite secrets when the lock is on.
- Password-encrypted backup export/import (v2 envelope; v1 plaintext backups still import).
- `LockScreen`, `LockSettingsPage`, and an app-lock entry in Settings that states
  the current encryption status.
- `src/core/brand.ts` as the single brand source, guarded by `brand.test.ts`
  (version sync, legal Java package, zero legacy identifiers).
- `src/core/privacy.test.ts` asserts no network API and no remote URL in app code.
- `android:allowBackup="false"`, explicit `CAMERA` permission and
  `camera` `uses-feature`; `INTERNET` kept and documented.
- CI split into a fast `quality` job (type-check, lint, test, web build) gating
  the `apk` job; Gradle output echoed on failure; logs uploaded on failure with
  30-day retention.
- Open-source kit: `CHANGELOG.md`, `SECURITY.md`, `CONTRIBUTING.md`,
  `CODE_OF_CONDUCT.md`, `SUPPORT.md`, issue and PR templates, `README.zh-CN.md`.

## [1.0.0] — 2026-07-02

### Added

- Initial React 19 + Vite 8 + Capacitor 8 client: TOTP/HOTP via `otpauth`,
  `otpauth://` parsing, QR scanning, per-second refresh, search, edit, JSON
  backup, SQLite and localStorage adapters.

[1.1.0]: https://github.com/weinotes/7xcircle-authenticator/releases/tag/v1.1.0
[1.0.0]: https://github.com/weinotes/7xcircle-authenticator
