/**
 * 7X Circle Authenticator — Google Authenticator export (otpauth-migration://) parsing
 *
 * @author Davey Wong <wgwcko@gmail.com>
 * @copyright 2026 Davey Wong <wgwcko@gmail.com> / 7X Circle
 * @license SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. See LICENSE.
 */
import type { TokenInput } from './types'

/**
 * Google Authenticator 的“导出账户”二维码使用
 * `otpauth-migration://offline?data=<protobuf base64>`。
 *
 * 这里只解析导出所需的最小字段，不依赖 protobuf 运行时：
 *   MigrationPayload.otp_parameters -> OtpParameters
 */

interface OtpParameters {
  secret: Uint8Array
  name?: string
  issuer?: string
  algorithm?: number
  digits?: number
  type?: number
  counter?: number
}

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'

function readVarint(bytes: Uint8Array, offset: number): [number, number] {
  let result = 0
  let shift = 0
  while (offset < bytes.length) {
    const byte = bytes[offset++]
    result += (byte & 0x7f) * 2 ** shift
    if ((byte & 0x80) === 0) return [result, offset]
    shift += 7
    if (shift > 63) throw new Error('迁移数据中的 varint 过长')
  }
  throw new Error('迁移数据不完整')
}

type Field = { number: number; wire: number; bytes?: Uint8Array; value?: number }

function readFields(bytes: Uint8Array): Field[] {
  const fields: Field[] = []
  let offset = 0
  while (offset < bytes.length) {
    const [tag, afterTag] = readVarint(bytes, offset)
    offset = afterTag
    const number = tag >>> 3
    const wire = tag & 0x07

    if (wire === 0) {
      const [value, next] = readVarint(bytes, offset)
      fields.push({ number, wire, value })
      offset = next
    } else if (wire === 2) {
      const [length, next] = readVarint(bytes, offset)
      offset = next
      if (offset + length > bytes.length) throw new Error('迁移数据不完整')
      fields.push({ number, wire, bytes: bytes.subarray(offset, offset + length) })
      offset += length
    } else if (wire === 1) {
      offset += 8
    } else if (wire === 5) {
      offset += 4
    } else {
      throw new Error(`不支持的 protobuf wire type: ${wire}`)
    }
  }
  return fields
}

function decodeBase64(input: string): Uint8Array {
  const normalized = input.replace(/-/g, '+').replace(/_/g, '/')
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4))
  let binary: string
  try {
    binary = atob(normalized + padding)
  } catch {
    throw new Error('迁移二维码中的 data 不是合法 base64')
  }
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function base32Encode(bytes: Uint8Array): string {
  let bits = 0
  let value = 0
  let output = ''
  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) output += BASE32_ALPHABET[(value << (5 - bits)) & 31]
  return output
}

function parseOtpParameters(bytes: Uint8Array): OtpParameters {
  const result: OtpParameters = { secret: new Uint8Array() }
  for (const field of readFields(bytes)) {
    if (field.number === 1 && field.wire === 2) result.secret = field.bytes as Uint8Array
    if (field.number === 2 && field.wire === 2) result.name = new TextDecoder().decode(field.bytes)
    if (field.number === 3 && field.wire === 2) result.issuer = new TextDecoder().decode(field.bytes)
    if (field.number === 4 && field.wire === 0) result.algorithm = field.value
    if (field.number === 5 && field.wire === 0) result.digits = field.value
    if (field.number === 6 && field.wire === 0) result.type = field.value
    if (field.number === 7 && field.wire === 0) result.counter = field.value
  }
  return result
}

function toTokenInput(parameters: OtpParameters): TokenInput | null {
  if (!parameters.secret.length) return null

  const issuer = parameters.issuer?.trim() || parameters.name?.trim()
  const accountName = parameters.name?.trim() || issuer
  if (!issuer || !accountName) return null

  const algorithms: Record<number, TokenInput['algorithm']> = {
    1: 'SHA1',
    2: 'SHA256',
    3: 'SHA512',
  }
  const algorithm = algorithms[parameters.algorithm ?? 1]
  if (!algorithm) throw new Error('暂不支持 Google Authenticator 的 MD5 令牌')

  return {
    issuer,
    accountName,
    secret: base32Encode(parameters.secret),
    algorithm,
    digits: parameters.digits === 2 ? 8 : 6,
    period: 30,
    type: parameters.type === 1 ? 'hotp' : 'totp',
    counter: parameters.type === 1 ? parameters.counter ?? 0 : undefined,
  }
}

/**
 * 解析 Google Authenticator 导出二维码，返回其中包含的所有令牌。
 */
export function parseMigrationURI(uri: string): TokenInput[] {
  if (!/^otpauth-migration:\/\//i.test(uri)) {
    throw new Error('无效的 Google Authenticator 迁移二维码')
  }

  const url = new URL(uri)
  const data = url.searchParams.get('data')
  if (!data) throw new Error('迁移二维码缺少 data 参数')

  const payload = decodeBase64(data)
  const tokens: TokenInput[] = []
  for (const field of readFields(payload)) {
    if (field.number !== 1 || field.wire !== 2) continue
    const token = toTokenInput(parseOtpParameters(field.bytes as Uint8Array))
    if (token) tokens.push(token)
  }

  if (tokens.length === 0) throw new Error('迁移二维码中没有可导入的令牌')
  return tokens
}
