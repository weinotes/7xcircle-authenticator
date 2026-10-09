# 下载页（standalone download page）

面向应用的公开下载入口：给会员一个只做一件事的静态页面 —— 下载正式签名的 Android APK。

## 为什么是独立目录

- **与应用解耦**：`src/` 是 TOTP 客户端，下载页不属于应用逻辑，也不进 APK 包体（不在 `public/`、不在 Vite 构建里）。
- **零依赖、零构建**：单个 `index.html`，样式内联，不引用 CDN，可直接丢到任何静态托管或 CDN 回源目录。
- **不会静默过期**：`src/core/brand.test.ts` 会断言页面上的版本号、两个下载直链与 SHA-256 格式，改动版本却忘记更新本页时 CI 直接失败。

## 文件

| 文件 | 说明 |
|---|---|
| `index.html` | 页面本体：下载按钮（GitHub 主站 / Gitee 国内镜像）、安装步骤、SHA-256 校验、兼容性、安全说明、版本与源码 |
| `app-icon.png` | 应用图标（与 `public/icon.png` 同一张） |
| `favicon.png` | 站点图标（与 `public/favicon.png` 同一张） |

## 本地预览

```bash
python3 -m http.server 8781 --directory download   # 打开 http://127.0.0.1:8781
```

## 部署（三选一）

1. **Cloudflare Pages**（海外快、大陆可直连）：新建 Pages 项目，构建命令留空，构建输出目录填 `download`。
2. **静态托管 / VPS**：把 `download/` 整个目录作为站点根目录发布即可，无需 Node 运行时。
3. **GitHub Pages**：新建 Pages 站点指向本目录（大陆访问较慢，适合作为备用入口）。

## 发版时要改什么

1. 版本号：页面里的 `v<版本>`、`<meta name="app-version">`。
2. Gitee 镜像直链中的 `v<版本>`（Gitee 不支持 `releases/latest`，必须写死 tag）。
3. SHA-256：取自 GitHub Release 资产旁标注的 digest（`gh api repos/weinotes/<slug>/releases/tags/<tag>` 的 `assets[].digest`）。

> 前两项由测试强制；第三项测试只能校验格式是 64 位十六进制，取值仍需人工从 Release 复制。

Owner: Davey Wong <wgwcko@gmail.com> ｜ 建立：2026-10-09 ｜ 复审：每次发版
