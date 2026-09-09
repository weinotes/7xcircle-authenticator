import type { TokenInput } from './types'

/**
 * 解析 otpauth:// URI
 * 格式: otpauth://totp/Issuer:account?secret=BASE32&algorithm=SHA1&digits=6&period=30
 */
export function parseOTPAuthURI(uri: string): TokenInput {
  if (!uri.startsWith('otpauth://')) {
    throw new Error('无效的 OTPAuth URI')
  }

  const url = new URL(uri)
  const type = url.hostname // 'totp' or 'hotp'

  if (type !== 'totp' && type !== 'hotp') {
    throw new Error(`不支持的 OTP 类型: ${type}`)
  }

  // 解析路径中的 issuer 和 account
  let path = decodeURIComponent(url.pathname.slice(1)) // 去掉开头的 /
  let issuer = ''
  let accountName = path

  if (path.includes(':')) {
    const parts = path.split(':')
    issuer = parts[0].trim()
    accountName = parts.slice(1).join(':').trim()
  }

  // 从查询参数获取配置
  const secret = url.searchParams.get('secret')
  if (!secret) {
    throw new Error('缺少 secret 参数')
  }

  const algorithm = (url.searchParams.get('algorithm') || 'SHA1').toUpperCase() as TokenInput['algorithm']
  const digits = parseInt(url.searchParams.get('digits') || '6') as TokenInput['digits']
  const period = parseInt(url.searchParams.get('period') || '30')
  const counter = url.searchParams.get('counter') ? parseInt(url.searchParams.get('counter')!) : undefined

  // 如果 URL 参数中有 issuer，优先使用
  const paramIssuer = url.searchParams.get('issuer')
  if (paramIssuer) {
    issuer = paramIssuer
  }

  if (!issuer) {
    issuer = '未知'
  }

  return {
    issuer,
    accountName,
    secret: secret.replace(/\s/g, '').toUpperCase(),
    algorithm,
    digits,
    period,
    type,
    counter,
  }
}

/**
 * 生成 otpauth:// URI
 */
export function generateOTPAuthURI(input: TokenInput): string {
  const label = input.issuer
    ? `${encodeURIComponent(input.issuer)}:${encodeURIComponent(input.accountName)}`
    : encodeURIComponent(input.accountName)

  const params = new URLSearchParams({
    secret: input.secret,
    algorithm: input.algorithm || 'SHA1',
    digits: String(input.digits || 6),
    period: String(input.period || 30),
  })

  if (input.issuer) {
    params.set('issuer', input.issuer)
  }

  if (input.type === 'hotp' && input.counter !== undefined) {
    params.set('counter', String(input.counter))
  }

  return `otpauth://${input.type || 'totp'}/${label}?${params.toString()}`
}
