# 资产文件说明

本目录包含应用所需的图像资源。

## 必需文件

- `icon.png` - 应用图标 (1024x1024 px)
- `splash.png` - 启动屏幕图像 (Recommended: 1242x2436 px)
- `adaptive-icon.png` - Android 自适应图标 (1024x1024 px, with padding)
- `favicon.png` - Web favicon (64x64 px)

## 占位符

在开发阶段，可以使用在线工具生成简单的占位符图标：

1. 访问 https://placeholder.com
2. 或使用 Expo 默认图标（删除自定义图标配置）

## 生产环境

发布到应用商店前，必须提供：

1. **高质量图标** - 遵循平台设计指南
2. **启动屏幕** - 与 app.json 中的 backgroundColor 匹配
3. **所有尺寸** - 系统会自动生成所需尺寸

## 快速开始

要快速测试，可以：

1. 从 https://expo.dev/static/images/expo-logo.png 下载 Expo Logo
2. 重命名为 `icon.png` 放到此目录
3. 暂时注释掉 app.json 中的 icon 配置

或运行：

```bash
# 使用 Expo 默认图标（推荐用于开发）
# 只需确保 assets/ 目录存在，不需要实际文件
# Expo 会使用默认图标
```

## 图标设计规范

### iOS
- 格式: PNG
- 尺寸: 1024x1024 px
- 无透明度
- 无圆角（系统会自动添加）

### Android
- 格式: PNG
- 自适应图标: 108x108 dp（前景 72x72 dp）
- 兼容图标: 512x512 px

### Web
- 格式: PNG 或 ICO
- 尺寸: 64x64 px 或更大
