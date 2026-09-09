const ENCRYPTION_ALGORITHM = 'AES-GCM'
const KEY_LENGTH = 256
const IV_LENGTH = 12
const SALT_LENGTH = 16
const PBKDF2_ITERATIONS = 600000
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

/* ── Key-handle API ─────────────────────────────────────────────── */

/** PBKDF2 rounds for the unlock PIN. OWASP recommends 600k for SHA-256. */
export const PIN_ITERATIONS = PBKDF2_ITERATIONS

export function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

export function fromBase64(text: string): Uint8Array {
  return Uint8Array.from(atob(text), (c) => c.charCodeAt(0))
}

export function randomBytesBase64(length: number): string {
  return toBase64(crypto.getRandomValues(new Uint8Array(length)))
}

/**
 * Derives a non-extractable AES-GCM key from a low-entropy PIN.
 * The key never leaves this realm, so it cannot be serialized out of memory
 * by anything that can read localStorage.
 */
export async function deriveKeyFromPin(
  pin: string,
  saltBase64: string,
  iterations: number = PIN_ITERATIONS,
): Promise<CryptoKey> {
  if (!pin) throw new Error('PIN must not be empty')
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(pin.normalize('NFKD')),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: fromBase64(saltBase64).buffer as ArrayBuffer,
      iterations,
      hash: PBKDF2_HASH,
    },
    keyMaterial,
    { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt'],
  )
}

/** Encrypts with an existing key handle. Output: base64(iv || ciphertext). */
export async function encryptWithKey(plain: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const ciphertext = await crypto.subtle.encrypt(
    { name: ENCRYPTION_ALGORITHM, iv },
    key,
    new TextEncoder().encode(plain),
  )
  const combined = new Uint8Array(iv.length + ciphertext.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(ciphertext), iv.length)
  return toBase64(combined)
}

/**
 * Decrypts an `encryptWithKey` payload. Throws on a wrong key because
 * AES-GCM authenticates; callers can therefore use failure as PIN check.
 */
export async function decryptWithKey(payload: string, key: CryptoKey): Promise<string> {
  const decoded = fromBase64(payload)
  const iv = decoded.slice(0, IV_LENGTH)
  const ciphertext = decoded.slice(IV_LENGTH)
  const decrypted = await crypto.subtle.decrypt(
    { name: ENCRYPTION_ALGORITHM, iv },
    key,
    ciphertext.buffer as ArrayBuffer,
  )
  return new TextDecoder().decode(decrypted)
}
