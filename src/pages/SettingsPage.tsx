import { useState } from 'react'
import { db } from '../db/database'

interface SettingsPageProps {
  onBack: () => void
}

export function SettingsPage({ onBack }: SettingsPageProps) {
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [message, setMessage] = useState('')

  const handleExport = async () => {
    try {
      setExporting(true)
      const data = await db.exportData()
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `juezhao-auth-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMessage('导出成功')
    } catch {
      setMessage('导出失败')
    } finally {
      setExporting(false)
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const handleImport = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      try {
        setImporting(true)
        const text = await file.text()
        const count = await db.importData(text)
        setMessage(`导入成功，共 ${count} 条令牌`)
        setTimeout(() => window.location.reload(), 1500)
      } catch {
        setMessage('导入失败，文件格式无效')
      } finally {
        setImporting(false)
        setTimeout(() => setMessage(''), 3000)
      }
    }
    input.click()
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e] px-4 pt-6 pb-8">
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
        {/* 数据导出 */}
        <button
          onClick={handleExport}
          disabled={exporting}
          className="w-full bg-[#16213e] rounded-xl p-4 flex items-center justify-between hover:bg-[#1a2744] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-900/50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-white">导出数据</div>
              <div className="text-xs text-gray-500">备份所有令牌到 JSON 文件</div>
            </div>
          </div>
          <span className="text-gray-600">{exporting ? '...' : '>'}</span>
        </button>

        {/* 数据导入 */}
        <button
          onClick={handleImport}
          disabled={importing}
          className="w-full bg-[#16213e] rounded-xl p-4 flex items-center justify-between hover:bg-[#1a2744] transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange-900/50 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-white">导入数据</div>
              <div className="text-xs text-gray-500">从备份文件恢复令牌</div>
            </div>
          </div>
          <span className="text-gray-600">{importing ? '...' : '>'}</span>
        </button>

        {/* 关于 */}
        <div className="bg-[#16213e] rounded-xl p-4 mt-6">
          <div className="text-center">
            <div className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              觉照验证器
            </div>
            <div className="text-xs text-gray-500 mt-1">v1.0.0</div>
            <div className="text-xs text-gray-600 mt-3">
              离线 TOTP 双因素验证器
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
