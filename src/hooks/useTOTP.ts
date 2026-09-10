/**
 * 7X Circle Authenticator — per-second code refresh for the visible tokens
 *
 * @author Davey Wong <wgwcko@gmail.com>
 * @copyright 2026 Davey Wong <wgwcko@gmail.com> / 7X Circle
 * @license SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. See LICENSE.
 */
import { useState, useEffect, useCallback } from 'react'
import type { Token } from '../core/types'
import { generateOTP, getRemainingSeconds, isExpiring } from '../core/totp'

interface TOTPLive {
  otp: string
  remaining: number
  expiring: boolean
}

/**
 * 实时生成 TOTP 验证码的 Hook
 */
export function useTOTP(token: Token): TOTPLive {
  const [state, setState] = useState<TOTPLive>(() => ({
    otp: generateOTP(token),
    remaining: getRemainingSeconds(token.period),
    expiring: isExpiring(token.period),
  }))

  const update = useCallback(() => {
    const remaining = getRemainingSeconds(token.period)
    setState({
      otp: generateOTP(token),
      remaining,
      expiring: isExpiring(token.period),
    })
  }, [token])

  useEffect(() => {
    // 每秒更新
    const interval = setInterval(update, 1000)
    update()
    return () => clearInterval(interval)
  }, [update])

  return state
}

/**
 * 批量 TOTP Hook（用于列表页，每秒刷新所有）
 */
export function useTOTPBatch(tokens: Token[]): Map<string, TOTPLive> {
  const [map, setMap] = useState<Map<string, TOTPLive>>(new Map())

  useEffect(() => {
    const update = () => {
      const newMap = new Map<string, TOTPLive>()
      for (const token of tokens) {
        newMap.set(token.id, {
          otp: generateOTP(token),
          remaining: getRemainingSeconds(token.period),
          expiring: isExpiring(token.period),
        })
      }
      setMap(newMap)
    }

    const interval = setInterval(update, 1000)
    update()
    return () => clearInterval(interval)
  }, [tokens])

  return map
}
