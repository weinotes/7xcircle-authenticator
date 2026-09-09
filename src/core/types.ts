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

export type Page = 'home' | 'add' | 'edit' | 'settings'
