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
  },
}

export default config
