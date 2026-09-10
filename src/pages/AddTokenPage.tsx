/**
 * 7X Circle Authenticator — enrol a token by QR scan or by manual entry
 *
 * @author Davey Wong <wgwcko@gmail.com>
 * @copyright 2026 Davey Wong <wgwcko@gmail.com> / 7X Circle
 * @license SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. See LICENSE.
 */
import { useState } from 'react'
import type { TokenInput } from '../core/types'
import { parseAccountURI } from '../core/uri-parser'
import { isValidSecret } from '../core/totp'
import { useBarcodeScanner } from '../hooks/useBarcodeScanner'

interface AddTokenPageProps {
  onAdd: (input: TokenInput) => Promise<void>
  onBack: () => void
}

export function AddTokenPage({ onAdd, onBack }: AddTokenPageProps) {
  const [mode, setMode] = useState<'uri' | 'manual'>('uri')
  const [uri, setUri] = useState('')
  const [issuer, setIssuer] = useState('')
  const [account, setAccount] = useState('')
  const [secret, setSecret] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { scan, isScanning } = useBarcodeScanner()

  const submitAccountURI = async (value: string) => {
    setSubmitting(true)
    const inputs = parseAccountURI(value)
    for (const input of inputs) {
      await onAdd(input)
    }
    onBack()
  }

  const handleScan = async () => {
    try {
      setError('')
      const result = await scan()
      setUri(result.content)
      if (result.content.startsWith('otpauth://') || result.content.startsWith('otpauth-migration://')) {
        await submitAccountURI(result.content)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '扫描失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleURISubmit = async () => {
    try {
      setError('')
      await submitAccountURI(uri.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : '解析 URI 失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleManualSubmit = async () => {
    try {
      setError('')
      if (!issuer.trim()) {
        setError('请输入服务名称')
        return
      }
      if (!account.trim()) {
        setError('请输入账户名')
        return
      }
      if (!secret.trim()) {
        setError('请输入密钥')
        return
      }
      const cleanSecret = secret.replace(/\s/g, '').toUpperCase()
      if (!isValidSecret(cleanSecret)) {
        setError('密钥格式无效（仅支持 A-Z 和 2-7）')
        return
      }
      setSubmitting(true)
      await onAdd({
        issuer: issuer.trim(),
        accountName: account.trim(),
        secret: cleanSecret,
      })
      onBack()
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#1a1a2e] px-4 pt-[max(1.5rem,var(--app-safe-top))] pb-[max(2rem,var(--app-safe-bottom))]">
      {/* 头部 */}
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="text-gray-400 hover:text-white mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-white">添加令牌</h1>
      </div>

      {/* 模式切换 */}
      <div className="flex bg-[#16213e] rounded-xl p-1 mb-6">
        <button
          onClick={() => setMode('uri')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'uri' ? 'bg-blue-600 text-white' : 'text-gray-400'
          }`}
        >
          扫描二维码/URI
        </button>
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
            mode === 'manual' ? 'bg-blue-600 text-white' : 'text-gray-400'
          }`}
        >
          手动输入
        </button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-xl p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {mode === 'uri' ? (
        <div>
          <p className="text-gray-400 text-sm mb-4">
            粘贴 otpauth:// 或 Google Authenticator 迁移二维码内容，也可以直接扫描二维码
          </p>
          <button
            onClick={handleScan}
            disabled={submitting || isScanning}
            className="w-full mb-4 bg-[#16213e] border border-gray-700 hover:border-blue-500 disabled:border-gray-700 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
            {isScanning ? '扫描中...' : '扫描二维码'}
          </button>
          <textarea
            value={uri}
            onChange={(e) => setUri(e.target.value)}
            placeholder="otpauth://totp/Example:alice@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example"
            className="w-full bg-[#16213e] border border-gray-700 rounded-xl p-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none h-32"
          />
          <button
            onClick={handleURISubmit}
            disabled={submitting || !uri.trim()}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-xl transition-colors"
          >
            {submitting ? '添加中...' : '添加令牌'}
          </button>
        </div>
      ) : (
        <div>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-1">服务名称</label>
              <input
                type="text"
                value={issuer}
                onChange={(e) => setIssuer(e.target.value)}
                placeholder="例如：Google、GitHub"
                className="w-full bg-[#16213e] border border-gray-700 rounded-xl p-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">账户名</label>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="例如：user@gmail.com"
                className="w-full bg-[#16213e] border border-gray-700 rounded-xl p-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-sm mb-1">密钥（Base32）</label>
              <input
                type="text"
                value={secret}
                onChange={(e) => setSecret(e.target.value.toUpperCase())}
                placeholder="JBSWY3DPEHPK3PXP"
                className="w-full bg-[#16213e] border border-gray-700 rounded-xl p-3 text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <button
            onClick={handleManualSubmit}
            disabled={submitting}
            className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-xl transition-colors"
          >
            {submitting ? '添加中...' : '添加令牌'}
          </button>
        </div>
      )}
    </div>
  )
}
