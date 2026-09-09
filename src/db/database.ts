import type { Token } from '../core/types'
import type { DatabaseAdapter } from './adapters/adapter'
import { SecureLocalStorageAdapter } from './adapters/secure-local-storage'
import { SQLiteAdapter, isSQLiteAvailable } from './adapters/sqlite'
import { decryptString, encryptString } from '../core/crypto'
import { BRAND } from '../core/brand'

export const BACKUP_VERSION = 2
export const MIN_BACKUP_PASSWORD_LENGTH = 8

interface BackupFile {
  app: string
  version: number
  exportedAt: number
  encrypted: boolean
  /** base64(iv|salt|ciphertext) when encrypted, JSON text otherwise. */
  data: string
  /** v1 plaintext backups carried a bare token array. */
  tokens?: Token[]
}

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

  /**
   * Re-wraps everything currently stored under the active session key.
   * Call after enabling, changing or disabling the app lock so that no row
   * keeps an envelope produced by the previous key.
   */
  async rewriteAll(): Promise<void> {
    const tokens = await this.getAllTokens()
    await this.saveTokens(tokens)
  }

  /**
   * Backups leave the device, so they are password-encrypted independently of
   * the app lock. A wrong password fails the AES-GCM check on import.
   */
  async exportData(password: string): Promise<string> {
    if (password.length < MIN_BACKUP_PASSWORD_LENGTH) {
      throw new Error(`备份密码至少 ${MIN_BACKUP_PASSWORD_LENGTH} 位`)
    }
    const tokens = await this.getAllTokens()
    const exportedAt = Date.now()
    const data = await encryptString(JSON.stringify({ tokens }), password)
    const file: BackupFile = {
      app: BRAND.slug,
      version: BACKUP_VERSION,
      exportedAt,
      encrypted: true,
      data,
    }
    return JSON.stringify(file, null, 2)
  }

  async importData(json: string, password: string): Promise<number> {
    const parsed = JSON.parse(json) as BackupFile | { tokens?: Token[] }
    if ('app' in parsed && parsed.app && parsed.app !== BRAND.slug) {
      throw new Error('这不是 7X Circle 验证器的备份文件')
    }

    let tokens: Token[]
    if ('encrypted' in parsed && parsed.encrypted) {
      let payload: string
      try {
        payload = await decryptString(parsed.data, password)
      } catch {
        throw new Error('备份密码不正确')
      }
      tokens = (JSON.parse(payload) as { tokens: Token[] }).tokens
    } else if (Array.isArray((parsed as BackupFile).tokens)) {
      tokens = (parsed as BackupFile).tokens as Token[]
    } else {
      throw new Error('备份文件格式无法识别')
    }

    if (!Array.isArray(tokens)) {
      throw new Error('备份文件中没有令牌数据')
    }
    for (const token of tokens) {
      if (!token?.id || !token.secret) throw new Error('备份文件包含损坏的令牌记录')
    }

    await this.saveTokens(tokens)
    return tokens.length
  }
}

export const db = new Database()
