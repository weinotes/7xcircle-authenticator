# 下载页（standalone download page）

面向应用的公开下载入口：给会员一个只做一件事的静态页面 —— 下载正式签名的 Android APK。

## 为什么是独立目录

- **与应用解耦**：`src/` 是 TOTP 客户端，下载页不属于应用逻辑，也不进 APK 包体（不在 `public/`、不在 Vite 构建里）。
- **零依赖、零构建**：单个 `index.html`，样式内联，不引用 CDN，可直接丢到任何静态托管或 CDN 回源目录。
- **不会静默过期**：`src/core/brand.test.ts` 会断言页面上的版本号、两个下载直链与 SHA-256 格式，改动版本却忘记更新本页时 CI 直接失败。

## 文件

| 文件 | 说明 |
|---|---|
| `index.html` | 页面本体：下载按钮（GitHub 主站 / Gitee 国内镜像）、安装步骤、SHA-256 校验、兼容性、安全说明、常见问题、版本与源码 |
| `app-icon.png` | 应用图标（与 `public/icon.png` 同一张） |
| `favicon.png` | 站点图标（与 `public/favicon.png` 同一张） |
| `og-image.png` | 社交分享大图 1200×630，由 `scripts/generate-og-image.py` 生成 |
| `robots.txt` | 允许全站抓取并指向 sitemap |
| `sitemap.xml` | 单页 sitemap，canonical 为 <https://auth.7xcircle.com/> |

## SEO / GEO

页面面向两套检索系统做优化：

- **传统搜索**：唯一 `<title>`、description、keywords、canonical、Open Graph、Twitter Card（`summary_large_image`）。
- **生成式检索（GEO）**：三段 JSON-LD —— `SoftwareApplication`（含 `offers.price=0`、`featureList`、`author`）、`WebSite`、`FAQPage`；FAQ 的可见内容与 `FAQPage` 一一对应，机器可读的答案与页面上人能看到的一致。

`src/core/brand.test.ts` 的 `download page SEO` 断言会校验：三个旁挂文件存在、canonical / `og:url` / sitemap / robots 指向同一域名、每段 JSON-LD 能被解析、`softwareVersion` 等于 `package.json` 版本、`FAQPage` 的问题列表与页面上的 `<article class="faq-item">` 完全一致。

改了 FAQ 的可见文案就要同步改 `FAQPage`，否则测试会失败 —— 这是刻意的。

重新生成分享图：

```bash
python3 scripts/generate-og-image.py   # 需要 Pillow
```

## 本地预览

```bash
python3 -m http.server 8781 --directory download   # 打开 http://127.0.0.1:8781
```

## 部署（三选一）

1. **Cloudflare Pages**（已上线）
   - 项目：`7xcircle-authenticator`，生产分支 `main`，地址 <https://7xcircle-authenticator.pages.dev>
   - 直接上传：在**仓库外**的目录执行，避免 wrangler 的 autoconfig 改动仓库文件：
     ```bash
     cd /tmp && npx wrangler pages deploy "<仓库绝对路径>/download" \
       --project-name=7xcircle-authenticator --branch=main
     ```
   - Git 集成：Dashboard → Workers & Pages → 连接该仓库，构建命令留空，构建输出目录填 `download`。
2. **静态托管 / VPS**：把 `download/` 整个目录作为站点根目录发布即可，无需 Node 运行时。
3. **GitHub Pages**：新建 Pages 站点指向本目录（大陆访问较慢，适合作为备用入口）。

### Cloudflare 部署的两个坑

- **必须在仓库外目录执行。** wrangler 4 的 autoconfig 会探测到本仓库的 Vite 工程，然后改写
  `package.json`（加 wrangler 依赖）、`vite.config.ts`、`pnpm-lock.yaml`、`pnpm-workspace.yaml`。
  从仓库内跑过一次就会留下这些改动，需要手动 `git restore`。
- **`pages project create` 首次需要 `--force`。** 不带 `--force` 时 wrangler 4 会把命令委派给
  新的 Workers 流程并报错；项目已存在后不再需要 `--force`。

### 自定义域名（已上线）

主入口：<https://auth.7xcircle.com>（2026-10-09 起）。

不必把 7xcircle.com 的 NS 迁到 Cloudflare。做法是在 DNSPod 加一条 CNAME
`auth` → `7xcircle-authenticator.pages.dev`，再在 Pages 项目里添加同名自定义域名；
CF 以 http 方式自动完成验证并签发证书（Google Trust Services，90 天有效），无需手工传证书。
添加后 `status` 会先 `pending` 一两分钟，随后 `active`。
同账号的 `7xcircle-web` 项目用同样方式绑定了 `wallet.7xcircle.com`。

## 发版时要改什么

1. 版本号：页面里的 `v<版本>`、`<meta name="app-version">`。
2. Gitee 镜像直链中的 `v<版本>`（Gitee 不支持 `releases/latest`，必须写死 tag）。
3. SHA-256：取自 GitHub Release 资产旁标注的 digest（`gh api repos/weinotes/<slug>/releases/tags/<tag>` 的 `assets[].digest`）。

> 前两项由测试强制；第三项测试只能校验格式是 64 位十六进制，取值仍需人工从 Release 复制。

Owner: Davey Wong <wgwcko@gmail.com> ｜ 建立：2026-10-09 ｜ 复审：每次发版
