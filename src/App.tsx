import { useEffect, useState } from 'react'
import { useAppStore } from './store/app-store'
import { BRAND } from './core/brand'
import { isUnlocked, lockApp } from './core/lock'
import { LockScreen } from './components/LockScreen'
import { TokenList } from './components/TokenList'
import { AddTokenPage } from './pages/AddTokenPage'
import { EditTokenPage } from './pages/EditTokenPage'
import { SettingsPage } from './pages/SettingsPage'
import { LockSettingsPage } from './pages/LockSettingsPage'

export default function App() {
  const {
    tokens,
    currentPage,
    searchQuery,
    editingToken,
    loadTokens,
    addToken,
    updateToken,
    deleteToken,
    setCurrentPage,
    setSearchQuery,
    setEditingToken,
  } = useAppStore()

  const [locked, setLocked] = useState(() => !isUnlocked())

  // Tokens can only be read once the session key exists, so the load is
  // gated on `locked` rather than running on first mount.
  useEffect(() => {
    if (locked) return
    loadTokens()
  }, [loadTokens, locked])

  // Re-lock as soon as the app leaves the foreground. `visibilitychange`
  // fires inside the Capacitor WebView, so no extra native plugin is needed.
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'hidden') return
      lockApp()
      setLocked(!isUnlocked())
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  if (locked) {
    return <LockScreen onUnlocked={() => setLocked(false)} />
  }

  if (currentPage === 'lock') {
    return (
      <LockSettingsPage
        onBack={() => setCurrentPage('settings')}
        onLockChanged={loadTokens}
      />
    )
  }

  if (currentPage === 'add') {
    return (
      <AddTokenPage
        onAdd={addToken}
        onBack={() => setCurrentPage('home')}
      />
    )
  }

  if (currentPage === 'edit' && editingToken) {
    return (
      <EditTokenPage
        token={editingToken}
        onUpdate={updateToken}
        onBack={() => {
          setEditingToken(null)
          setCurrentPage('home')
        }}
      />
    )
  }

  if (currentPage === 'settings') {
    return (
      <SettingsPage
        onBack={() => setCurrentPage('home')}
        onOpenLock={() => setCurrentPage('lock')}
      />
    )
  }

  return (
    <div className="min-h-screen bg-[#1a1a2e]">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-10 bg-[#1a1a2e]/95 backdrop-blur-sm px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            {BRAND.nameZh}
          </h1>
          <button
            onClick={() => setCurrentPage('settings')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* 搜索框 */}
        {tokens.length > 0 && (
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索服务或账户..."
              className="w-full bg-[#16213e] border border-gray-800 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-600"
            />
          </div>
        )}
      </div>

      {/* 令牌列表 */}
      <div className="pt-2">
        <TokenList
          tokens={tokens}
          searchQuery={searchQuery}
          onDelete={deleteToken}
          onEdit={(token) => {
            setEditingToken(token)
            setCurrentPage('edit')
          }}
        />
      </div>

      {/* 底部添加按钮 */}
      <div className="fixed bottom-6 left-0 right-0 flex justify-center">
        <button
          onClick={() => setCurrentPage('add')}
          className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full shadow-lg shadow-blue-900/50 flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  )
}
