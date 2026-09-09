import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type { Token, TokenInput, Page } from '../core/types'
import { db } from '../db/database'

interface AppState {
  tokens: Token[]
  currentPage: Page
  searchQuery: string
  isLoading: boolean
  error: string | null
  editingToken: Token | null

  // Actions
  loadTokens: () => Promise<void>
  addToken: (input: TokenInput) => Promise<void>
  updateToken: (id: string, input: TokenInput) => Promise<void>
  deleteToken: (id: string) => Promise<void>
  setCurrentPage: (page: Page) => void
  setSearchQuery: (query: string) => void
  setEditingToken: (token: Token | null) => void
  clearError: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  tokens: [],
  currentPage: 'home',
  searchQuery: '',
  isLoading: false,
  error: null,
  editingToken: null,

  loadTokens: async () => {
    set({ isLoading: true })
    try {
      const tokens = await db.getAllTokens()
      // 按 issuer 排序
      tokens.sort((a, b) => a.issuer.localeCompare(b.issuer))
      set({ tokens, isLoading: false })
    } catch {
      set({ error: '加载令牌失败', isLoading: false })
    }
  },

  addToken: async (input: TokenInput) => {
    const { tokens } = get()
    const now = Date.now()
    const newToken: Token = {
      id: uuidv4(),
      issuer: input.issuer,
      accountName: input.accountName,
      secret: input.secret,
      algorithm: input.algorithm || 'SHA1',
      digits: input.digits || 6,
      period: input.period || 30,
      type: input.type || 'totp',
      counter: input.counter,
      syncStatus: 'local',
      createdAt: now,
      updatedAt: now,
    }

    await db.addToken(newToken)
    const updated = [...tokens, newToken].sort((a, b) =>
      a.issuer.localeCompare(b.issuer)
    )
    set({ tokens: updated })
  },

  updateToken: async (id: string, input: TokenInput) => {
    const { tokens } = get()
    const index = tokens.findIndex((t) => t.id === id)
    if (index === -1) throw new Error('Token not found')
    const updated = {
      ...tokens[index],
      issuer: input.issuer,
      accountName: input.accountName,
      secret: input.secret,
      algorithm: input.algorithm || tokens[index].algorithm,
      digits: input.digits || tokens[index].digits,
      period: input.period || tokens[index].period,
      type: input.type || tokens[index].type,
      counter: input.counter,
      updatedAt: Date.now(),
    }
    await db.updateToken(id, updated)
    const newTokens = [...tokens]
    newTokens[index] = updated
    newTokens.sort((a, b) => a.issuer.localeCompare(b.issuer))
    set({ tokens: newTokens })
  },

  deleteToken: async (id: string) => {
    const { tokens } = get()
    await db.deleteToken(id)
    set({ tokens: tokens.filter((t) => t.id !== id) })
  },

  setCurrentPage: (page: Page) => set({ currentPage: page }),
  setSearchQuery: (query: string) => set({ searchQuery: query }),
  setEditingToken: (token: Token | null) => set({ editingToken: token }),
  clearError: () => set({ error: null }),
}))
