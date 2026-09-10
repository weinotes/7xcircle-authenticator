/**
 * 7X Circle Authenticator — TOTP / HOTP code generation (RFC 6238, RFC 4226)
 *
 * @author Davey Wong <wgwcko@gmail.com>
 * @copyright 2026 Davey Wong <wgwcko@gmail.com> / 7X Circle
 * @license SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. See LICENSE.
 */
import * as OTPAuth from 'otpauth'
import type { Token } from './types'

/**
 * 生成 TOTP/HOTP 验证码
 */
export function generateOTP(token: Token): string {
  if (token.type === 'hotp') {
    const hotp = new OTPAuth.HOTP({
      issuer: token.issuer,
      label: token.accountName,
      algorithm: token.algorithm,
      digits: token.digits,
      secret: OTPAuth.Secret.fromBase32(token.secret),
      counter: token.counter || 0,
    })
    return hotp.generate()
  }

  const totp = new OTPAuth.TOTP({
    issuer: token.issuer,
    label: token.accountName,
    algorithm: token.algorithm,
    digits: token.digits,
    period: token.period,
    secret: OTPAuth.Secret.fromBase32(token.secret),
  })
  return totp.generate()
}

/**
 * 获取 TOTP 剩余时间（秒）
 */
export function getRemainingSeconds(period: number = 30): number {
  const now = Math.floor(Date.now() / 1000)
  return period - (now % period)
}

/**
 * 获取 TOTP 进度（0-1，用于进度条）
 */
export function getProgress(period: number = 30): number {
  return getRemainingSeconds(period) / period
}

/**
 * 验证 TOTP 是否即将过期（剩余时间 <= 阈值时高亮警告）
 */
export function isExpiring(period: number = 30, threshold: number = 5): boolean {
  return getRemainingSeconds(period) <= threshold
}

/**
 * 验证 BASE32 密钥是否有效
 */
export function isValidSecret(secret: string): boolean {
  try {
    const cleaned = secret.replace(/\s/g, '')
    if (!/^[A-HJ-KM-Z2-7]+=*$/i.test(cleaned)) return false
    if (cleaned.length === 0) return false
    OTPAuth.Secret.fromBase32(cleaned)
    return true
  } catch {
    return false
  }
}
