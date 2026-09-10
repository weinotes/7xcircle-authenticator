/**
 * 7X Circle Authenticator — capacitor native shell configuration
 *
 * @author Davey Wong <wgwcko@gmail.com>
 * @copyright 2026 Davey Wong <wgwcko@gmail.com> / 7X Circle
 * @license SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. See LICENSE.
 */
import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.sevencircle.auth',
  appName: '7X Circle 验证器',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#1a1a2e',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
    // Android 全面屏：使用 CSS 安全区变量，并让状态栏/导航栏使用浅色图标。
    SystemBars: {
      style: 'DARK',
      insetsHandling: 'css',
    },
  },
}

export default config
