import type { Token } from '../core/types'
import type { DatabaseAdapter } from './adapters/adapter'
import { SecureLocalStorageAdapter } from './adapters/secure-local-storage'
import { SQLiteAdapter, isSQLiteAvailable } from './adapters/sqlite'

export class Database {
  private adapter: DatabaseAdapter

  constructor() {
    this.adapter = isSQLiteAvailable() ? new SQLiteAdapter() : new SecureLocalStorageAdapter()
  }

  async getAllTokens(): Promise<Token[]> {
    return this.adapter.getAllTokens()
  }

  async saveTokens(tokens: Token[]): Promise<void> {
    await this.adapter.saveTokens(tokens)
  }

  async addToken(token: Token): Promise<void> {
    await this.adapter.addToken(token)
  }

  async updateToken(id: string, updates: Partial<Token>): Promise<void> {
    await this.adapter.updateToken(id, updates)
  }

  async deleteToken(id: string): Promise<void> {
    await this.adapter.deleteToken(id)
  }

  async exportData(): Promise<string> {
    const tokens = await this.getAllTokens()
    return JSON.stringify({
      version: 1,
      exportedAt: Date.now(),
      tokens,
    })
  }

  async importData(json: string): Promise<number> {
    const data = JSON.parse(json)
    if (!data.tokens || !Array.isArray(data.tokens)) {
      throw new Error('Invalid import data format')
    }
    await this.saveTokens(data.tokens)
    return data.tokens.length
  }
}

export const db = new Database()
