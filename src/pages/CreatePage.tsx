import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import UploadZone from '../components/Upload/UploadZone'
import SuggestionGrid from '../components/Suggestions/SuggestionGrid'
import MemeEditor from '../components/Editor/MemeEditor'
import { useUpload } from '../hooks/useUpload'
import { useSuggestions } from '../hooks/useSuggestions'
import { renderMemeToBlob, postMemeToFeed } from '../lib/meme-export'
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
      const prompt = selectedTheme === 'custom' ? customPrompt.trim() : undefined
      suggest(result.imageUrl, result.imageId, selectedTheme, prompt)
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
      const blob = await renderMemeToBlob(uploadResult.displayUrl, selectedSuggestion.annotations || {})
      await postMemeToFeed(blob, uploadResult.imageUrl)
      navigate('/feed')
    } catch (e) {
      console.error('Post to feed failed:', e)
    } finally {
      setPosting(false)
    }
  }

  if (step === 'upload') {
    return <UploadStep
      selectedFile={selectedFile}
      previewUrl={previewUrl}
      selectedTheme={selectedTheme}
      customPrompt={customPrompt}
      uploading={uploading}
      uploadError={uploadError}
      onFileSelected={handleFileSelected}
      onClearFile={() => { setSelectedFile(null); setPreviewUrl(null) }}
      onThemeChange={setSelectedTheme}
      onCustomPromptChange={setCustomPrompt}
      onGenerate={handleGenerate}
    />
  }

  if (step === 'suggesting') {
    return <SuggestingStep
      error={suggestError}
      onRetry={() => {
        if (!uploadResult) return
        const prompt = selectedTheme === 'custom' ? customPrompt.trim() : undefined
        retry(uploadResult.imageUrl, uploadResult.imageId, selectedTheme, prompt)
      }}
    />
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
                Edit
              </button>
              <button
                onClick={handlePostToFeed}
                disabled={posting}
                className="flex-1 px-4 py-3 border border-acid text-acid font-bold rounded text-sm uppercase tracking-wide hover:bg-acid hover:text-ink transition-colors disabled:opacity-50"
              >
                {posting ? 'Posting...' : 'Post to Feed'}
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

function UploadStep({ selectedFile, previewUrl, selectedTheme, customPrompt, uploading, uploadError, onFileSelected, onClearFile, onThemeChange, onCustomPromptChange, onGenerate }: {
  selectedFile: Blob | null
  previewUrl: string | null
  selectedTheme: string
  customPrompt: string
  uploading: boolean
  uploadError: string | null
  onFileSelected: (file: Blob) => void
  onClearFile: () => void
  onThemeChange: (id: string) => void
  onCustomPromptChange: (v: string) => void
  onGenerate: () => void
}) {
  return (
    <div className="flex flex-col items-center min-h-dvh p-6 pt-16">
      <h1 className="text-5xl font-black tracking-tight mb-2">
        Magic<span className="text-acid">thon</span>
      </h1>
      <p className="mb-6 text-paper/70 text-center max-w-sm">
        Upload a photo and get AI-generated memes instantly.
      </p>

      {!selectedFile ? (
        <UploadZone onFile={onFileSelected} uploading={false} />
      ) : (
        <div className="w-full max-w-lg">
          <div className="relative mb-4">
            <img src={previewUrl!} alt="Selected" className="w-full rounded-lg aspect-video object-cover" />
            <button
              onClick={onClearFile}
              className="absolute top-2 right-2 w-8 h-8 bg-ink/80 rounded-full flex items-center justify-center text-paper/80 hover:text-paper"
            >
              ✕
            </button>
          </div>

          <ThemeSelector
            selectedTheme={selectedTheme}
            customPrompt={customPrompt}
            onThemeChange={onThemeChange}
            onCustomPromptChange={onCustomPromptChange}
          />

          <button
            onClick={onGenerate}
            disabled={uploading || (selectedTheme === 'custom' && !customPrompt.trim())}
            className="w-full py-3 bg-acid text-ink font-bold rounded text-sm uppercase tracking-wide disabled:opacity-50"
          >
            {uploading ? 'Generating...' : 'Generate Meme'}
          </button>
        </div>
      )}

      {uploadError && <p className="mt-4 text-red-400 text-sm">{uploadError}</p>}
    </div>
  )
}

function ThemeSelector({ selectedTheme, customPrompt, onThemeChange, onCustomPromptChange }: {
  selectedTheme: string
  customPrompt: string
  onThemeChange: (id: string) => void
  onCustomPromptChange: (v: string) => void
}) {
  return (
    <>
      <div className="mb-4">
        <p className="text-sm text-paper/60 mb-2">Choose a meme style:</p>
        <div className="grid grid-cols-2 gap-2">
          {MEME_THEMES.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
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
            onChange={(e) => onCustomPromptChange(e.target.value)}
            placeholder="Describe the humor style you want... e.g. 'Make it a Gordon Ramsay roast' or 'Anime protagonist inner monologue'"
            className="w-full p-3 rounded-lg border border-paper/20 bg-paper/5 text-paper placeholder:text-paper/40 text-sm resize-none focus:outline-none focus:border-acid"
            rows={3}
          />
        </div>
      )}
    </>
  )
}

function SuggestingStep({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-dvh p-6">
      <div className="w-10 h-10 border-3 border-acid border-t-transparent rounded-full animate-spin" />
      <p className="mt-4 text-paper/70">Generating meme suggestions...</p>
      <p className="mt-2 text-sm text-paper/40">Analyzing your photo with AI</p>
      {error && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={onRetry} className="px-4 py-2 bg-acid text-ink rounded font-bold text-sm">
            Try Again
          </button>
        </div>
      )}
    </div>
  )
}
