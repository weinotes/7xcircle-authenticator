/**
 * 7X Circle Authenticator — guards the brand constants and blocks legacy identifiers
 *
 * @author Davey Wong <wgwcko@gmail.com>
 * @copyright 2026 Davey Wong <wgwcko@gmail.com> / 7X Circle
 * @license SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. See LICENSE.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
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

// `download` is the standalone APK download page: it ships brand strings and
// release links to the public, so it is scanned like every other source tree.
const SCANNED_DIRS = ['src', 'download', 'android/app/src/main/java', '.github/workflows']
const SCANNED_FILES = [
  'package.json',
  'index.html',
  'capacitor.config.ts',
  'android/app/build.gradle',
  'android/app/src/main/res/values/strings.xml',
]

function walk(dir: string): string[] {
  // Tolerate a tree that is not present (e.g. a fresh clone without android/).
  if (!existsSync(join(root, dir))) return []
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
  it('keeps every Android source under the branded package', () => {
    // `npx cap add android` scaffolds com.getcapacitor.myapp; the app's own
    // sources (and the package its instrumented test asserts) must be the
    // branded applicationId, so a re-scaffold cannot silently reintroduce it.
    const files = ['android/app/src/main/java', 'android/app/src/androidTest', 'android/app/src/test'].flatMap(walk)
    const offenders = files.filter((file) =>
      readFileSync(join(root, file), 'utf8').includes(`${'com.getcapacitor'}.${'myapp'}`),
    )
    expect(offenders).toEqual([])
  })

  it('leaves no legacy brand identifier in source, config or CI', () => {
    const files = [...SCANNED_DIRS.flatMap(walk), ...SCANNED_FILES]
    const offenders = files.filter((file) => LEGACY.test(readFileSync(join(root, file), 'utf8')))
    expect(offenders).toEqual([])
  })
})

/**
 * The download page is the public entry point for the APK, so a stale version
 * or a broken mirror link there is worse than a broken build: users would
 * download an old binary that looks current. Assert it against BRAND instead
 * of trusting whoever bumps the release to remember.
 */
describe('download page', () => {
  const pagePath = join(root, 'download/index.html')

  it('exists with its icon asset', () => {
    expect(existsSync(pagePath)).toBe(true)
    expect(existsSync(join(root, 'download/app-icon.png'))).toBe(true)
  })

  it('advertises the release version from package.json', () => {
    expect(readFileSync(pagePath, 'utf8')).toContain(`v${BRAND.version}`)
  })

  it('links the signed APK on both channels for the current release', () => {
    const page = readFileSync(pagePath, 'utf8')
    expect(page).toContain(`${BRAND.releasesUrl}/latest/download/app-release.apk`)
    expect(page).toContain(
      `https://gitee.com/weinotes/${BRAND.slug}/releases/download/v${BRAND.version}/app-release.apk`,
    )
  })

  it('publishes a real SHA-256, not a placeholder', () => {
    const digest = /<code id="sha256">([0-9a-f]+)<\/code>/.exec(readFileSync(pagePath, 'utf8'))?.[1]
    expect(digest).toMatch(/^[0-9a-f]{64}$/)
  })
})

/**
 * The page is the public storefront for the APK. If its SEO sidecars go missing
 * the download still works but the page stops being discoverable, and a
 * canonical pointing at a host nobody serves is worse than no canonical at all.
 */
describe('download page SEO', () => {
  const pagePath = join(root, 'download/index.html')
  const page = readFileSync(pagePath, 'utf8')

  it('ships every sidecar at the site root', () => {
    for (const file of ['og-image.png', 'robots.txt', 'sitemap.xml']) {
      expect(existsSync(join(root, 'download', file)), file).toBe(true)
    }
  })

  it('points canonical, og:url and the sitemap at the same live origin', () => {
    const origin = 'https://auth.7xcircle.com'
    expect(page).toContain(`<link rel="canonical" href="${origin}/" />`)
    expect(page).toContain(`<meta property="og:url" content="${origin}/" />`)
    expect(page).toContain(`<meta property="og:image" content="${origin}/og-image.png" />`)
    expect(page).toContain('<meta name="twitter:card" content="summary_large_image" />')

    expect(readFileSync(join(root, 'download/sitemap.xml'), 'utf8')).toContain(
      `<loc>${origin}/</loc>`,
    )
    expect(readFileSync(join(root, 'download/robots.txt'), 'utf8')).toContain(
      `Sitemap: ${origin}/sitemap.xml`,
    )
  })

  it('emits JSON-LD that parses and agrees with the visible copy', () => {
    const marker = '<script type="application/ld+json">'
    const blocks = page
      .split(marker)
      .slice(1)
      .map((chunk) => JSON.parse(chunk.slice(0, chunk.indexOf('</script>'))) as Record<string, unknown>)
    expect(blocks.length).toBeGreaterThanOrEqual(3)

    // A release bump that forgets the structured data would otherwise silently
    // advertise an old version to search engines.
    const app = blocks.find((b) => b['@type'] === 'SoftwareApplication')
    expect(app?.softwareVersion).toBe(BRAND.version)

    // GEO only works when the machine-readable Q&A mirrors what a human reads.
    const faq = blocks.find((b) => b['@type'] === 'FAQPage') as
      | { mainEntity: { name: string }[] }
      | undefined
    const visible = page
      .split('<article class="faq-item">')
      .slice(1)
      .map((chunk) => chunk.slice(chunk.indexOf('<h3>') + 4, chunk.indexOf('</h3>')).trim())
    expect(visible.length).toBeGreaterThan(0)
    expect(faq?.mainEntity.map((q) => q.name)).toEqual(visible)
  })
})
