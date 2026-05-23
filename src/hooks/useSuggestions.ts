import { useState, useCallback } from 'react'
import type { MemeSuggestion } from '../../shared/types'

interface SuggestionsResult {
  suggestions: MemeSuggestion[]
  imageDescription: string
}

export function useSuggestions() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<SuggestionsResult | null>(null)

  const suggest = useCallback(async (imageUrl: string, imageId: string, theme?: string, customPrompt?: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl, imageId, theme, customPrompt }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(err.error || `Request failed (${res.status})`)
      }

      const result: SuggestionsResult = await res.json()
      console.log('=== AI Suggest Response ===')
      console.log(JSON.stringify(result, null, 2))
      setData(result)
      return result
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to get suggestions'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const retry = useCallback((imageUrl: string, imageId: string, theme?: string, customPrompt?: string) => {
    return suggest(imageUrl, imageId, theme, customPrompt)
  }, [suggest])

  return { suggest, loading, error, data, retry }
}
