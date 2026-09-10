/**
 * 7X Circle Authenticator — shared domain types (token, lock state, backup envelope)
 *
 * @author Davey Wong <wgwcko@gmail.com>
 * @copyright 2026 Davey Wong <wgwcko@gmail.com> / 7X Circle
 * @license SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. See LICENSE.
 */
export interface Token {
  id: string
  issuer: string
  accountName: string
  secret: string
  algorithm: 'SHA1' | 'SHA256' | 'SHA512'
  digits: 6 | 7 | 8
  period: number
  type: 'totp' | 'hotp'
  counter?: number
  icon?: string
  syncStatus: 'local' | 'synced' | 'conflict'
  createdAt: number
  updatedAt: number
}

export interface TokenInput {
  issuer: string
  accountName: string
  secret: string
  algorithm?: 'SHA1' | 'SHA256' | 'SHA512'
  digits?: 6 | 7 | 8
  period?: number
  type?: 'totp' | 'hotp'
  counter?: number
}

export type Page = 'home' | 'add' | 'edit' | 'settings' | 'lock'
