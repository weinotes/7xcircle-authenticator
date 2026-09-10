/**
 * 7X Circle Authenticator — app-lock state machine: PIN policy, unlock, cooldown
 *
 * @author Davey Wong <wgwcko@gmail.com>
 * @copyright 2026 Davey Wong <wgwcko@gmail.com> / 7X Circle
 * @license SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. See LICENSE.
 */
/**
 * App lock: PIN-derived key held only in this module's memory.
 *
 * Threat model, stated honestly:
 * - Protects a stolen/unattended device: nothing decrypts without the PIN, and
 *   the derived key is non-extractable and never persisted.
 * - Does NOT stop an attacker who has the storage file and can brute force a
 *   weak PIN offline. PBKDF2-SHA256 with PIN_ITERATIONS makes each guess
 *   expensive, which is why `MIN_PIN_LENGTH` is 6 rather than 4.
 */

import { storageKey } from './brand'
import {
  PIN_ITERATIONS,
  deriveKeyFromPin,
  encryptWithKey,
  decryptWithKey,
  randomBytesBase64,
} from './crypto'

const SALT_KEY = storageKey('lock_salt')
const PROBE_KEY = storageKey('lock_probe')
const ATTEMPTS_KEY = storageKey('lock_attempts')

/** Stored in plaintext under a known value; a wrong PIN fails to decrypt it. */
const PROBE_VALUE = '7xcircle-auth-lock-probe'

export const MIN_PIN_LENGTH = 6
export const MAX_PIN_LENGTH = 32
const MAX_FREE_ATTEMPTS = 5
const COOLDOWN_MS = 30000

/** The derived key for this session only. Never written to any storage. */
let sessionKey: CryptoKey | null = null

export class InvalidPinError extends Error {
  constructor() {
    super('Invalid PIN')
    this.name = 'InvalidPinError'
  }
}

/** Thrown when encrypted data is touched while the session key is absent. */
export class LockRequiredError extends Error {
  constructor() {
    super('Unlock the app before reading or writing protected data')
    this.name = 'LockRequiredError'
  }
}

export function validatePin(pin: string): string | null {
  if (!/^\d+$/.test(pin)) return 'PIN 只能包含数字'
  if (pin.length < MIN_PIN_LENGTH) return `PIN 至少 ${MIN_PIN_LENGTH} 位`
  if (pin.length > MAX_PIN_LENGTH) return `PIN 最多 ${MAX_PIN_LENGTH} 位`
  if (/^(\d)\1+$/.test(pin)) return 'PIN 不能是重复的单一数字'
  const sequential = '0123456789'
  const reversed = '9876543210'
  if (sequential.includes(pin) || reversed.includes(pin)) return 'PIN 不能是连续数字'
  return null
}

/**
 * Throwing variant for callers that just want to gate an action. Exists so call
 * sites cannot invert the `null` return of `validatePin` — a valid PIN once read
 * as invalid because a page wrote `validatePin(pin) || 'invalid'`.
 */
export function requireValidPin(pin: string): void {
  const invalid = validatePin(pin)
  if (invalid) throw new Error(invalid)
}

export function isLockConfigured(): boolean {
  return !!localStorage.getItem(SALT_KEY) && !!localStorage.getItem(PROBE_KEY)
}

export function isUnlocked(): boolean {
  return !isLockConfigured() || sessionKey !== null
}

export function getSessionKey(): CryptoKey | null {
  return sessionKey
}

/** Milliseconds left on the cooldown, or 0 when attempts are allowed. */
export function cooldownRemainingMs(now: number = Date.now()): number {
  const raw = localStorage.getItem(ATTEMPTS_KEY)
  if (!raw) return 0
  try {
    const state = JSON.parse(raw) as { count: number; until: number }
    return Math.max(0, state.until - now)
  } catch {
    return 0
  }
}

/** Free attempts left before the next unlock failure starts a cooldown. */
export function remainingAttempts(): number {
  const raw = localStorage.getItem(ATTEMPTS_KEY)
  if (!raw) return MAX_FREE_ATTEMPTS
  try {
    const count = (JSON.parse(raw) as { count?: number }).count ?? 0
    return Math.max(0, MAX_FREE_ATTEMPTS - count)
  } catch {
    return MAX_FREE_ATTEMPTS
  }
}

function registerFailure(now: number = Date.now()): void {
  const raw = localStorage.getItem(ATTEMPTS_KEY)
  let count = 1
  if (raw) {
    try {
      count = ((JSON.parse(raw) as { count: number }).count ?? 0) + 1
    } catch {
      count = 1
    }
  }
  // The 5th consecutive failure starts the first cooldown; later failures
  // extend it linearly (capped at 6 minutes) instead of allowing silently
  // unlimited attempts.
  const over = count - MAX_FREE_ATTEMPTS
  const until = over >= 0 ? now + COOLDOWN_MS * Math.min(over + 1, 12) : 0
  localStorage.setItem(ATTEMPTS_KEY, JSON.stringify({ count, until }))
}

function clearFailures(): void {
  localStorage.removeItem(ATTEMPTS_KEY)
}

async function derive(pin: string): Promise<CryptoKey> {
  const salt = localStorage.getItem(SALT_KEY)
  if (!salt) throw new Error('Lock is not configured')
  return deriveKeyFromPin(pin, salt, PIN_ITERATIONS)
}

export async function enableLock(pin: string): Promise<void> {
  if (isLockConfigured()) throw new Error('Lock is already enabled')
  const invalid = validatePin(pin)
  if (invalid) throw new Error(invalid)

  localStorage.setItem(SALT_KEY, randomBytesBase64(16))
  sessionKey = await derive(pin)
  localStorage.setItem(PROBE_KEY, await encryptWithKey(PROBE_VALUE, sessionKey))
  clearFailures()
}

export async function unlockWithPin(pin: string): Promise<void> {
  const wait = cooldownRemainingMs()
  if (wait > 0) throw new Error(`尝试次数过多，请 ${Math.ceil(wait / 1000)} 秒后再试`)

  const probe = localStorage.getItem(PROBE_KEY)
  if (!probe) throw new Error('Lock is not configured')

  try {
    const key = await derive(pin)
    if ((await decryptWithKey(probe, key)) !== PROBE_VALUE) throw new InvalidPinError()
    sessionKey = key
    clearFailures()
  } catch (err) {
    registerFailure()
    if (err instanceof InvalidPinError) throw err
    // A corrupt payload is not a wrong PIN, but must not unlock anything.
    throw new InvalidPinError()
  }
}

export function lockApp(): void {
  sessionKey = null
}

/** Re-derives the probe under a new key. Callers must rewrite stored data. */
export async function changePin(currentPin: string, nextPin: string): Promise<CryptoKey> {
  await unlockWithPin(currentPin)
  const invalid = validatePin(nextPin)
  if (invalid) throw new Error(invalid)

  localStorage.setItem(SALT_KEY, randomBytesBase64(16))
  const key = await derive(nextPin)
  localStorage.setItem(PROBE_KEY, await encryptWithKey(PROBE_VALUE, key))
  sessionKey = key
  clearFailures()
  return key
}

/** Verifies the PIN, then removes salt/probe. Callers must rewrite stored data. */
export async function disableLock(pin: string): Promise<void> {
  await unlockWithPin(pin)
  localStorage.removeItem(SALT_KEY)
  localStorage.removeItem(PROBE_KEY)
  sessionKey = null
  clearFailures()
}
