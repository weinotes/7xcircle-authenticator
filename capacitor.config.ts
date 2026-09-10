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
