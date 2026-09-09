import { useState, useEffect } from 'react'
import type { Token, TokenInput } from '../core/types'
import { isValidSecret } from '../core/totp'

interface EditTokenPageProps {
  token: Token
  onUpdate: (id: string, input: TokenInput) => Promise<void>
  onBack: () => void
}

const ALGORITHMS: TokenInput['algorithm'][] = ['SHA1', 'SHA256', 'SHA512']
const DIGITS_OPTIONS: TokenInput['digits'][] = [6, 7, 8]

export function EditTokenPage({ token, onUpdate, onBack }: EditTokenPageProps) {
  const [issuer, setIssuer] = useState(token.issuer)
  const [account, setAccount] = useState(token.accountName)
  const [secret, setSecret] = useState(token.secret)
  const [algorithm, setAlgorithm] = useState<TokenInput['algorithm']>(token.algorithm)
  const [digits, setDigits] = useState<TokenInput['digits']>(token.digits)
  const [period, setPeriod] = useState(token.period.toString())
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setIssuer(token.issuer)
    setAccount(token.accountName)
    setSecret(token.secret)
    setAlgorithm(token.algorithm)
    setDigits(token.digits)
    setPeriod(token.period.toString())
  }, [token])

  const handleSubmit = async () => {
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
      const periodNum = parseInt(period, 10)
      if (isNaN(periodNum) || periodNum < 10) {
        setError('周期必须大于等于 10 秒')
        return
      }
      setSubmitting(true)
      await onUpdate(token.id, {
        issuer: issuer.trim(),
        accountName: account.trim(),
        secret: cleanSecret,
        algorithm,
        digits,
        period: periodNum,
        type: token.type,
        counter: token.counter,
      })
      onBack()
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] px-4 pt-6 pb-8">
      <div className="flex items-center mb-6">
        <button onClick={onBack} className="text-gray-400 hover:text-white mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-white">编辑令牌</h1>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 text-red-400 rounded-xl p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-gray-400 text-sm mb-1">服务名称</label>
          <input
            type="text"
            value={issuer}
            onChange={(e) => setIssuer(e.target.value)}
            className="w-full bg-[#16213e] border border-gray-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-1">账户名</label>
          <input
            type="text"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className="w-full bg-[#16213e] border border-gray-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-1">密钥（Base32）</label>
          <input
            type="text"
            value={secret}
            onChange={(e) => setSecret(e.target.value.toUpperCase())}
            className="w-full bg-[#16213e] border border-gray-700 rounded-xl p-3 text-white text-sm font-mono focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-1">算法</label>
          <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as TokenInput['algorithm'])}
            className="w-full bg-[#16213e] border border-gray-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {ALGORITHMS.map((algo) => (
              <option key={algo} value={algo}>{algo}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-1">验证码位数</label>
          <select
            value={digits}
            onChange={(e) => setDigits(Number(e.target.value) as TokenInput['digits'])}
            className="w-full bg-[#16213e] border border-gray-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-blue-500"
          >
            {DIGITS_OPTIONS.map((d) => (
              <option key={d} value={d}>{d} 位</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-gray-400 text-sm mb-1">周期（秒）</label>
          <input
            type="number"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            min="10"
            className="w-full bg-[#16213e] border border-gray-700 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium py-3 rounded-xl transition-colors"
      >
        {submitting ? '更新中...' : '保存更改'}
      </button>
    </div>
  )
}
