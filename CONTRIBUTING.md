# Contributing

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

**The release APK is currently unsigned.** To sign it, add a keystore and wire it
through Gradle properties rather than committing secrets:

```bash
keytool -genkeypair -v -keystore release.jks -alias 7xcircle -keyalg RSA \
  -keysize 2048 -validity 10000
```

Then store `RELEASE_STORE_FILE`, `RELEASE_STORE_PASSWORD`, `RELEASE_KEY_ALIAS`
and `RELEASE_KEY_PASSWORD` as CI secrets, read them in
`android/app/build.gradle` into a `signingConfigs.release` block, and set
`signingConfig` on the `release` build type. Keep the debug fallback so forks
without secrets still build.

## Pull requests

- One concern per PR; describe the *why*, link the issue.
- For a new feature, open an issue first — this app deliberately stays small.
