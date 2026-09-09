import type { Token } from '../../core/types'
import type { DatabaseAdapter } from './adapter'

const DB_KEY = 'juezhao_auth_tokens'

export class LocalStorageAdapter implements DatabaseAdapter {
  async getAllTokens(): Promise<Token[]> {
    const data = localStorage.getItem(DB_KEY)
    if (!data) return []
    try {
      return JSON.parse(data) as Token[]
    } catch {
      return []
    }
  }

  async saveTokens(tokens: Token[]): Promise<void> {
    localStorage.setItem(DB_KEY, JSON.stringify(tokens))
  }

  async addToken(token: Token): Promise<void> {
    const tokens = await this.getAllTokens()
    tokens.push(token)
    await this.saveTokens(tokens)
  }

  async updateToken(id: string, updates: Partial<Token>): Promise<void> {
    const tokens = await this.getAllTokens()
    const index = tokens.findIndex((t) => t.id === id)
    if (index === -1) throw new Error('Token not found')
    tokens[index] = { ...tokens[index], ...updates, updatedAt: Date.now() }
    await this.saveTokens(tokens)
  }

  async deleteToken(id: string): Promise<void> {
    const tokens = await this.getAllTokens()
    const filtered = tokens.filter((t) => t.id !== id)
    await this.saveTokens(filtered)
  }
}
