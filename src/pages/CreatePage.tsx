import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import UploadZone from '../components/Upload/UploadZone'
import SuggestionGrid from '../components/Suggestions/SuggestionGrid'
import MemeEditor from '../components/Editor/MemeEditor'
import { useUpload } from '../hooks/useUpload'
import { useSuggestions } from '../hooks/useSuggestions'
import { getSessionId } from '../lib/session'
import type { MemeSuggestion } from '../../shared/types'

type Step = 'upload' | 'suggesting' | 'pick' | 'edit'

export default function CreatePage() {
  const navigate = useNavigate()
  const { upload, uploading, error: uploadError, result: uploadResult } = useUpload()
  const { suggest, error: suggestError, data: suggestData, retry } = useSuggestions()
  const [step, setStep] = useState<Step>('upload')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    if (uploadResult && step === 'upload') {
      setStep('suggesting')
      suggest(uploadResult.imageUrl, uploadResult.imageId)
    }
  }, [uploadResult, step, suggest])

  useEffect(() => {
    if (suggestData && step === 'suggesting') {
      setStep('pick')
    }
  }, [suggestData, step])

  const selectedSuggestion: MemeSuggestion | undefined =
    suggestData?.suggestions.find(s => s.id === selectedId)

  const handlePostToFeed = async () => {
    if (!selectedSuggestion || !uploadResult || posting) return
    setPosting(true)

    try {
      // Render the suggestion onto a canvas
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.src = uploadResult.displayUrl
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject })

      const canvas = document.createElement('canvas')
      canvas.width = 1920
      canvas.height = 1080
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, 1920, 1080)

      // Draw text annotations
      const annotations = Object.values(selectedSuggestion.annotations || {})
      for (const ann of annotations) {
        const fontSize = ann.fontSize || 56
        ctx.font = `bold ${fontSize}px Impact, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillStyle = ann.fill || '#FFFFFF'
        ctx.strokeStyle = ann.stroke || '#000000'
        ctx.lineWidth = ann.strokeWidth || 3
        ctx.lineJoin = 'round'
        const x = ann.x
        const y = ann.y + fontSize
        ctx.strokeText(ann.text, x, y)
        ctx.fillText(ann.text, x, y)
      }

      // Export canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Export failed')), 'image/png')
      })

      // Upload to memes/ folder
      const formData = new FormData()
      formData.append('image', blob, 'meme.png')
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'x-upload-type': 'meme' },
        body: formData,
      })
      if (!uploadRes.ok) throw new Error('Upload failed')
      const { imageUrl: exportedPngUrl } = await uploadRes.json()

      // Save to DB
      const sessionId = getSessionId()
      const memeRes = await fetch('/api/meme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: uploadResult.imageUrl, exportedPngUrl, textFields: [], sessionId }),
      })
      if (!memeRes.ok) throw new Error('Save failed')

      navigate('/feed')
    } catch (e) {
      console.error('Post to feed failed:', e)
    } finally {
      setPosting(false)
    }
  }

  if (step === 'upload') {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh p-6">
        <h1 className="text-5xl font-black tracking-tight mb-2">
          Magic<span className="text-acid">thon</span>
        </h1>
        <p className="mb-8 text-paper/70 text-center max-w-sm">
          Upload a photo and get 6 AI-generated memes instantly.
        </p>
        <UploadZone onFile={upload} uploading={uploading} />
        {uploadError && <p className="mt-4 text-red-400 text-sm">{uploadError}</p>}
      </div>
    )
  }

  if (step === 'suggesting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh p-6">
        <div className="w-10 h-10 border-3 border-acid border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-paper/70">Generating meme suggestions...</p>
        <p className="mt-2 text-sm text-paper/40">Analyzing your photo with AI</p>
        {suggestError && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-red-400 text-sm">{suggestError}</p>
            <button
              onClick={() => uploadResult && retry(uploadResult.imageUrl, uploadResult.imageId)}
              className="px-4 py-2 bg-acid text-ink rounded font-bold text-sm"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    )
  }

  if (step === 'pick' && suggestData && uploadResult) {
    return (
      <div className="min-h-dvh py-8 pt-16">
        <div className="text-center mb-6 px-4">
          <h2 className="text-2xl font-bold">Pick your meme</h2>
          <p className="text-paper/60 text-sm mt-1">Tap one to select, then edit it</p>
        </div>

        <SuggestionGrid
          suggestions={suggestData.suggestions}
          imageUrl={uploadResult.displayUrl}
          selectedId={selectedId}
          onSelect={setSelectedId}
        />

        {selectedId && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-ink/90 backdrop-blur border-t border-paper/10">
            <div className="max-w-md mx-auto flex gap-3">
              <button
                onClick={() => setStep('edit')}
                className="flex-1 px-4 py-3 bg-acid text-ink font-bold rounded text-sm uppercase tracking-wide"
              >
                Edit →
              </button>
              <button
                onClick={handlePostToFeed}
                disabled={posting}
                className="flex-1 px-4 py-3 border border-acid text-acid font-bold rounded text-sm uppercase tracking-wide hover:bg-acid hover:text-ink transition-colors disabled:opacity-50"
              >
                {posting ? '⏳ Posting...' : '🚀 Post to Feed'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (step === 'edit' && selectedSuggestion && uploadResult) {
    return (
      <MemeEditor
        imageUrl={uploadResult.displayUrl}
        suggestion={selectedSuggestion}
        onClose={() => setStep('pick')}
      />
    )
  }

  return null
}
