/**
 * 7X Circle Authenticator — tests for TOTP / HOTP generation
 *
 * @author Davey Wong <wgwcko@gmail.com>
 * @copyright 2026 Davey Wong <wgwcko@gmail.com> / 7X Circle
 * @license SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. See LICENSE.
 */
import { describe, it, expect, vi } from 'vitest'
import {
  generateOTP,
  getRemainingSeconds,
  getProgress,
  isExpiring,
  isValidSecret,
} from './totp'
import type { Token } from './types'

describe('TOTP/HOTP Functions', () => {
  const totpToken: Token = {
    id: 'test-totp',
    issuer: 'Test',
    accountName: 'test@example.com',
    secret: 'JBSWY3DPEHPK3PXP',
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    type: 'totp',
    syncStatus: 'local',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  const hotpToken: Token = {
    ...totpToken,
    id: 'test-hotp',
    type: 'hotp',
    counter: 0,
  }

  describe('generateOTP', () => {
    it('should generate TOTP code', () => {
      const otp = generateOTP(totpToken)
      expect(otp).toHaveLength(6)
      expect(/^\d{6}$/.test(otp)).toBe(true)
    })

    it('should generate HOTP code', () => {
      const otp = generateOTP(hotpToken)
      expect(otp).toHaveLength(6)
      expect(/^\d{6}$/.test(otp)).toBe(true)
    })

    it('should generate different HOTP codes for different counters', () => {
      const token1 = { ...hotpToken, counter: 0 }
      const token2 = { ...hotpToken, counter: 1 }
      expect(generateOTP(token1)).not.toBe(generateOTP(token2))
    })

    it('should support different digits', () => {
      const token7 = { ...totpToken, digits: 7 as const }
      const token8 = { ...totpToken, digits: 8 as const }
      expect(generateOTP(token7)).toHaveLength(7)
      expect(generateOTP(token8)).toHaveLength(8)
    })
  })

  describe('getRemainingSeconds', () => {
    it('should return value between 0 and period', () => {
      const remaining = getRemainingSeconds(30)
      expect(remaining).toBeGreaterThanOrEqual(0)
      expect(remaining).toBeLessThanOrEqual(30)
    })
  })

  describe('getProgress', () => {
    it('should return value between 0 and 1', () => {
      const progress = getProgress(30)
      expect(progress).toBeGreaterThanOrEqual(0)
      expect(progress).toBeLessThanOrEqual(1)
    })
  })

  describe('isExpiring', () => {
    it('should return true when remaining seconds <= threshold', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-01T00:00:28Z'))
      expect(isExpiring(30, 5)).toBe(true)
      vi.useRealTimers()
    })

    it('should return false when remaining seconds > threshold', () => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2024-01-01T00:00:10Z'))
      expect(isExpiring(30, 5)).toBe(false)
      vi.useRealTimers()
    })
  })

  describe('isValidSecret', () => {
    it('should validate valid Base32 secrets', () => {
      expect(isValidSecret('JBSWY3DPEHPK3PXP')).toBe(true)
      expect(isValidSecret('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ')).toBe(true)
      expect(isValidSecret('JBSWY3DPEHPK3PX')).toBe(true)
    })

    it('should reject invalid Base32 secrets', () => {
      expect(isValidSecret('INVALID')).toBe(false)
      expect(isValidSecret('JBSWY3DPEHPK3PXP1')).toBe(false)
      expect(isValidSecret('JBSWY3DPEHPK3PXP8')).toBe(false)
      expect(isValidSecret('')).toBe(false)
    })

    it('should ignore whitespace', () => {
      expect(isValidSecret('JBSWY3D PEHPK3PXP')).toBe(true)
    })
  })
})
