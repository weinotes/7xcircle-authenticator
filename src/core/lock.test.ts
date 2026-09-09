import { beforeEach, describe, expect, it } from 'vitest'
import {
  InvalidPinError,
  changePin,
  cooldownRemainingMs,
  disableLock,
  enableLock,
  isLockConfigured,
  isUnlocked,
  lockApp,
  requireValidPin,
  unlockWithPin,
  validatePin,
} from './lock'
import { SecureLocalStorageAdapter } from '../db/adapters/secure-local-storage'
import { storageKey } from './brand'
import type { Token } from './types'

// Each derivation costs the real 600k PBKDF2 rounds, so the suite below
// deliberately keeps the number of unlock paths small.
const PIN = '246810'
const OTHER_PIN = '135790'

function token(id: string): Token {
  return {
    id,
    issuer: 'Example',
    accountName: 'user@example.com',
    secret: 'JBSWY3DPEHPK3PXP',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    type: 'totp',
    syncStatus: 'local',
    createdAt: 1,
    updatedAt: 1,
  }
}

beforeEach(() => {
  localStorage.clear()
  lockApp()
})

describe('validatePin', () => {
  it('rejects short, non-numeric, repeated and sequential PINs', () => {
    expect(validatePin('1234')).toMatch('至少')
    expect(validatePin('12ab12')).toMatch('数字')
    expect(validatePin('111111')).toMatch('重复')
    expect(validatePin('0123456789')).toMatch('连续')
    expect(validatePin('9876543210')).toMatch('连续')
  })

  it('accepts a non-trivial numeric PIN', () => {
    expect(validatePin(PIN)).toBeNull()
  })

  // Regression: the settings page once wrote `validatePin(pin) || 'invalid'`,
  // which turned the valid `null` result into an error and blocked every
  // attempt to enable the lock.
  it('requireValidPin stays silent for a valid PIN and throws for a weak one', () => {
    expect(() => requireValidPin(PIN)).not.toThrow()
    expect(() => requireValidPin('1234')).toThrow('至少')
    expect(() => requireValidPin('111111')).toThrow('重复')
  })
})

describe('app lock lifecycle', () => {
  it('starts unconfigured and unlocked', () => {
    expect(isLockConfigured()).toBe(false)
    expect(isUnlocked()).toBe(true)
  })

  it('persists only salt and probe, never the key or the PIN', async () => {
    await enableLock(PIN)
    const blob = JSON.stringify(localStorage)
    expect(blob).not.toContain(PIN)
    expect(localStorage.getItem(storageKey('lock_salt'))).toBeTruthy()
    expect(localStorage.getItem(storageKey('lock_probe'))).toBeTruthy()
  })

  it('locks the session again after lockApp()', async () => {
    await enableLock(PIN)
    expect(isUnlocked()).toBe(true)
    lockApp()
    expect(isUnlocked()).toBe(false)
    await unlockWithPin(PIN)
    expect(isUnlocked()).toBe(true)
  })

  it('rejects a wrong PIN without unlocking', async () => {
    await enableLock(PIN)
    lockApp()
    await expect(unlockWithPin(OTHER_PIN)).rejects.toBeInstanceOf(InvalidPinError)
    expect(isUnlocked()).toBe(false)
  })

  it('applies a cooldown after repeated failures', async () => {
    await enableLock(PIN)
    lockApp()
    for (let i = 0; i < 5; i++) {
      await unlockWithPin(OTHER_PIN).catch(() => undefined)
    }
    expect(cooldownRemainingMs()).toBe(0)
    await unlockWithPin(OTHER_PIN).catch(() => undefined)
    expect(cooldownRemainingMs()).toBeGreaterThan(0)
  })

  it('re-derives a working key after the PIN changes', async () => {
    await enableLock(PIN)
    await changePin(PIN, OTHER_PIN)
    lockApp()
    await expect(unlockWithPin(PIN)).rejects.toBeInstanceOf(InvalidPinError)
    await unlockWithPin(OTHER_PIN)
    expect(isUnlocked()).toBe(true)
  })

  it('refuses to enable twice', async () => {
    await enableLock(PIN)
    await expect(enableLock(OTHER_PIN)).rejects.toThrow('already enabled')
  })
})

describe('SecureLocalStorageAdapter', () => {
  it('round-trips tokens in plaintext when no lock is configured', async () => {
    const db = new SecureLocalStorageAdapter()
    await db.saveTokens([token('a')])
    expect(await db.getAllTokens()).toEqual([token('a')])
    // The stored payload must not contain the raw secret when encrypted; with
    // no lock it is an explicit plaintext envelope.
    expect(localStorage.getItem(storageKey('tokens'))).toContain('"encrypted":false')
  })

  it('never writes the secret in clear text once the lock is on', async () => {
    const db = new SecureLocalStorageAdapter()
    await db.saveTokens([token('a')])
    await enableLock(PIN)
    // Re-wrap the existing plaintext rows, exactly as LockSettingsPage does.
    await db.saveTokens(await db.getAllTokens())

    const stored = localStorage.getItem(storageKey('tokens')) ?? ''
    expect(stored).toContain('"encrypted":true')
    expect(stored).not.toContain('JBSWY3DPEHPK3PXP')
  })

  it('refuses to read protected data while locked', async () => {
    const db = new SecureLocalStorageAdapter()
    await enableLock(PIN)
    await db.saveTokens([token('a')])
    lockApp()
    await expect(db.getAllTokens()).rejects.toThrow('Unlock')
  })

  it('refuses to silently downgrade protected data while locked', async () => {
    const db = new SecureLocalStorageAdapter()
    await enableLock(PIN)
    await db.saveTokens([token('a')])
    lockApp()
    await expect(db.saveTokens([token('b')])).rejects.toThrow('Unlock')
  })

  it('keeps data readable across a lock/unlock cycle', async () => {
    const db = new SecureLocalStorageAdapter()
    await enableLock(PIN)
    await db.saveTokens([token('a'), token('b')])
    lockApp()
    await unlockWithPin(PIN)
    expect((await db.getAllTokens()).map((t) => t.id)).toEqual(['a', 'b'])
  })

  it('reads legacy v1 plaintext arrays so the upgrade cannot lock anyone out', async () => {
    localStorage.setItem(storageKey('tokens'), JSON.stringify([token('a')]))
    const db = new SecureLocalStorageAdapter()
    expect(await db.getAllTokens()).toEqual([token('a')])
  })

  it('drops back to plaintext when the lock is disabled', async () => {
    const db = new SecureLocalStorageAdapter()
    await enableLock(PIN)
    await db.saveTokens([token('a')])
    const tokens = await db.getAllTokens()
    await disableLock(PIN)
    await db.saveTokens(tokens)
    expect(isLockConfigured()).toBe(false)
    expect(localStorage.getItem(storageKey('tokens'))).toContain('"encrypted":false')
  })
})
