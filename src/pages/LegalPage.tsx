/**
 * 7X Circle Authenticator — in-app privacy policy, terms and OSS notices
 *
 * @author Davey Wong <wgwcko@gmail.com>
 * @copyright 2026 Davey Wong <wgwcko@gmail.com> / 7X Circle
 * @license SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. See LICENSE.
 */
interface LegalPageProps {
  onBack: () => void
}

const SECTIONS = [
  {
    title: '隐私政策',
    body: [
      '生效日期：2026-09-10。本政策适用于 7X Circle 验证器（Android 与 Web）。',
      '一、信息收集：本应用不要求注册或登录，不收集姓名、手机号、邮箱、位置、通讯录、短信、设备标识符等个人信息，也不含统计、广告或崩溃上报 SDK，不向任何服务器上传数据。',
      '二、权限说明：CAMERA（相机）仅在你点击「扫描二维码」时调用，用于本地识别 otpauth:// / otpauth-migration:// 二维码，图像不上传；INTERNET（网络）仅用于 Android WebView 加载 APK 内的本地网页资源，应用代码不发起网络请求，该结论由隐私测试自动断言。',
      '三、本地数据：令牌密钥、账户名、发行方以及应用锁的盐值与校验探针只保存在本机（SQLite 库 sevencircle_auth 或浏览器 localStorage）。开启应用锁后，密钥用 AES-256-GCM 加密，加密密钥由 PIN 经 PBKDF2-SHA256 60 万次迭代派生且只存在于内存。',
      '四、备份：导出文件由你设置的备份密码加密，是否导出、保存在哪里完全由你决定；导出文件离开本机后本应用无法控制，请自行妥善保管。',
      '五、第三方组件：扫码使用 Google ML Kit 条码识别与 @capacitor/barcode-scanner，数据在设备本地处理，不上传；其余运行时组件为 MIT/Apache-2.0 开源库，不进行广告或设备标识采集。完整清单见「开源许可」。',
      '六、共享、转让与公开披露：不会发生。',
      '七、你的权利：你可以随时在设置中关闭应用锁、导出或删除数据，或清除应用数据 / 卸载应用。',
      '八、未成年人：本应用不面向儿童单独提供服务，建议在监护人指导下使用。',
      '九、政策更新与联系方式：政策变更会随版本发布在本页面。联系邮箱 support@7xcircle.com 或 wgwcko@gmail.com。',
    ],
  },
  {
    title: '用户协议与免责声明',
    body: [
      '一、许可：本应用源代码以 Apache-2.0 许可证发布。你可以在遵守该许可证的前提下使用、修改和分发。',
      '二、服务性质：本应用是离线 TOTP/HOTP 验证码生成工具，不提供账号、云同步、找回或客服代取服务。',
      '三、密钥与 PIN 丢失：应用锁 PIN 与备份密码没有任何找回通道。忘记 PIN 将无法解密本机密钥；丢失备份密码同样无法恢复数据。',
      '四、免责声明：本应用按「现状」提供，不附带任何明示或默示担保。因设备丢失、系统清理、误删、密码遗忘、Root/越狱、恶意软件或使用不当造成的数据丢失或账户损失，由使用者自行承担。',
      '五、使用限制：不得将本应用用于任何违法违规用途，不得用于未经授权访问他人账户。',
      '六、责任限制：在适用法律允许的范围内，作者与 7X Circle 不对任何间接、附带或后果性损失承担责任。',
      '七、适用法律：本协议适用中华人民共和国法律。',
    ],
  },
  {
    title: '开源许可与第三方组件',
    body: [
      '本项目：7X Circle Authenticator，Copyright 2026 Davey Wong <wgwcko@gmail.com> / 7X Circle，Apache License 2.0。',
      'React、React DOM：MIT License，Copyright Meta Platforms, Inc. and affiliates。',
      'Capacitor Core / Android / Camera：MIT License，Copyright Ionic。',
      '@capacitor/barcode-scanner：MIT License，Copyright OutSystems；底层使用 Ionic ionbarcode-android。',
      'Google ML Kit 条码扫描：Google 专有 SDK，按 Google APIs 服务条款使用，随 APK 打包并在本地运行。',
      '@capacitor-community/sqlite：MIT License，Copyright Quéau Jean Pierre。',
      'otpauth：MIT License；zustand：MIT License；uuid：MIT License。',
      '完整许可证文本与版权声明见仓库 THIRD_PARTY_NOTICES.md 与 NOTICE。',
    ],
  },
]

export function LegalPage({ onBack }: LegalPageProps) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#1a1a2e] px-4 pt-[max(1.5rem,var(--app-safe-top))] pb-[max(2rem,var(--app-safe-bottom))]">
      <div className="mb-6 flex items-center">
        <button onClick={onBack} className="mr-3 text-gray-400 hover:text-white" aria-label="返回">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-white">法律与开源信息</h1>
      </div>

      <div className="space-y-4">
        {SECTIONS.map((section) => (
          <section key={section.title} className="rounded-xl bg-[#16213e] p-4">
            <h2 className="mb-3 text-sm font-semibold text-white">{section.title}</h2>
            <div className="space-y-2">
              {section.body.map((paragraph) => (
                <p key={paragraph} className="text-xs leading-relaxed text-gray-400">
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
