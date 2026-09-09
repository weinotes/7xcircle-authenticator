import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = resolve(process.cwd())

function sourceFiles(dir = 'src'): string[] {
  return readdirSync(join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    if (!/\.(ts|tsx)$/.test(entry.name) || /\.test\.(ts|tsx)$/.test(entry.name)) return []
    return [path]
  })
}

/**
 * "Offline only" is the central privacy promise of an authenticator, so it is
 * asserted instead of documented. The INTERNET permission stays in the manifest
 * only because the Android WebView needs it to load the bundled bundle.
 */
describe('offline guarantee', () => {
  it('never calls a network API from app code', () => {
    const forbidden = /\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon/
    const offenders = sourceFiles()
      .filter((file) => forbidden.test(readFileSync(join(root, file), 'utf8')))
    expect(offenders).toEqual([])
  })

  it('contains no remote http(s) endpoint', () => {
    const remote = /https?:\/\/(?!www\.w3\.org|localhost|127\.0\.0\.1)/
    // brand.ts holds the project's public URL as display metadata; it is never
    // used as a request target, so it is the one allowed exception.
    const offenders = sourceFiles()
      .filter((file) => file !== 'src/core/brand.ts')
      .filter((file) => remote.test(readFileSync(join(root, file), 'utf8')))
    expect(offenders).toEqual([])
  })
})
