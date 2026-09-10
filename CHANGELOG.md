# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Author: Davey Wong <wgwcko@gmail.com> (https://www.guangweiblog.com)

## [1.2.2] — 2026-09-10

### Fixed

- **Android 上开启应用锁报 “Query: Must provide an Array of Strings”**：
  `@capacitor-community/sqlite` 的 Android `query()` 强制要求 `values` 字段，
  而 `getAllTokens()` 没传，导致开启应用锁时 `rewriteAll()` 失败。现在显式传
  `values: []`，锁可以正常开启并完成加密。
- 受旧版本影响的设备升级后，下次解锁会自动重新加密仍为明文的令牌，
  无需手动关闭再开启应用锁。
- `rewriteAll()` 改为逐条 `updateToken()`，不再“先 DELETE 全表再逐条插入”，
  避免中途失败清空令牌。

## [1.2.1] — 2026-09-10

### Fixed

- 应用锁：连续第 5 次输错 PIN 立即进入冷却（此前第 6 次才触发），
  解锁页会显示剩余尝试次数；锁设置页「修改 PIN」与「关闭应用锁」不再共用
  同一个「当前 PIN」输入框，避免输入互相串改。
- Android 原生 SQLite 删除令牌改用参数化的 `run()`，此前用 `query()` 执行
  `DELETE` 可能静默失败。

### Added

- 设置页增加「检查更新 / 下载新版本」入口和版权信息
  （© 2026 Davey Wong / 7X Circle · Apache-2.0）。
- 首页标题下移并增大与状态栏/列表的间距。

### Changed

- 开源合规（WORK_CONVENTIONS 第十章）：全部源文件补 Apache-2.0 版权头与作者署名，
  `LICENSE` 与各文档补规范作者行，新增 `PATENTS.md` 与 `.githooks/pre-commit`；
  CI 工作流更名 `.github/workflows/ci.yml`；`vitest` 增加环境引导，
  修掉 Node 22+ 实验性全局 `localStorage` 遮蔽 jsdom 导致本机测试假失败的问题；
  文档同步修正「release APK 未签名」等与实现不符的旧描述。

## [1.2.0] — 2026-09-10

### Added

- 支持导入 Google Authenticator 的“导出账户”二维码
  （`otpauth-migration://`），一次可带多个账号，覆盖 SHA1/SHA256/SHA512、
  6/8 位、TOTP/HOTP counter；遇到不支持的 MD5 会明确报错而不是生成错误验证码。
- 点击验证码复制后显示「已复制 / 复制失败」反馈；Capacitor WebView 不支持
  `navigator.clipboard` 时自动回退到 `execCommand('copy')`。

### Fixed

- Android 全面屏适配：使用 Capacitor 注入的 `--safe-area-inset-*`，顶栏和
  底部添加按钮不再被状态栏/手势导航遮挡。
- Android 主题改为深色 NoActionBar 窗口，状态栏与导航栏使用浅色图标，
  避免深色界面出现亮色系统栏或看不清图标。

## [1.1.1] — 2026-09-10

### Changed

- 修复 CSS 层叠问题：全局 reset 原先写在 Tailwind `@layer` 之外，会覆盖所有
  `padding` / `margin` / 居中工具类，导致各页间距与对齐错乱。
- 页面统一收窄到移动端安全的 `max-w-md` 内容列，宽屏/平板不再整屏拉伸。
- 增加 `env(safe-area-inset-*)` 适配与暗色 `color-scheme`，Android 全面屏下
  顶栏/底部按钮不再被系统栏遮挡，背景也不再露出白边。

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
[1.1.1]: https://github.com/weinotes/7xcircle-authenticator/releases/tag/v1.1.1
[1.2.0]: https://github.com/weinotes/7xcircle-authenticator/releases/tag/v1.2.0
[1.2.1]: https://github.com/weinotes/7xcircle-authenticator/releases/tag/v1.2.1
[1.2.2]: https://github.com/weinotes/7xcircle-authenticator/releases/tag/v1.2.2
[1.0.0]: https://github.com/weinotes/7xcircle-authenticator
