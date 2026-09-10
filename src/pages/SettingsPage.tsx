/**
 * 7X Circle Authenticator — settings: lock status, encrypted backup, about
 *
 * @author Davey Wong <wgwcko@gmail.com>
 * @copyright 2026 Davey Wong <wgwcko@gmail.com> / 7X Circle
 * @license SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. See LICENSE.
 */
import { useState } from 'react'
import { MIN_BACKUP_PASSWORD_LENGTH, db } from '../db/database'
import { BRAND } from '../core/brand'
import { clearAutoLockSuppression, isLockConfigured, suppressAutoLock } from '../core/lock'

interface SettingsPageProps {
  onBack: () => void
  onOpenLock: () => void
  onOpenLegal: () => void
}

export function SettingsPage({ onBack, onOpenLock, onOpenLegal }: SettingsPageProps) {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [exportPassword, setExportPassword] = useState('')
  const [importPassword, setImportPassword] = useState('')
  const [message, setMessage] = useState('')
  const lockOn = isLockConfigured()

  const flash = (text: string) => {
    setMessage(text)
    setTimeout(() => setMessage(''), 4000)
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      const data = await db.exportData(exportPassword)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${BRAND.slug}-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 0)
      setExportPassword('')
      flash('已导出加密备份文件')
    } catch (err) {
      flash((err as Error).message || '导出失败')
    } finally {
      setExporting(false)
    }
  }

  const handleImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    document.body.appendChild(input)
    // 系统文件选择器会让 WebView 变成 hidden；这段时间不要自动上锁，
    // 否则用户选完文件回来会落到锁屏，导入也会因密钥丢失而失败。
    suppressAutoLock()
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) {
        clearAutoLockSuppression()
        input.remove()
        return
      }
      try {
        setImporting(true)
        const text = await file.text()
        const count = await db.importData(text, importPassword)
        setImportPassword('')
        flash(`导入成功，共 ${count} 条令牌`)
        setTimeout(() => window.location.reload(), 1500)
      } catch (err) {
        flash((err as Error).message || '导入失败，文件格式无效')
      } finally {
        setImporting(false)
        clearAutoLockSuppression()
        input.remove()
      }
    }
    input.click()
  }

  const passwordField = (
    value: string,
    onChange: (v: string) => void,
  ) => (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      type="password"
      autoComplete="new-password"
      placeholder={`备份密码（至少 ${MIN_BACKUP_PASSWORD_LENGTH} 位）`}
      className="w-full mt-3 bg-[#0f1729] border border-[#2a3b5c] rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-indigo-500"
    />
  )

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#1a1a2e] px-4 pt-[max(1.5rem,var(--app-safe-top))] pb-[max(2rem,var(--app-safe-bottom))]">
      {/* 头部 */}
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="text-gray-400 hover:text-white mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-white">设置</h1>
      </div>

      {message && (
        <div className="bg-blue-900/30 border border-blue-800 text-blue-400 rounded-xl p-3 mb-4 text-sm">
          {message}
        </div>
      )}

      <div className="space-y-3">
        {/* 应用锁 */}
        <button
          onClick={onOpenLock}
          className="w-full bg-[#16213e] rounded-xl p-4 flex items-center justify-between hover:bg-[#1a2744] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-900/50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-white">应用锁</div>
              <div className="text-xs text-gray-500">
                {lockOn ? '已开启 · PIN 派生密钥加密存储' : '未开启 · 密钥明文存储在本机'}
              </div>
            </div>
          </div>
          <span className="text-gray-600">{'>'}</span>
        </button>

        {/* 数据导出 */}
        <div className="w-full bg-[#16213e] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-900/50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-white">导出数据</div>
              <div className="text-xs text-gray-500">用备份密码加密后导出 JSON</div>
            </div>
          </div>
          {passwordField(exportPassword, setExportPassword)}
          <button
            onClick={handleExport}
            disabled={exporting || exportPassword.length < MIN_BACKUP_PASSWORD_LENGTH}
            className="w-full mt-3 bg-[#1a2744] border border-[#2a3b5c] text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-40"
          >
            {exporting ? '导出中…' : '导出'}
          </button>
        </div>

        {/* 数据导入 */}
        <div className="w-full bg-[#16213e] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-900/50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-white">导入数据</div>
              <div className="text-xs text-gray-500">从备份文件恢复令牌（会覆盖现有数据）</div>
            </div>
          </div>
          {passwordField(importPassword, setImportPassword)}
          <button
            onClick={handleImport}
            disabled={importing}
            className="w-full mt-3 bg-[#1a2744] border border-[#2a3b5c] text-white text-sm font-semibold py-2.5 rounded-lg disabled:opacity-40"
          >
            {importing ? '导入中…' : '选择备份文件'}
          </button>
        </div>

        {/* 关于 */}
        <div className="bg-[#16213e] rounded-xl p-4 mt-6">
          <div className="text-center">
            <div className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              {BRAND.nameZh}
            </div>
            <div className="text-xs text-gray-500 mt-1">v{BRAND.version}</div>
            <div className="text-xs text-gray-600 mt-3">
              离线 TOTP 双因素验证器 · {BRAND.domain}
            </div>
          </div>

          <button
            onClick={onOpenLegal}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[#2a3b5c] bg-[#1a2744] py-2.5 text-sm font-semibold text-white transition-colors hover:border-indigo-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            隐私政策 / 用户协议 / 开源许可
          </button>

          <a
            href={BRAND.releasesUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-[#2a3b5c] bg-[#1a2744] py-2.5 text-sm font-semibold text-white transition-colors hover:border-indigo-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            检查更新 / 下载新版本
          </a>
          <p className="mt-2 text-center text-[11px] text-gray-600">
            最新正式签名 APK 发布在 GitHub Releases
          </p>

          <div className="mt-4 border-t border-[#23324f] pt-3 text-center text-[11px] leading-relaxed text-gray-600">
            © 2026 Davey Wong / 7X Circle · Apache-2.0 开源许可
          </div>
        </div>
      </div>
    </div>
  )
}
