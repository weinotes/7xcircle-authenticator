import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { BRAND, storageKey } from './brand'

// Vitest runs with cwd = project root. import.meta.url is not a file URL under
// jsdom, so path resolution has to go through the filesystem instead.
const root = resolve(process.cwd())
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as {
  name: string
  version: string
}

/**
 * Built from fragments so this file cannot match its own pattern.
 * The previous brand leaked into 37 places across 15 files; this is the gate
 * that stops it coming back.
 */
const LEGACY = new RegExp(`${'jue'}${'zhao'}|${'觉'}${'照'}|${'绝'}${'招'}`, 'i')

const SCANNED_DIRS = ['src', 'android/app/src/main/java', '.github/workflows']
const SCANNED_FILES = [
  'package.json',
  'index.html',
  'capacitor.config.ts',
  'android/app/build.gradle',
  'android/app/src/main/res/values/strings.xml',
]

function walk(dir: string): string[] {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? walk(path) : [path]
  })
}

describe('brand constants', () => {
  it('stay in sync with package.json', () => {
    expect(BRAND.version).toBe(pkg.version)
    expect(BRAND.slug).toBe(pkg.name)
  })

  it('use a legal Java package for appId', () => {
    // A package segment may not begin with a digit, so the domain root
    // (`7xcircle`) can never be used verbatim as an applicationId.
    for (const segment of BRAND.appId.split('.')) {
      expect(segment).toMatch(/^[a-z][a-z0-9_]*$/)
    }
  })

  it('points every storage key at the current prefix', () => {
    expect(storageKey('tokens')).toBe('sevencircle_auth_tokens')
    expect(storageKey('tokens')).not.toMatch(LEGACY)
  })

  it('uses the finalized club domain', () => {
    expect(BRAND.domain).toBe('7xcircle.com')
    expect(BRAND.supportEmail).toBe(`support@${BRAND.domain}`)
  })
})

describe('rename completeness', () => {
  it('leaves no legacy brand identifier in source, config or CI', () => {
    const files = [...SCANNED_DIRS.flatMap(walk), ...SCANNED_FILES]
    const offenders = files.filter((file) => LEGACY.test(readFileSync(join(root, file), 'utf8')))
    expect(offenders).toEqual([])
  })
})
