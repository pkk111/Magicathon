import { useState, useCallback } from 'react'

export interface GenerateResult {
  generatedImageUrl: string
  displayUrl: string
}

const PARALLEL_COUNT = 6

export function useGenerate() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<GenerateResult[]>([])

  const generate = useCallback(async (imageUrl: string, prompt: string) => {
    setLoading(true)
    setError(null)
    setResults([])
    try {
      const requests = Array.from({ length: PARALLEL_COUNT }, () =>
        fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl, prompt }),
        }).then(async (res) => {
          if (!res.ok) return null
          return res.json() as Promise<GenerateResult>
        }).catch(() => null)
      )

      const responses = await Promise.all(requests)
      const valid = responses.filter((r): r is GenerateResult => r !== null)

      if (valid.length === 0) {
        throw new Error('All image generations failed')
      }

      setResults(valid)
      return valid
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to generate images'
      setError(msg)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setResults([])
    setError(null)
  }, [])

  return { generate, loading, error, results, reset }
}
