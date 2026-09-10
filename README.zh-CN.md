# 7X Circle 验证器

简体中文 | [English](README.md)

[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

面向 [7X Circle](https://7xcircle.com) 交易俱乐部的离线 TOTP / HOTP 双因素验证器。React + Capacitor 实现，支持 Android 与 Web，无后端、无埋点、无账号体系。

## 功能清单

| 功能 | 状态 |
|---|---|
| TOTP（RFC 6238）与 HOTP（RFC 4226） | ✅ |
| SHA1 / SHA256 / SHA512，6 / 7 / 8 位，自定义周期 | ✅ |
| 扫码添加（`otpauth://`） | ✅ 仅原生 Android |
| 手动添加与编辑令牌 | ✅ |
| 导入 Google 验证器迁移二维码（`otpauth-migration://`） | ✅ 支持多账号 |
| 点击复制并显示反馈 | ✅ |
| 搜索、一键复制、实时倒计时 | ✅ |
| JSON 备份导出 / 导入 | ✅ 口令加密 |
| PIN 应用锁 + 静态加密 | ✅ 需手动开启 |
| 切到后台自动重新上锁 | ✅ |
| iOS 构建 | ❌ 暂不在范围内（仅 Android 与 Web） |
| 正式签名 APK | ✅ CI 打 `v*` tag 时自动签名并发布 |
| 生物识别解锁 | ❌ 未实现 |

## 兼容性

| 项目 | 支持情况 |
|---|---|
| Android 版本 | 8.0+（API 26，扫码插件的最低要求） |
| Android 15/16 全面屏 | ✅ 安全区 + 深色系统栏适配 |
| 旧款 WebView | ✅ 颜色/渐变回退，并在应用内提示更新 Android System WebView |
| Web 浏览器 | ✅ 现代浏览器（Chrome/Edge/Safari 最新版） |
| iOS | ❌ 未配置、未验证 |

## 安全模型（如实说明）

- **不发起任何网络请求。** 业务代码不含 `fetch`、`XMLHttpRequest`、`WebSocket`、`sendBeacon`，也没有任何远程地址；该结论由 `src/core/privacy.test.ts` 断言，而不只是写在文档里。清单中保留 `INTERNET` 权限，是因为 Android WebView 需要它加载本地打包资源。
- **密钥存放位置。** 原生端为 SQLite（库名 `sevencircle_auth`），Web 端为 `localStorage`（键名 `sevencircle_auth_tokens`）。
- **加密是可选的。** 开启应用锁后，令牌数据（Web）与每条 `secret` 字段（原生）都用 AES-256-GCM 加密，密钥由 PIN 经 PBKDF2-SHA256 六十万次迭代派生。派生密钥不可导出、只存在于内存，本机只保存盐值与一段用于校验的密文探针。
- **不开启应用锁时，密钥以明文存于本机。** 设置页会直接显示当前状态。若设备始终在你掌控之下，这可以接受；否则请开启应用锁。
- **无法阻止离线暴破，只能拖慢。** 能读到存储文件的人即可离线试 PIN。六十万次迭代让每次尝试都变昂贵，因此 PIN 至少 6 位且不得为连续或重复数字。
- **已关闭 Android 自动备份**（`allowBackup="false"`），避免 Google Drive 备份带走一份密钥。
- **忘记 PIN 等于数据丢失。** 没有找回通道，只能用导出时的加密备份恢复；备份口令与 PIN 相互独立。

## 开发环境

需要 Node >= 20 与 pnpm 11。

```bash
pnpm install
pnpm dev         # Vite 开发服务
pnpm test        # 单元测试（vitest）
pnpm type-check  # tsc -b
pnpm lint        # oxlint
pnpm build       # 产出 dist/
```

### Android 构建

```bash
pnpm build
npx cap sync android
npx cap open android   # 或：cd android && ./gradlew assembleDebug
```

需要 JDK 21 与含 `platforms;android-36` 的 Android SDK。CI 执行同样的步骤，见 `.github/workflows/ci.yml`。

## 目录结构

```
src/
├── core/          # 纯逻辑：OTP、URI 解析、加密、品牌常量、应用锁
├── db/            # Database 门面 + SQLite / localStorage 适配器
├── store/         # zustand 状态
├── hooks/         # useTOTP（每秒刷新）、useBarcodeScanner
├── components/    # TokenList、TokenCard、LockScreen
└── pages/         # 添加、编辑、设置、应用锁设置
```

所有品牌文案、存储键前缀与应用标识统一来自 [`src/core/brand.ts`](src/core/brand.ts)。
`brand.test.ts` 会在旧品牌标识回流、或版本号与 `package.json` 不一致时让构建失败。

## 参与贡献

见 [CONTRIBUTING.md](CONTRIBUTING.md)。发现安全漏洞请依 [SECURITY.md](SECURITY.md) 私报，不要开公开 issue。

## 合规与版权

- 隐私政策：[PRIVACY.md](PRIVACY.md)；用户协议：[TERMS.md](TERMS.md)
- 开源许可与第三方组件：[LICENSE](LICENSE)、[NOTICE](NOTICE)、[THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)
- 国内安卓应用市场上架清单：[docs/china-android-store-checklist.md](docs/china-android-store-checklist.md)
- 软件著作权（软著）申请与源代码文档生成：[docs/software-copyright.md](docs/software-copyright.md)

## 许可证

Apache-2.0，详见 [LICENSE](LICENSE)。

Author: Davey Wong <wgwcko@gmail.com> (https://www.guangweiblog.com)
Copyright 2026 Davey Wong <wgwcko@gmail.com> / 7X Circle.
