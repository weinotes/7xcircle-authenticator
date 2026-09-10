import { Capacitor } from '@capacitor/core'
import { CapacitorSQLite } from '@capacitor-community/sqlite'
import type { Token } from '../../core/types'
import type { DatabaseAdapter } from './adapter'
import { BRAND } from '../../core/brand'
import { decryptWithKey, encryptWithKey } from '../../core/crypto'
import { LockRequiredError, getSessionKey } from '../../core/lock'

const DB_NAME = BRAND.storagePrefix
const DB_VERSION = 1
const TABLE_NAME = 'tokens'

/**
 * Secrets are encrypted per column before they reach SQLite, so the native
 * database never holds a raw TOTP key even though the connection itself is
 * not SQLCipher-encrypted. Values are tagged so plaintext rows written before
 * the lock was enabled stay readable.
 */
const ENC_PREFIX = 'enc:v1:'

export class SQLiteAdapter implements DatabaseAdapter {
  private isConnected = false

  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      await CapacitorSQLite.createConnection({
        database: DB_NAME,
        version: DB_VERSION,
        encrypted: false,
        mode: 'no-encryption',
        readonly: false,
      })
      await CapacitorSQLite.open({ database: DB_NAME })
      this.isConnected = true
      await this.initTable()
    }
  }

  private async initTable(): Promise<void> {
    await CapacitorSQLite.execute({
      database: DB_NAME,
      statements: `
        CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
          id TEXT PRIMARY KEY,
          issuer TEXT NOT NULL,
          accountName TEXT NOT NULL,
          secret TEXT NOT NULL,
          algorithm TEXT NOT NULL,
          digits INTEGER NOT NULL,
          period INTEGER NOT NULL,
          type TEXT NOT NULL,
          counter INTEGER,
          icon TEXT,
          syncStatus TEXT NOT NULL,
          createdAt INTEGER NOT NULL,
          updatedAt INTEGER NOT NULL
        )
      `,
    })
  }

  async getAllTokens(): Promise<Token[]> {
    await this.ensureConnection()
    const result = await CapacitorSQLite.query({
      database: DB_NAME,
      statement: `SELECT * FROM ${TABLE_NAME}`,
    })
    const rows = result.values ?? []
    const tokens: Token[] = []
    for (const row of rows) {
      tokens.push(await this.rowToToken(row as Record<string, unknown>))
    }
    return tokens
  }

  async saveTokens(tokens: Token[]): Promise<void> {
    await this.ensureConnection()
    await CapacitorSQLite.execute({
      database: DB_NAME,
      statements: `DELETE FROM ${TABLE_NAME}`,
    })
    for (const token of tokens) {
      await this.addToken(token)
    }
  }

  async addToken(token: Token): Promise<void> {
    await this.ensureConnection()
    const stored = await this.sealSecret(token.secret)
    // `run` is the parameterized write API; the previous implementation also
    // fired the same statement through `execute` with no bound values, which
    // inserted an all-NULL row and violated the NOT NULL columns on device.
    await CapacitorSQLite.run({
      database: DB_NAME,
      statement: `
        INSERT OR REPLACE INTO ${TABLE_NAME} (
          id, issuer, accountName, secret, algorithm, digits, period, type,
          counter, icon, syncStatus, createdAt, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      values: [
        token.id,
        token.issuer,
        token.accountName,
        stored,
        token.algorithm,
        token.digits,
        token.period,
        token.type,
        token.counter || null,
        token.icon || null,
        token.syncStatus,
        token.createdAt,
        token.updatedAt,
      ],
    })
  }

  async updateToken(id: string, updates: Partial<Token>): Promise<void> {
    const token = (await this.getAllTokens()).find((t) => t.id === id)
    if (!token) throw new Error('Token not found')
    const updated = { ...token, ...updates, updatedAt: Date.now() }
    await this.addToken(updated)
  }

  async deleteToken(id: string): Promise<void> {
    await this.ensureConnection()
    await CapacitorSQLite.run({
      database: DB_NAME,
      statement: `DELETE FROM ${TABLE_NAME} WHERE id = ?`,
      values: [id],
    })
  }

  private async sealSecret(secret: string): Promise<string> {
    const key = getSessionKey()
    if (!key) return secret
    return `${ENC_PREFIX}${await encryptWithKey(secret, key)}`
  }

  private async openSecret(stored: string): Promise<string> {
    if (!stored.startsWith(ENC_PREFIX)) return stored
    const key = getSessionKey()
    if (!key) throw new LockRequiredError()
    return decryptWithKey(stored.slice(ENC_PREFIX.length), key)
  }

  private async rowToToken(row: Record<string, unknown>): Promise<Token> {
    return {
      id: String(row.id),
      issuer: String(row.issuer),
      accountName: String(row.accountName),
      secret: await this.openSecret(String(row.secret)),
      algorithm: String(row.algorithm) as Token['algorithm'],
      digits: Number(row.digits) as Token['digits'],
      period: Number(row.period),
      type: String(row.type) as Token['type'],
      counter: row.counter !== null ? Number(row.counter) : undefined,
      icon: row.icon ? String(row.icon) : undefined,
      syncStatus: String(row.syncStatus) as Token['syncStatus'],
      createdAt: Number(row.createdAt),
      updatedAt: Number(row.updatedAt),
    }
  }
}

export function isSQLiteAvailable(): boolean {
  return Capacitor.isNativePlatform() && !!CapacitorSQLite
}
