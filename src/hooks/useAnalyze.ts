import { useState, useCallback } from 'react'

export interface PromptSuggestion {
  summary: string
  prompt: string
  textPrompt: string
}

export function useAnalyze() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<PromptSuggestion[] | null>(null)

  const analyze = useCallback(async (imageUrl: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Analysis failed' }))
        throw new Error(err.error || 'Analysis failed')
      }
      const data = await res.json()
      setSuggestions(data.suggestions)
      return data.suggestions as PromptSuggestion[]
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to analyze image'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setSuggestions(null)
    setError(null)
  }, [])

  return { analyze, loading, error, suggestions, reset }
}
