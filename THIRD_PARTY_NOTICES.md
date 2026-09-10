# Third-Party Notices / 第三方组件声明

Author: Davey Wong <wgwcko@gmail.com> (https://www.guangweiblog.com)

This file lists the runtime components bundled in the Android / web builds and
their license terms. Development-only tools (Vite, vitest, oxlint, TypeScript)
are not shipped inside the APK.

## Open-source runtime components

| Component | Version | License | Copyright |
|---|---|---|---|
| React / React DOM | 19.2.x | MIT | Meta Platforms, Inc. and affiliates |
| Capacitor Core / Android / Camera | 8.x | MIT | Ionic |
| @capacitor/barcode-scanner | 3.0.x | MIT | OutSystems |
| @capacitor-community/sqlite | 8.1.x | MIT | Quéau Jean Pierre |
| otpauth | 9.5.x | MIT | Héctor Molinero Fernández |
| zustand | 5.x | MIT | Paul Henschel and contributors |
| uuid | 14.x | MIT | uuid contributors |
| AndroidX libraries | as pinned in `android/variables.gradle` | Apache-2.0 | The Android Open Source Project |

The full MIT / Apache-2.0 license texts are available in the corresponding
`node_modules/<package>/LICENSE` files and are reproduced in the application's
「隐私政策 / 用户协议 / 开源许可」 page.

## Proprietary components (not open source)

| Component | Version | Terms |
|---|---|---|
| Google ML Kit barcode scanning (`com.google.mlkit:barcode-scanning`) | 17.3.x | Google APIs Terms of Service / ML Kit Terms; the model is bundled in the APK and runs locally. |
| Ionic `io.ionic.libs:ionbarcode-android` | 2.0.x | Distributed by Ionic; review Ionic's terms before commercial distribution. |

These components do **not** change the license of this project's own source
code (Apache-2.0), but the published APK is not a purely open-source artifact.

## No network, no telemetry

None of the bundled components is used for advertising, analytics, crash
reporting or device fingerprinting. `src/core/privacy.test.ts` fails the build
if app code gains a network API or a remote endpoint.
