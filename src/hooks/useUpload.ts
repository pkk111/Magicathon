import { useState, useCallback } from 'react'
import { reformatImage } from '../lib/image'
import { uploadImage, type UploadResult } from '../lib/api'

export function useUpload() {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)

  const upload = useCallback(async (file: Blob) => {
    setUploading(true)
    setError(null)
    try {
      const reformatted = await reformatImage(file)
      const data = await uploadImage(reformatted)
      setResult(data)
      return data
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed'
      setError(msg)
      return null
    } finally {
      setUploading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return { upload, uploading, error, result, reset }
}
