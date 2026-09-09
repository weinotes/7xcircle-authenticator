import type { Token } from '../../core/types'

export interface DatabaseAdapter {
  getAllTokens(): Promise<Token[]>
  saveTokens(tokens: Token[]): Promise<void>
  addToken(token: Token): Promise<void>
  updateToken(id: string, updates: Partial<Token>): Promise<void>
  deleteToken(id: string): Promise<void>
}
