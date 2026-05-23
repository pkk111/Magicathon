import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import UploadZone from '../components/Upload/UploadZone'
import SuggestionGrid from '../components/Suggestions/SuggestionGrid'
import MemeEditor from '../components/Editor/MemeEditor'
import { useUpload } from '../hooks/useUpload'
import { useSuggestions } from '../hooks/useSuggestions'
import { getSessionId } from '../lib/session'
import { MEME_THEMES } from '../lib/themes'
import type { MemeSuggestion } from '../../shared/types'

type Step = 'upload' | 'suggesting' | 'pick' | 'edit'

export default function CreatePage() {
  const navigate = useNavigate()
  const { upload, uploading, error: uploadError, result: uploadResult } = useUpload()
  const { suggest, error: suggestError, data: suggestData, retry } = useSuggestions()
  const [step, setStep] = useState<Step>('upload')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState(MEME_THEMES[0]!.id)
  const [customPrompt, setCustomPrompt] = useState('')
  const [selectedFile, setSelectedFile] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileSelected = (file: Blob) => {
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleGenerate = async () => {
    if (!selectedFile) return
    if (selectedTheme === 'custom' && !customPrompt.trim()) return
    const result = await upload(selectedFile)
    if (result) {
      setStep('suggesting')
      suggest(result.imageUrl, result.imageId, selectedTheme, selectedTheme === 'custom' ? customPrompt.trim() : undefined)
    }
  }

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
      <div className="flex flex-col items-center min-h-dvh p-6 pt-16">
        <h1 className="text-5xl font-black tracking-tight mb-2">
          Magic<span className="text-acid">thon</span>
        </h1>
        <p className="mb-6 text-paper/70 text-center max-w-sm">
          Upload a photo and get AI-generated memes instantly.
        </p>

        {!selectedFile ? (
          <UploadZone onFile={handleFileSelected} uploading={false} />
        ) : (
          <div className="w-full max-w-lg">
            <div className="relative mb-4">
              <img
                src={previewUrl!}
                alt="Selected"
                className="w-full rounded-lg aspect-video object-cover"
              />
              <button
                onClick={() => { setSelectedFile(null); setPreviewUrl(null) }}
                className="absolute top-2 right-2 w-8 h-8 bg-ink/80 rounded-full flex items-center justify-center text-paper/80 hover:text-paper"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-paper/60 mb-2">Choose a meme style:</p>
              <div className="grid grid-cols-2 gap-2">
                {MEME_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`p-3 rounded-lg border text-left transition-all ${
                      selectedTheme === theme.id
                        ? 'border-acid bg-acid/10'
                        : 'border-paper/15 hover:border-paper/40'
                    }`}
                  >
                    <span className="text-lg">{theme.emoji}</span>
                    <span className="ml-2 text-sm font-medium">{theme.name}</span>
                    <p className="text-xs text-paper/50 mt-1">{theme.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {selectedTheme === 'custom' && (
              <div className="mb-4">
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Describe the humor style you want... e.g. 'Make it a Gordon Ramsay roast' or 'Anime protagonist inner monologue'"
                  className="w-full p-3 rounded-lg border border-paper/20 bg-paper/5 text-paper placeholder:text-paper/40 text-sm resize-none focus:outline-none focus:border-acid"
                  rows={3}
                />
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={uploading || (selectedTheme === 'custom' && !customPrompt.trim())}
              className="w-full py-3 bg-acid text-ink font-bold rounded text-sm uppercase tracking-wide disabled:opacity-50"
            >
              {uploading ? '⏳ Generating...' : '✨ Generate Meme'}
            </button>
          </div>
        )}

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
              onClick={() => uploadResult && retry(uploadResult.imageUrl, uploadResult.imageId, selectedTheme, selectedTheme === 'custom' ? customPrompt.trim() : undefined)}
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
