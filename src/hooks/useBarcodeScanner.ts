import { useState, useCallback } from 'react'
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner'
import { Capacitor } from '@capacitor/core'

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
