/**
 * 7X Circle Authenticator — tests for otpauth:// URI handling
 *
 * @author Davey Wong <wgwcko@gmail.com>
 * @copyright 2026 Davey Wong <wgwcko@gmail.com> / 7X Circle
 * @license SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. See LICENSE.
 */
import { describe, it, expect } from 'vitest'
import { parseOTPAuthURI, generateOTPAuthURI } from './uri-parser'
import type { TokenInput } from './types'

describe('URI Parser', () => {
  describe('parseOTPAuthURI', () => {
    it('should parse basic TOTP URI', () => {
      const uri = 'otpauth://totp/Example:alice@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Example'
      const result = parseOTPAuthURI(uri)
      expect(result.type).toBe('totp')
      expect(result.issuer).toBe('Example')
      expect(result.accountName).toBe('alice@example.com')
      expect(result.secret).toBe('JBSWY3DPEHPK3PXP')
      expect(result.algorithm).toBe('SHA1')
      expect(result.digits).toBe(6)
      expect(result.period).toBe(30)
    })

    it('should parse HOTP URI', () => {
      const uri = 'otpauth://hotp/Example:alice@example.com?secret=JBSWY3DPEHPK3PXP&counter=123'
      const result = parseOTPAuthURI(uri)
      expect(result.type).toBe('hotp')
      expect(result.counter).toBe(123)
    })

    it('should parse custom algorithm and digits', () => {
      const uri = 'otpauth://totp/Test:user?secret=GEZDGNBVGY3TQOJQ&algorithm=SHA256&digits=8&period=60'
      const result = parseOTPAuthURI(uri)
      expect(result.algorithm).toBe('SHA256')
      expect(result.digits).toBe(8)
      expect(result.period).toBe(60)
    })

    it('should parse issuer from path when not in query', () => {
      const uri = 'otpauth://totp/Google:user@gmail.com?secret=JBSWY3DPEHPK3PXP'
      const result = parseOTPAuthURI(uri)
      expect(result.issuer).toBe('Google')
      expect(result.accountName).toBe('user@gmail.com')
    })

    it('should prefer query parameter issuer over path issuer', () => {
      const uri = 'otpauth://totp/Old:user?secret=JBSWY3DPEHPK3PXP&issuer=New'
      const result = parseOTPAuthURI(uri)
      expect(result.issuer).toBe('New')
    })

    it('should throw error for invalid URI', () => {
      expect(() => parseOTPAuthURI('http://example.com')).toThrow('无效的 OTPAuth URI')
    })

    it('should throw error for missing secret', () => {
      expect(() => parseOTPAuthURI('otpauth://totp/Example:user')).toThrow('缺少 secret 参数')
    })

    it('should throw error for unsupported type', () => {
      expect(() => parseOTPAuthURI('otpauth://unknown/Example:user?secret=JBSWY3DPEHPK3PXP')).toThrow('不支持的 OTP 类型')
    })
  })

  describe('generateOTPAuthURI', () => {
    it('should generate TOTP URI', () => {
      const input: TokenInput = {
        issuer: 'Example',
        accountName: 'alice@example.com',
        secret: 'JBSWY3DPEHPK3PXP',
        algorithm: 'SHA1',
        digits: 6,
        period: 30,
        type: 'totp',
      }
      const uri = generateOTPAuthURI(input)
      expect(uri).toContain('otpauth://totp/')
      expect(uri).toContain('secret=JBSWY3DPEHPK3PXP')
      expect(uri).toContain('issuer=Example')
    })

    it('should generate HOTP URI with counter', () => {
      const input: TokenInput = {
        issuer: 'Example',
        accountName: 'alice@example.com',
        secret: 'JBSWY3DPEHPK3PXP',
        algorithm: 'SHA1',
        digits: 6,
        type: 'hotp',
        counter: 123,
      }
      const uri = generateOTPAuthURI(input)
      expect(uri).toContain('otpauth://hotp/')
      expect(uri).toContain('counter=123')
    })

    it('should be reversible', () => {
      const input: TokenInput = {
        issuer: 'Test',
        accountName: 'user@test.com',
        secret: 'GEZDGNBVGY3TQOJQ',
        algorithm: 'SHA256',
        digits: 8,
        period: 60,
        type: 'totp',
      }
      const uri = generateOTPAuthURI(input)
      const parsed = parseOTPAuthURI(uri)
      expect(parsed.issuer).toBe(input.issuer)
      expect(parsed.accountName).toBe(input.accountName)
      expect(parsed.secret).toBe(input.secret)
      expect(parsed.algorithm).toBe(input.algorithm)
      expect(parsed.digits).toBe(input.digits)
      expect(parsed.period).toBe(input.period)
      expect(parsed.type).toBe(input.type)
    })
  })
})
