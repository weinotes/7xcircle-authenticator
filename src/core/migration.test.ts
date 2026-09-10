/**
 * 7X Circle Authenticator — tests for the otpauth-migration:// parser
 *
 * @author Davey Wong <wgwcko@gmail.com>
 * @copyright 2026 Davey Wong <wgwcko@gmail.com> / 7X Circle
 * @license SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. See LICENSE.
 */
import { describe, expect, it } from 'vitest'
import * as OTPAuth from 'otpauth'
import { parseMigrationURI } from './migration'
import { parseAccountURI } from './uri-parser'

function varint(value: number): number[] {
  const bytes: number[] = []
  let current = value
  while (current > 0x7f) {
    bytes.push((current & 0x7f) | 0x80)
    current = Math.floor(current / 128)
  }
  bytes.push(current)
  return bytes
}

function concat(...parts: number[][]): number[] {
  return parts.flat()
}

function varintField(field: number, value: number): number[] {
  return concat(varint((field << 3) | 0), varint(value))
}

function bytesField(field: number, value: number[]): number[] {
  return concat(varint((field << 3) | 2), varint(value.length), value)
}

function textField(field: number, value: string): number[] {
  return bytesField(field, [...new TextEncoder().encode(value)])
}

function otpParameters(options: {
  secret: string
  name: string
  issuer: string
  algorithm: number
  digits: number
  type: number
  counter?: number
}): number[] {
  const secret = OTPAuth.Secret.fromBase32(options.secret).bytes
  const fields = [
    bytesField(1, [...secret]),
    textField(2, options.name),
    textField(3, options.issuer),
    varintField(4, options.algorithm),
    varintField(5, options.digits),
    varintField(6, options.type),
  ]
  if (options.counter !== undefined) fields.push(varintField(7, options.counter))
  return concat(...fields)
}

function migrationURI(...parameters: number[][]): string {
  const payload = concat(
    ...parameters.map((parameter) => bytesField(1, parameter)),
    varintField(2, 1),
  )
  const base64 = btoa(String.fromCharCode(...payload))
  return `otpauth-migration://offline?data=${encodeURIComponent(base64)}`
}

describe('Google Authenticator migration QR', () => {
  it('imports every OTP parameter in the payload', () => {
    const uri = migrationURI(
      otpParameters({
        secret: 'JBSWY3DPEHPK3PXP',
        name: 'alice@example.com',
        issuer: 'Example',
        algorithm: 1,
        digits: 1,
        type: 2,
      }),
      otpParameters({
        secret: 'GEZDGNBVGY3TQOJQ',
        name: 'bob@example.com',
        issuer: 'HOTP Service',
        algorithm: 2,
        digits: 2,
        type: 1,
        counter: 7,
      }),
    )

    const tokens = parseMigrationURI(uri)
    expect(tokens).toHaveLength(2)
    expect(tokens[0]).toMatchObject({
      issuer: 'Example',
      accountName: 'alice@example.com',
      secret: 'JBSWY3DPEHPK3PXP',
      algorithm: 'SHA1',
      digits: 6,
      type: 'totp',
    })
    expect(tokens[1]).toMatchObject({
      issuer: 'HOTP Service',
      accountName: 'bob@example.com',
      secret: 'GEZDGNBVGY3TQOJQ',
      algorithm: 'SHA256',
      digits: 8,
      type: 'hotp',
      counter: 7,
    })
  })

  it('accepts base64url payloads without padding', () => {
    const uri = migrationURI(
      otpParameters({
        secret: 'MFRGGZDFMZTWQ2LK',
        name: 'user@example.com',
        issuer: 'URL Safe',
        algorithm: 3,
        digits: 1,
        type: 2,
      }),
    )
    const data = new URL(uri).searchParams.get('data') as string
    const base64url = data.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    const tokens = parseMigrationURI(`otpauth-migration://offline?data=${base64url}`)
    expect(tokens[0].algorithm).toBe('SHA512')
  })

  it('rejects unsupported MD5 tokens instead of generating wrong codes', () => {
    const uri = migrationURI(
      otpParameters({
        secret: 'JBSWY3DPEHPK3PXP',
        name: 'legacy@example.com',
        issuer: 'Legacy',
        algorithm: 4,
        digits: 1,
        type: 2,
      }),
    )
    expect(() => parseMigrationURI(uri)).toThrow('MD5')
  })

  it('is dispatched by parseAccountURI alongside otpauth:// URIs', () => {
    expect(parseAccountURI('otpauth://totp/A:b?secret=JBSWY3DPEHPK3PXP')).toHaveLength(1)
    expect(() => parseMigrationURI('otpauth://totp/A:b?secret=JBSWY3DPEHPK3PXP')).toThrow(
      '无效的 Google Authenticator 迁移二维码',
    )
  })
})
