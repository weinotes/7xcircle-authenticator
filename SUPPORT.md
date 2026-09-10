# Support

Author: Davey Wong <wgwcko@gmail.com> (https://www.guangweiblog.com)

This is free, open-source software with no service behind it. Support is
asynchronous and best-effort.

## Before asking

1. **Lost PIN or backup password**: not recoverable, by design. There is no
   server holding a copy. Restore from a previously exported backup, otherwise
   re-enroll each account at the provider.
2. **Codes not matching**: check the device clock (TOTP drifts with it), then the
   algorithm / digits / period against what the provider issued. Re-scan the QR
   rather than retyping the secret.
3. **Camera will not open**: grant the camera permission in Android settings.
4. **After an upgrade your old codes are missing**: the app id changed, so the
   previous install is a separate application. Import your backup into the new
   build, then uninstall the old one.

## Where to ask

- Bugs and features: [open an issue](https://github.com/weinotes/7xcircle-authenticator/issues).
- Security: private report per [SECURITY.md](SECURITY.md), never a public issue.
- 7X Circle membership questions: **support@7xcircle.com**.

## What is not supported

Building from source is documented in [CONTRIBUTING.md](CONTRIBUTING.md); forks
are welcome under Apache-2.0, but we cannot help maintain a private fork, sign an
APK with your own key for you, or add cloud sync — that is out of scope.
