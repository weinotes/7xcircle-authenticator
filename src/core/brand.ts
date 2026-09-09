/**
 * Single source of truth for brand identity.
 *
 * Every user-visible name, storage key prefix and contact address must be
 * derived from this module. Do not hardcode brand strings elsewhere — the
 * previous brand reached 37 places across 15 files precisely because there was
 * no single source.
 *
 * `brand.test.ts` asserts these values stay in sync with package.json and that
 * no legacy identifier comes back.
 */

export const BRAND = {
  /** Display name, English. */
  nameEn: '7X Circle Authenticator',
  /** Display name, Chinese — used in the app header and About panel. */
  nameZh: '7X Circle 验证器',
  /** Repository / artifact slug. */
  slug: '7xcircle-authenticator',
  /**
   * Android applicationId / iOS bundle id.
   * Deliberately `sevencircle`, not `7xcircle`: a Java package segment may
   * not begin with a digit, so the domain root cannot be used verbatim.
   */
  appId: 'com.sevencircle.auth',
  /** Club domain root, per 7X Circle Brandbook (finalized 2026-09-08). */
  domain: '7xcircle.com',
  /** Public project site for this app. */
  homepage: 'https://github.com/weinotes/7xcircle-authenticator',
  supportEmail: 'support@7xcircle.com',
  /** Release version — kept in sync with package.json by brand.test.ts. */
  version: '1.1.0',
  /** Prefix for every localStorage / SQLite key. */
  storagePrefix: 'sevencircle_auth',
} as const

/** Namespaced storage key, e.g. `storageKey('tokens')` -> `sevencircle_auth_tokens`. */
export function storageKey(name: string): string {
  return `${BRAND.storagePrefix}_${name}`
}
