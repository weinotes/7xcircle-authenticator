/**
 * 7X Circle Authenticator — storage adapter interface
 *
 * @author Davey Wong <wgwcko@gmail.com>
 * @copyright 2026 Davey Wong <wgwcko@gmail.com> / 7X Circle
 * @license SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. See LICENSE.
 */
import type { Token } from '../../core/types'

export interface DatabaseAdapter {
  getAllTokens(): Promise<Token[]>
  saveTokens(tokens: Token[]): Promise<void>
  addToken(token: Token): Promise<void>
  updateToken(id: string, updates: Partial<Token>): Promise<void>
  deleteToken(id: string): Promise<void>
}
