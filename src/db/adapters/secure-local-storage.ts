import type { Token } from '../../core/types'
import type { DatabaseAdapter } from './adapter'
import { encryptData, decryptData } from '../../core/crypto'

const DB_KEY = 'juezhao_auth_tokens_encrypted'
const KEY_KEY = 'juezhao_auth_key'

async function getEncryptionKey(): Promise<string> {
  let key = localStorage.getItem(KEY_KEY)
  if (!key) {
    const array = new Uint32Array(8)
    crypto.getRandomValues(array)
    key = Array.from(array).map((n) => n.toString(36)).join('')
    localStorage.setItem(KEY_KEY, key)
  }
  return key
}

export class SecureLocalStorageAdapter implements DatabaseAdapter {
  async getAllTokens(): Promise<Token[]> {
    try {
      const encrypted = localStorage.getItem(DB_KEY)
      if (!encrypted) return []

      const key = await getEncryptionKey()
      const data = await decryptData<Token[]>(encrypted, key)
      return data
    } catch {
      return []
    }
  }

  async saveTokens(tokens: Token[]): Promise<void> {
    const key = await getEncryptionKey()
    const encrypted = await encryptData(tokens, key)
    localStorage.setItem(DB_KEY, encrypted)
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
