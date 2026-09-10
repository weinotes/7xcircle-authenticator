import { useEffect, useRef, useState } from 'react'
import { useTOTP } from '../hooks/useTOTP'
import type { Token } from '../core/types'

interface TokenCardProps {
  token: Token
  onDelete: (id: string) => void
  onEdit: (token: Token) => void
}

async function writeClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  // Capacitor WebView 上 navigator.clipboard 可能不可用，退回到旧接口。
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const ok = document.execCommand('copy')
  document.body.removeChild(textarea)
  if (!ok) throw new Error('copy failed')
}

export function TokenCard({ token, onDelete, onEdit }: TokenCardProps) {
  const { otp, remaining, expiring } = useTOTP(token)
  const progress = (remaining / token.period) * 100
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const feedbackTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (feedbackTimer.current !== undefined) window.clearTimeout(feedbackTimer.current)
    }
  }, [])

  const showCopyFeedback = (state: 'copied' | 'failed') => {
    setCopyState(state)
    if (feedbackTimer.current !== undefined) window.clearTimeout(feedbackTimer.current)
    feedbackTimer.current = window.setTimeout(() => setCopyState('idle'), 1500)
  }

  const handleCopy = async () => {
    try {
      await writeClipboard(otp)
      showCopyFeedback('copied')
    } catch {
      showCopyFeedback('failed')
    }
  }

  // 将 OTP 分成两组，方便阅读
  const formattedOTP = otp.length === 6
    ? `${otp.slice(0, 3)} ${otp.slice(3)}`
    : otp.length === 7
      ? `${otp.slice(0, 3)} ${otp.slice(3, 5)} ${otp.slice(5)}`
      : `${otp.slice(0, 4)} ${otp.slice(4)}`

  return (
    <div className="bg-[#16213e] rounded-2xl p-4 mb-3 relative overflow-hidden">
      {/* 进度条背景 */}
      <div
        className="absolute bottom-0 left-0 h-1 transition-all duration-1000 ease-linear"
        style={{
          width: `${progress}%`,
          backgroundColor: expiring ? '#ef4444' : '#3b82f6',
        }}
      />

      {/* 头部：服务名 + 操作 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-xs font-bold">
            {token.issuer.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-200">{token.issuer}</div>
            <div className="text-xs text-gray-500 truncate max-w-[200px]">{token.accountName}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(token)}
            className="text-gray-600 hover:text-blue-400 transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(token.id)}
            className="text-gray-600 hover:text-red-400 transition-colors p-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* OTP 验证码 */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleCopy}
          className="flex items-center gap-2 group"
          aria-label="复制验证码"
        >
          <span
            className={`text-3xl font-mono font-bold tracking-wider transition-colors ${
              expiring ? 'text-red-400' : 'text-white'
            } group-active:text-blue-400`}
          >
            {formattedOTP}
          </span>
        </button>
        <div className="text-right">
          {copyState === 'copied' ? (
            <span className="text-xs font-medium text-green-400">已复制</span>
          ) : copyState === 'failed' ? (
            <span className="text-xs font-medium text-amber-400">复制失败</span>
          ) : (
            <span
              className={`text-xs font-mono ${
                expiring ? 'text-red-400' : 'text-gray-500'
              }`}
            >
              {remaining}s
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
