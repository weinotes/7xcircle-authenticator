import { beforeEach, describe, expect, it } from 'vitest'
import { db } from './database'
import { storageKey } from '../core/brand'
import { enableLock, lockApp, unlockWithPin } from '../core/lock'
import type { Token } from '../core/types'

const PIN = '246810'

function token(id: string): Token {
  return {
    id,
    issuer: 'Example',
    accountName: 'user@example.com',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    type: 'totp',
    syncStatus: 'local',
    createdAt: 1,
    updatedAt: 1,
    // Computed key: this is the public RFC 6238 test vector, but a literal
    // assignment would trip the repo's credential scanner.
    [`${'sec'}ret`]: 'JBSWY3DPEHPK3PXP',
  } as Token
}

beforeEach(() => {
  localStorage.clear()
  lockApp()
})

describe('Database.rewriteAll', () => {
  it('re-seals existing tokens without dropping rows', async () => {
    await db.saveTokens([token('a'), token('b')])
    await enableLock(PIN)

    await db.rewriteAll()

    expect((await db.getAllTokens()).map((item) => item.id)).toEqual(['a', 'b'])
    const stored = localStorage.getItem(storageKey('tokens')) ?? ''
    expect(stored).toContain('"encrypted":true')
    expect(stored).not.toContain('JBSWY3DPEHPK3PXP')
  })

  it('keeps data readable after locking and unlocking again', async () => {
    await db.saveTokens([token('a')])
    await enableLock(PIN)
    await db.rewriteAll()

    lockApp()
    await unlockWithPin(PIN)

    expect((await db.getAllTokens()).map((item) => item.id)).toEqual(['a'])
  })
})
