# Contributing

Author: Davey Wong <wgwcko@gmail.com> (https://www.guangweiblog.com)

Thanks for taking the time. This is a small, single-maintainer project, so the
barrier to a useful contribution is low.

## Setup

```bash
pnpm install
pnpm dev            # http://localhost:5173
pnpm test           # vitest
pnpm type-check     # tsc -b
pnpm lint           # oxlint
```

Android needs JDK 21 and an Android SDK with `platforms;android-36`:

```bash
pnpm build && npx cap sync android
cd android && ./gradlew assembleDebug
```

## Ground rules

- **Never log or transmit a secret.** No `console.log` of a token, no telemetry,
  no remote URL in app code — `src/core/privacy.test.ts` will fail the build.
- **No new dependencies without a reason.** Every dependency is attack surface in
  an authenticator. Say what problem it solves that ~30 lines cannot.
- **Crypto changes need tests.** A round-trip plus a negative case (wrong key must
  throw, not return garbage).
- **UI copy is Chinese-first** with the English form in `src/core/brand.ts`.
- Run `pnpm test && pnpm type-check && pnpm lint` before opening a PR; CI runs
  exactly those three plus `pnpm build`.

## Brand identifiers are derived, never typed

All names, addresses and storage prefixes come from
[`src/core/brand.ts`](src/core/brand.ts). Two rules the tests enforce:

1. `BRAND.version` and `BRAND.slug` must equal `package.json`, and Android's
   `versionName` is read from `package.json` by `android/app/build.gradle`.
2. `BRAND.appId` must be a **legal Java package**: a segment may not start with a
   digit, which is why the domain root `7xcircle` becomes `sevencircle`. Never
   "fix" this back to the literal domain — it breaks Gradle.

When the brand changes again, update that one file, then run the suite: the
zero-legacy-identifier test lists every remaining hit.

## Releasing

1. Update `package.json` version and `BRAND.version` together, add a `CHANGELOG.md` entry.
2. `pnpm test && pnpm build`, then commit and tag `vX.Y.Z`.
3. Pushing the tag runs CI, which publishes debug and release APKs.

**How the release APK is signed.** `android/app/build.gradle` switches on
`signingConfigs.release` only while all four signing variables are present, so the
key itself never enters the repository. CI injects them from repository secrets:

| Secret | Purpose |
|---|---|
| `ANDROID_KEYSTORE_BASE64` | the keystore, base64-encoded, decoded to a temp file |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| `ANDROID_KEY_ALIAS` | key alias inside the keystore |
| `ANDROID_KEY_PASSWORD` | key password |

Pushing a `v*` tag makes CI export `ANDROID_KEYSTORE_FILE` plus the three other
variables, so the published `*-release.apk` is signed with the project key. The
debug APK is debug-signed on every build.

### Publishing to Gitee (China mirror)

When the `GITEE_TOKEN` repository secret is present, pushing a `v*` tag also:

1. pushes the tag and `main` to `gitee.com/weinotes/7xcircle-authenticator`;
2. creates the matching Gitee Release (skipped if it already exists);
3. uploads the signed `app-release.apk` as a Gitee Release attachment using
   [`scripts/publish-gitee.mjs`](scripts/publish-gitee.mjs).

Gitee serves the attachment from a domestic CDN, so users in mainland China can
download it much faster than from GitHub Releases. The token is stored only as a
GitHub Actions secret. If it is ever exposed, revoke it in Gitee → 设置 →
私人令牌 and set a new `GITEE_TOKEN` secret; nothing in the repository contains
the token.

A fork without those secrets still builds — its release APK is simply unsigned.
To sign your own, create a keystore and set the four variables:

```bash
keytool -genkeypair -v -keystore release.jks -alias 7xcircle -keyalg RSA \
  -keysize 2048 -validity 10000
```

## Pull requests

- One concern per PR; describe the *why*, link the issue.
- For a new feature, open an issue first — this app deliberately stays small.
- Sign off every commit with `git commit -s` (Developer Certificate of Origin,
  see [`DCO.md`](DCO.md)). Contributions are accepted under Apache-2.0.

## 版权与合规材料

- 许可证、第三方组件声明：[`LICENSE`](LICENSE)、[`NOTICE`](NOTICE)、
  [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)
- 隐私政策与用户协议：[`PRIVACY.md`](PRIVACY.md)、[`TERMS.md`](TERMS.md)
