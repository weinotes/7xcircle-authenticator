/**
 * localStorage adapter with real at-rest encryption.
 *
 * The previous version derived nothing and stored a random key in the *same*
 * localStorage as the ciphertext, so anything that could read the ciphertext
 * could also read the key. Encryption now depends on the app-lock PIN
 * (`core/lock.ts`): the key exists only in memory for an unlocked session.
 */

import type { Token } from '../../core/types'
import type { DatabaseAdapter } from './adapter'
import { storageKey } from '../../core/brand'
import { decryptWithKey, encryptWithKey } from '../../core/crypto'
import { LockRequiredError, getSessionKey, isLockConfigured } from '../../core/lock'

const DB_KEY = storageKey('tokens')

interface Envelope {
  v: 2
  encrypted: boolean
  data: string
}

function readEnvelope(raw: string): Envelope | null {
  try {
    const parsed = JSON.parse(raw) as Envelope | Token[]
    // v2 envelope
    if (parsed && !Array.isArray(parsed) && typeof (parsed as Envelope).data === 'string') {
      return parsed as Envelope
    }
    // v1 plaintext array, kept readable so nobody is locked out by the upgrade
    if (Array.isArray(parsed)) {
      return { v: 2, encrypted: false, data: JSON.stringify(parsed) }
    }
    return null
  } catch {
    return null
  }
}

export class SecureLocalStorageAdapter implements DatabaseAdapter {
  async getAllTokens(): Promise<Token[]> {
    const raw = localStorage.getItem(DB_KEY)
    if (!raw) return []

    const envelope = readEnvelope(raw)
    if (!envelope) return []
    if (!envelope.encrypted) return JSON.parse(envelope.data) as Token[]

    const key = getSessionKey()
    if (!key) throw new LockRequiredError()
    const json = await decryptWithKey(envelope.data, key)
    return JSON.parse(json) as Token[]
  }

  async saveTokens(tokens: Token[]): Promise<void> {
    const existing = localStorage.getItem(DB_KEY)
    const key = getSessionKey()

    // Guard against an accidental downgrade: protected data may only be
    // rewritten as plaintext when the lock has genuinely been removed, not
    // when the session is merely locked.
    if (existing && key === null && isLockConfigured()) {
      const envelope = readEnvelope(existing)
      if (envelope?.encrypted) throw new LockRequiredError()
    }

    const json = JSON.stringify(tokens)
    if (!key) {
      localStorage.setItem(DB_KEY, JSON.stringify({ v: 2, encrypted: false, data: json } satisfies Envelope))
      return
    }
    const data = await encryptWithKey(json, key)
    localStorage.setItem(DB_KEY, JSON.stringify({ v: 2, encrypted: true, data } satisfies Envelope))
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
