# 图标资产说明 / Icon assets

本目录只保留**生成产物**与规范文档，不手工编辑 PNG。

## 文件清单

| 文件 | 尺寸 | 用途 |
|---|---|---|
| `logo-tile.png` | 1024×1024 | 母版方块（深色底 + 7X 标识），其他尺寸的来源 |
| `icon.png` | 1024×1024 | 应用图标 / `apple-touch-icon` |
| `adaptive-icon.png` | 1024×1024 | Android 自适应图标前景层（透明底，图形居中 60%） |
| `favicon.png` | 180×180 | Web favicon |
| `splash.png` | 1242×2732 | 启动屏 |

标识规范与授权状态见 [logo-guidelines.md](logo-guidelines.md)。本目录只放图像资产，
文档一律置于 `docs/`，否则会被 Vite 复制进 `dist/` 并随 APK 分发。

Android 各密度图标位于 `android/app/src/main/res/mipmap-*/`，由同一脚本生成：
`ic_launcher.png`（圆角方块）、`ic_launcher_round.png`（圆形）、
`ic_launcher_foreground.png`（自适应前景层）。自适应图标背景色由
`res/values/ic_launcher_background.xml` 提供，取值 `#09090B`。

## 重新生成

```bash
python3 scripts/generate-icons.py <母版图.png>
```

脚本会裁掉生成图四周的白底与角标水印、按纯色背景内缩 6%、加圆角，再输出上表全部
尺寸。更换品牌时只需替换母版并重跑该命令，不要逐张改图。

依赖 Pillow：`pip3 install pillow`。

## 不要做的事

- 不要在本目录新增第三方下载的旧品牌图标。
- 不要手工调整单张尺寸后提交（会被下次生成覆盖）。
- 不要把 `adaptive-icon.png` 直接当 `icon.png` 用：前者是透明底前景层。
