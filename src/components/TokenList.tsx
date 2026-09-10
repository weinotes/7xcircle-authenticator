/**
 * 7X Circle Authenticator — searchable token list with live codes
 *
 * @author Davey Wong <wgwcko@gmail.com>
 * @copyright 2026 Davey Wong <wgwcko@gmail.com> / 7X Circle
 * @license SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. See LICENSE.
 */
import { TokenCard } from './TokenCard'
import type { Token } from '../core/types'

interface TokenListProps {
  tokens: Token[]
  searchQuery: string
  onDelete: (id: string) => void
  onAdvance: (token: Token) => void
  onEdit: (token: Token) => void
}

export function TokenList({ tokens, searchQuery, onDelete, onAdvance, onEdit }: TokenListProps) {
  const filtered = tokens.filter((token) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      token.issuer.toLowerCase().includes(q) ||
      token.accountName.toLowerCase().includes(q)
    )
  })

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 mb-4 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        {searchQuery ? (
          <p className="text-sm">没有找到匹配的令牌</p>
        ) : (
          <>
            <p className="text-sm mb-1">还没有添加任何令牌</p>
            <p className="text-xs text-gray-600">点击下方 + 按钮添加</p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="px-4 pb-28">
      {filtered.map((token) => (
        <TokenCard
          key={token.id}
          token={token}
          onDelete={onDelete}
          onAdvance={onAdvance}
          onEdit={onEdit}
        />
      ))}
    </div>
  )
}
