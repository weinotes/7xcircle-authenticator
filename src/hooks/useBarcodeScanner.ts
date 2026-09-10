/**
 * 7X Circle Authenticator — camera QR scanning bridge for otpauth:// enrolment
 *
 * @author Davey Wong <wgwcko@gmail.com>
 * @copyright 2026 Davey Wong <wgwcko@gmail.com> / 7X Circle
 * @license SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not
 * use this file except in compliance with the License. See LICENSE.
 */
import { useState, useCallback } from 'react'
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner'
import { Capacitor } from '@capacitor/core'
import { clearAutoLockSuppression, suppressAutoLock } from '../core/lock'

interface ScanResult {
  content: string
  format: string
}

export function useBarcodeScanner() {
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scan = useCallback(async (): Promise<ScanResult> => {
    if (!Capacitor.isNativePlatform()) {
      throw new Error('Barcode scanning is only available on native platforms')
    }

    try {
      setIsScanning(true)
      setError(null)
      // 相机是原生 Activity，会让 WebView 触发 visibilitychange。
      suppressAutoLock()

      const result = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
      })

      if (result.ScanResult) {
        return {
          content: result.ScanResult,
          format: String(result.format),
        }
      } else {
        throw new Error('No barcode content found')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Scan failed'
      setError(message)
      throw new Error(message)
    } finally {
      clearAutoLockSuppression()
      setIsScanning(false)
    }
  }, [])

  const isAvailable = Capacitor.isNativePlatform()

  return {
    scan,
    isScanning,
    error,
    isAvailable,
  }
}
