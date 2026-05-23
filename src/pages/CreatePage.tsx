import { useState, useEffect } from 'react'
import UploadZone from '../components/Upload/UploadZone'
import SuggestionGrid from '../components/Suggestions/SuggestionGrid'
import MemeEditor from '../components/Editor/MemeEditor'
import { useUpload } from '../hooks/useUpload'
import { useSuggestions } from '../hooks/useSuggestions'
import type { MemeSuggestion } from '../../shared/types'

type Step = 'upload' | 'suggesting' | 'pick' | 'edit'

export default function CreatePage() {
  const { upload, uploading, error: uploadError, result: uploadResult } = useUpload()
  const { suggest, error: suggestError, data: suggestData, retry } = useSuggestions()
  const [step, setStep] = useState<Step>('upload')
  const [selectedId, setSelectedId] = useState<string | null>(null)

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
            <button
              onClick={() => setStep('edit')}
              className="w-full max-w-md mx-auto block px-6 py-3 bg-acid text-ink font-bold rounded text-sm uppercase tracking-wide"
            >
              Edit This Meme →
            </button>
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
