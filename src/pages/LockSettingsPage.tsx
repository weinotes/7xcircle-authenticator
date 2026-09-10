/**
 * 7X Circle Authenticator — enable, change or disable the PIN app lock
 *
 * @author Davey Wong <wgwcko@gmail.com>
 * @copyright 2026 Davey Wong <wgwcko@gmail.com> / 7X Circle
 * @license SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. See LICENSE.
 */
import { useState } from 'react'
import { db } from '../db/database'
import {
  MIN_PIN_LENGTH,
  changePin,
  disableLock,
  enableLock,
  isLockConfigured,
  requireValidPin,
} from '../core/lock'

interface LockSettingsPageProps {
  onBack: () => void
  /** Notifies App.tsx so it can re-render the gate / reload the token list. */
  onLockChanged: () => void
}

const HINT = `PIN 为 ${MIN_PIN_LENGTH}-32 位数字，不能是连续或重复数字。忘记 PIN 将无法解密本机密钥。`

export function LockSettingsPage({ onBack, onLockChanged }: LockSettingsPageProps) {
  const [configured] = useState(isLockConfigured())
  const [current, setCurrent] = useState('')
  const [disableCurrent, setDisableCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const reset = () => {
    setCurrent('')
    setDisableCurrent('')
    setNext('')
    setConfirm('')
  }

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setError('')
    try {
      await action()
      reset()
      onLockChanged()
      onBack()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const handleEnable = () => {
    if (next !== confirm) {
      setError('两次输入的 PIN 不一致')
      return
    }
    void run(async () => {
      requireValidPin(next)
      await enableLock(next)
      // Re-wrap existing rows so nothing stays in plaintext after enabling.
      await db.rewriteAll()
    })
  }

  const handleChange = () => {
    if (next !== confirm) {
      setError('两次输入的 PIN 不一致')
      return
    }
    void run(async () => {
      requireValidPin(next)
      await changePin(current, next)
      await db.rewriteAll()
    })
  }

  const handleDisable = () => {
    void run(async () => {
      // Read while still unlocked, then drop the key, then persist plaintext.
      // Calling rewriteAll() after disableLock() would throw LockRequiredError.
      const tokens = await db.getAllTokens()
      await disableLock(disableCurrent)
      await db.saveTokens(tokens)
    })
  }

  const field = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    placeholder: string,
  ) => (
    <label className="block mb-3">
      <span className="text-xs text-gray-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, ''))}
        type="password"
        inputMode="numeric"
        autoComplete="off"
        placeholder={placeholder}
        className="w-full mt-1 bg-[#16213e] border border-[#2a3b5c] rounded-xl px-4 py-3 text-center text-base tracking-[0.3em] text-white placeholder:text-gray-600 placeholder:tracking-normal focus:outline-none focus:border-indigo-500"
      />
    </label>
  )

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#1a1a2e] px-4 pt-[max(1.5rem,var(--app-safe-top))] pb-[max(2rem,var(--app-safe-bottom))]">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="text-gray-400 hover:text-white mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-white">应用锁</h1>
      </div>

      <div className="bg-[#16213e] rounded-xl p-4 mb-5">
        <div className="text-sm text-white mb-1">
          当前状态：{configured ? '已开启' : '未开启'}
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          {HINT}
        </p>
        <p className="text-xs text-gray-500 leading-relaxed mt-2">
          开启后密钥以 PIN 派生的 AES-256-GCM 密钥加密保存，切到后台会自动重新上锁。
        </p>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-xl p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      {configured ? (
        <div className="space-y-3">
          <div className="bg-[#16213e] rounded-xl p-4">
            <div className="text-sm font-medium text-white mb-3">修改 PIN</div>
            {field('当前 PIN', current, setCurrent, '••••••')}
            {field('新 PIN', next, setNext, '••••••')}
            {field('确认新 PIN', confirm, setConfirm, '••••••')}
            <button
              onClick={handleChange}
              disabled={busy || !current || !next || !confirm}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-3 rounded-xl disabled:opacity-40"
            >
              {busy ? '处理中…' : '修改 PIN'}
            </button>
          </div>

          <div className="bg-[#16213e] rounded-xl p-4">
            <div className="text-sm font-medium text-white mb-1">关闭应用锁</div>
            <p className="text-xs text-gray-500 mb-3">关闭后密钥将以明文存储在本机。</p>
            {field('当前 PIN', disableCurrent, setDisableCurrent, '••••••')}
            <button
              onClick={handleDisable}
              disabled={busy || !disableCurrent}
              className="w-full bg-[#1a2744] border border-[#2a3b5c] text-gray-300 font-semibold py-3 rounded-xl disabled:opacity-40"
            >
              关闭应用锁
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-[#16213e] rounded-xl p-4">
          <div className="text-sm font-medium text-white mb-3">开启应用锁</div>
          {field('设置 PIN', next, setNext, '••••••')}
          {field('确认 PIN', confirm, setConfirm, '••••••')}
          <button
            onClick={handleEnable}
            disabled={busy || !next || !confirm}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-3 rounded-xl disabled:opacity-40"
          >
            {busy ? '处理中…' : '开启应用锁'}
          </button>
        </div>
      )}
    </div>
  )
}
