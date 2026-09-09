import { useEffect, useRef, useState } from 'react'
import { BRAND } from '../core/brand'
import { InvalidPinError, cooldownRemainingMs, unlockWithPin } from '../core/lock'

interface LockScreenProps {
  onUnlocked: () => void
}

/**
 * Unlock gate shown while the app lock is configured and the session key is
 * absent. Deriving the key costs 600k PBKDF2 rounds, so the button is disabled
 * while that runs.
 */
export function LockScreen({ onUnlocked }: LockScreenProps) {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(cooldownRemainingMs())
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
    if (cooldown <= 0) return
    const timer = setInterval(() => setCooldown(cooldownRemainingMs()), 1000)
    return () => clearInterval(timer)
  }, [cooldown])

  const submit = async () => {
    if (!pin || busy) return
    setBusy(true)
    setError('')
    try {
      await unlockWithPin(pin)
      setPin('')
      onUnlocked()
    } catch (err) {
      setError(err instanceof InvalidPinError ? 'PIN 不正确' : (err as Error).message)
      setPin('')
      setCooldown(cooldownRemainingMs())
    } finally {
      setBusy(false)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center bg-[#1a1a2e] px-8 pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mb-5">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>

      <h1 className="text-lg font-semibold text-white mb-1">{BRAND.nameZh}</h1>
      <p className="text-xs text-gray-500 mb-8">已启用应用锁，请输入 PIN 解锁</p>

      <input
        ref={inputRef}
        value={pin}
        onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit()
        }}
        inputMode="numeric"
        autoComplete="off"
        type="password"
        placeholder="输入 PIN"
        disabled={busy || cooldown > 0}
        className="w-full max-w-xs bg-[#16213e] border border-[#2a3b5c] rounded-xl px-4 py-3 text-center text-lg tracking-[0.4em] text-white placeholder:text-gray-600 placeholder:tracking-normal focus:outline-none focus:border-indigo-500 disabled:opacity-60"
      />

      {error && <div className="text-sm text-red-400 mt-4">{error}</div>}

      {cooldown > 0 && (
        <div className="text-sm text-amber-400 mt-4">
          尝试过多，请 {Math.ceil(cooldown / 1000)} 秒后再试
        </div>
      )}

      <button
        onClick={submit}
        disabled={!pin || busy || cooldown > 0}
        className="w-full max-w-xs mt-8 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-40"
      >
        {busy ? '解锁中…' : '解锁'}
      </button>

      <p className="text-[11px] text-gray-600 mt-10 text-center leading-relaxed">
        忘记 PIN 将无法解密已存储的密钥。
        <br />
        可通过此前的加密备份文件恢复。
      </p>
    </div>
  )
}
