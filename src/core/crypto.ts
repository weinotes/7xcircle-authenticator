const ENCRYPTION_ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12
const SALT_LENGTH = 16
const PBKDF2_ITERATIONS = 100000
const PBKDF2_HASH = 'SHA-256'

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function encryptString(text: string, password: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const key = await deriveKey(password, salt)

  const encoder = new TextEncoder()
  const encoded = encoder.encode(text)
  const ciphertext = await crypto.subtle.encrypt(
    { name: ENCRYPTION_ALGORITHM, iv },
    key,
    encoded,
  )

  const combined = new Uint8Array(iv.length + salt.length + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(salt, iv.length)
  combined.set(new Uint8Array(ciphertext), iv.length + salt.length)

  return btoa(String.fromCharCode(...combined))
}

export async function decryptString(encoded: string, password: string): Promise<string> {
  const decoded = new Uint8Array(atob(encoded).split('').map((c) => c.charCodeAt(0)))

  const iv = decoded.slice(0, IV_LENGTH)
  const salt = decoded.slice(IV_LENGTH, IV_LENGTH + SALT_LENGTH)
  const ciphertext = decoded.slice(IV_LENGTH + SALT_LENGTH)

  const key = await deriveKey(password, salt)

  const decrypted = await crypto.subtle.decrypt(
    { name: ENCRYPTION_ALGORITHM, iv },
    key,
    ciphertext,
  )

  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

export async function generateSecureKey(): Promise<string> {
  const key = await crypto.subtle.generateKey(
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt'],
  )
  const exported = await crypto.subtle.exportKey('raw', key)
  return btoa(String.fromCharCode(...new Uint8Array(exported)))
}

export function generateIV(): string {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  return btoa(String.fromCharCode(...iv))
}

export async function encryptData<T>(data: T, secretKey: string): Promise<string> {
  const json = JSON.stringify(data)
  return encryptString(json, secretKey)
}

export async function decryptData<T>(encoded: string, secretKey: string): Promise<T> {
  const json = await decryptString(encoded, secretKey)
  return JSON.parse(json)
}
