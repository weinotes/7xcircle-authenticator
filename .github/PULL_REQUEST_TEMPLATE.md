## What changes

- 

## Why

<!-- Link the issue. If it is a behaviour change for users, say so plainly. -->

Closes #

## Checklist

- [ ] `pnpm type-check` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` passes
- [ ] `pnpm dev` checked on web **and** `npx cap sync android` checked on device
- [ ] New/changed crypto or storage logic has a test, including a failure case
- [ ] No secret, `otpauth://` URI or backup file appears in code, logs, screenshots or commits
- [ ] Brand strings come from `src/core/brand.ts`, not a literal
- [ ] `package.json` version and `BRAND.version` updated together, with a `CHANGELOG.md` entry
- [ ] README (both languages) updated if a documented promise changed

## Security review notes

<!-- Delete if not applicable: anything touching keys, PIN, backup format or permissions. -->
