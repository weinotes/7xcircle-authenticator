# Juezhao Auth - 觉照验证器

[![Build Status](https://github.com/juezhao/juezhao-auth/actions/workflows/build-apk.yml/badge.svg)](https://github.com/juezhao/juezhao-auth/actions/workflows/build-apk.yml)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

Juezhao Auth 是一款基于 React 和 Capacitor 的跨平台 TOTP/HOTP 双因素认证客户端，支持二维码扫描、本地加密存储及实时验证码刷新。

## 功能特性

- **TOTP/HOTP 双因素认证**：支持 SHA1/SHA256/SHA512 算法，6/7/8 位验证码
- **二维码扫描**：集成 Capacitor 条码扫描器，一键添加令牌
- **URI 解析**：支持标准 `otpauth://` 协议格式
- **本地加密存储**：使用 SQLite 持久化，数据加密保护
- **实时刷新**：每秒更新验证码，进度条可视化倒计时
- **导入/导出**：支持 JSON 格式的数据备份与恢复
- **搜索过滤**：快速查找令牌

## 技术栈

- **框架**：React 19 + TypeScript
- **构建工具**：Vite 8
- **样式**：TailwindCSS 4
- **状态管理**：Zustand 5
- **移动端桥接**：Capacitor 8
- **数据库**：SQLite (@capacitor-community/sqlite)
- **OTP 引擎**：otpauth
- **测试**：Vitest

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 运行测试

```bash
pnpm test
```

### Android 构建

```bash
# 同步 Capacitor
npx cap sync android

# 构建 APK
cd android && ./gradlew assembleDebug
```

## 项目结构

```
src/
├── core/              # 核心逻辑
│   ├── types.ts       # 类型定义
│   ├── totp.ts        # TOTP/HOTP 生成
│   └── uri-parser.ts  # URI 解析与生成
├── db/                # 数据持久化
│   ├── database.ts    # 数据库抽象层
│   └── adapters/      # 存储适配器
├── hooks/             # 自定义 Hooks
│   └── useTOTP.ts     # 实时 TOTP 计算
├── store/             # 状态管理
│   └── app-store.ts   # Zustand Store
├── components/        # UI 组件
│   ├── TokenCard.tsx  # 令牌卡片
│   └── TokenList.tsx  # 令牌列表
├── pages/             # 页面组件
│   ├── AddTokenPage.tsx   # 添加令牌页
│   └── SettingsPage.tsx   # 设置页
├── App.tsx            # 根组件
├── main.tsx           # 入口文件
└── index.css          # 全局样式
```

## 安全说明

- 所有令牌数据存储在本地，不会上传到云端
- 密钥使用 AES-GCM 加密存储
- 建议定期导出数据进行备份

## 许可证

Apache License 2.0 - 详见 [LICENSE](LICENSE)
