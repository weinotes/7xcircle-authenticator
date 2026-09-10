/**
 * 7X Circle Authenticator — vitest environment bootstrap
 *
 * @author Davey Wong <wgwcko@gmail.com>
 * @copyright 2026 Davey Wong <wgwcko@gmail.com> / 7X Circle
 * @license SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. See LICENSE.
 */
/**
 * Vitest environment bootstrap.
 *
 * Node 22+ defines an experimental global `localStorage` that is `undefined`
 * unless the process is started with `--localstorage-file`. Vitest's jsdom
 * environment does not overwrite globals that already exist, so that stub wins
 * over the jsdom `Storage` and `localStorage.clear()` throws "Cannot read
 * properties of undefined" — on Node 26 locally, while CI (Node 22) is green.
 *
 * Install a minimal in-memory Storage with the same contract when the global is
 * missing, so the suite behaves identically on every supported Node version.
 */
class MemoryStorage implements Storage {
  private readonly data = new Map<string, string>()

  get length(): number {
    return this.data.size
  }

  clear(): void {
    this.data.clear()
  }

  getItem(key: string): string | null {
    return this.data.has(key) ? (this.data.get(key) as string) : null
  }

  key(index: number): string | null {
    return Array.from(this.data.keys())[index] ?? null
  }

  removeItem(key: string): void {
    this.data.delete(key)
  }

  setItem(key: string, value: string): void {
    this.data.set(String(key), String(value))
  }
}

function install(target: object): void {
  const existing = (target as { localStorage?: Storage | undefined }).localStorage
  if (existing !== undefined && existing !== null) return
  Object.defineProperty(target, 'localStorage', {
    value: new MemoryStorage(),
    configurable: true,
    writable: true,
  })
}

install(globalThis)
if (typeof window !== 'undefined' && (window as object) !== globalThis) install(window)
