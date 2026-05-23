import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import UploadZone from '../components/Upload/UploadZone'
import SuggestionGrid from '../components/Suggestions/SuggestionGrid'
import MemeEditor from '../components/Editor/MemeEditor'
import { useUpload } from '../hooks/useUpload'
import { useAnalyze, type PromptSuggestion } from '../hooks/useAnalyze'
import { useGenerate, type GenerateResult } from '../hooks/useGenerate'
import { useSuggestions } from '../hooks/useSuggestions'
import { renderMemeToBlob, postMemeToFeed } from '../lib/meme-export'
import type { MemeSuggestion } from '../../shared/types'

type Step = 'upload' | 'analyzing' | 'choose-prompt' | 'generating' | 'choose-image' | 'suggesting' | 'pick' | 'edit'

export default function CreatePage() {
  const navigate = useNavigate()
  const { upload, uploading, error: uploadError, result: uploadResult } = useUpload()
  const { analyze, error: analyzeError, suggestions: promptSuggestions } = useAnalyze()
  const { generate, error: generateError, results: generateResults } = useGenerate()
  const [chosenImage, setChosenImage] = useState<GenerateResult | null>(null)
  const { suggest, error: suggestError, data: suggestData, retry } = useSuggestions()
  const [step, setStep] = useState<Step>('upload')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [chosenPrompt, setChosenPrompt] = useState('')
  const [chosenTextPrompt, setChosenTextPrompt] = useState('')
  const [selectedFile, setSelectedFile] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileSelected = (file: Blob) => {
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return
    const result = await upload(selectedFile)
    if (result) {
      setStep('analyzing')
      analyze(result.imageUrl)
    }
  }

  useEffect(() => {
    if (promptSuggestions && step === 'analyzing') {
      setStep('choose-prompt')
    }
  }, [promptSuggestions, step])

  const handlePromptSelected = (suggestion: PromptSuggestion) => {
    if (!uploadResult) return
    setChosenPrompt(suggestion.prompt)
    setChosenTextPrompt(suggestion.textPrompt)
    setStep('generating')
    generate(uploadResult.imageUrl, suggestion.prompt)
  }

  const handleCustomPrompt = (prompt: string) => {
    if (!uploadResult || !prompt.trim()) return
    setChosenPrompt(prompt.trim())
    setChosenTextPrompt(prompt.trim())
    setStep('generating')
    generate(uploadResult.imageUrl, prompt.trim())
  }

  // Once images are generated, let user pick one
  useEffect(() => {
    if (generateResults.length > 0 && step === 'generating') {
      if (generateResults.length === 1) {
        setChosenImage(generateResults[0]!)
        setStep('suggesting')
        suggest(generateResults[0]!.generatedImageUrl, '', 'custom', chosenTextPrompt)
      } else {
        setStep('choose-image')
      }
    }
  }, [generateResults])

  const handleImageSelected = (img: GenerateResult) => {
    setChosenImage(img)
    setStep('suggesting')
    suggest(img.generatedImageUrl, '', 'custom', chosenTextPrompt)
  }

  useEffect(() => {
    if (suggestData && step === 'suggesting') {
      setStep('pick')
    }
  }, [suggestData, step])

  const selectedSuggestion: MemeSuggestion | undefined =
    suggestData?.suggestions.find(s => s.id === selectedId)

  // Use the chosen generated image for display/export
  const memeImageUrl = chosenImage?.displayUrl || uploadResult?.displayUrl
  const memeSourceUrl = chosenImage?.generatedImageUrl || uploadResult?.imageUrl

  const handlePostToFeed = async () => {
    if (!selectedSuggestion || !memeImageUrl || !memeSourceUrl || posting) return
    setPosting(true)
    try {
      const blob = await renderMemeToBlob(memeImageUrl, selectedSuggestion.annotations || {})
      await postMemeToFeed(blob, memeSourceUrl)
      navigate('/feed')
    } catch (e) {
      console.error('Post to feed failed:', e)
    } finally {
      setPosting(false)
    }
  }

  if (step === 'upload') {
    return (
      <div className="min-h-dvh pt-14">
        {/* Hero Banner */}
        <div className="relative w-full h-48 md:h-64 overflow-hidden">
          <img
            src="/hero-banner.png"
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink" />
        </div>

        <div className="flex flex-col items-center px-6 -mt-8 relative z-10">
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2 text-center">
            Turn any moment<br />
            <span className="text-acid">into comedy</span>
          </h1>
          <p className="mb-8 text-paper/60 text-center max-w-md">
            Upload a photo, add your twist, and let AI cook up the laughs.
          </p>

          {!selectedFile ? (
            <UploadZone onFile={handleFileSelected} uploading={false} />
          ) : (
            <div className="w-full max-w-lg">
              <div className="relative mb-5 rounded-xl overflow-hidden border border-white/10">
                <img src={previewUrl!} alt="Selected" className="w-full aspect-video object-cover" />
                <button
                  onClick={() => { setSelectedFile(null); setPreviewUrl(null) }}
                  className="absolute top-3 right-3 w-9 h-9 bg-ink/80 backdrop-blur rounded-full flex items-center justify-center text-paper/80 hover:text-paper transition-colors"
                >
                  ✕
                </button>
              </div>

              <button
                onClick={handleUploadAndAnalyze}
                disabled={uploading}
                className="w-full py-3.5 bg-acid text-ink font-bold rounded-xl text-sm uppercase tracking-wide disabled:opacity-50 hover:brightness-110 transition-all shadow-lg shadow-acid/20"
              >
                {uploading ? 'Uploading...' : 'Suggest Meme Ideas'}
              </button>
            </div>
          )}

          {uploadError && <p className="mt-4 text-red-400 text-sm">{uploadError}</p>}
        </div>
      </div>
    )
  }

  if (step === 'analyzing') {
    return (
      <AnalyzingStep
        error={analyzeError}
        onRetry={() => uploadResult && analyze(uploadResult.imageUrl)}
      />
    )
  }

  if (step === 'choose-prompt' && promptSuggestions) {
    return (
      <PromptPicker
        previewUrl={previewUrl}
        suggestions={promptSuggestions}
        onSelect={handlePromptSelected}
        onCustom={handleCustomPrompt}
        onBack={() => setStep('upload')}
      />
    )
  }

  if (step === 'generating') {
    return (
      <GeneratingStep
        error={generateError}
        onRetry={() => uploadResult && generate(uploadResult.imageUrl, chosenPrompt)}
      />
    )
  }

  if (step === 'choose-image' && generateResults.length > 0) {
    return (
      <div className="relative min-h-dvh pt-16 pb-10 px-6 overflow-hidden">
        <img src="/analyzing-bg.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-ink/60" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">Choose your meme image</h2>
          <p className="text-paper/50 text-sm text-center mb-6">We generated {generateResults.length} variations — pick your favorite</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {generateResults.map((img, i) => (
              <button
                key={i}
                onClick={() => handleImageSelected(img)}
                className="rounded-xl overflow-hidden border-2 border-white/10 hover:border-acid transition-all hover:scale-[1.02]"
              >
                <img src={img.displayUrl} alt={`Variation ${i + 1}`} className="w-full aspect-video object-cover" />
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep('choose-prompt')}
            className="mt-6 text-paper/50 text-sm hover:text-acid transition-colors block mx-auto"
          >
            ← Try a different style
          </button>
        </div>
      </div>
    )
  }

  if (step === 'suggesting') {
    return (
      <div className="relative flex flex-col items-center justify-center min-h-dvh p-6 overflow-hidden">
        <img src="/analyzing-bg.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-ink/40" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 border-3 border-acid border-t-transparent rounded-full animate-spin" />
          <p className="mt-5 text-paper font-bold text-lg">Adding meme text...</p>
          <p className="mt-2 text-sm text-paper/50">Crafting the perfect caption</p>
          {suggestError && (
            <div className="mt-6 flex flex-col items-center gap-3">
              <p className="text-red-400 text-sm">{suggestError}</p>
              <button
                onClick={() => chosenImage && retry(chosenImage.generatedImageUrl, '', 'custom', chosenTextPrompt)}
                className="px-4 py-2 bg-acid text-ink rounded-xl font-bold text-sm"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (step === 'pick' && suggestData && memeImageUrl) {
    return (
      <div className="relative min-h-dvh py-8 pt-16 overflow-hidden">
        <img src="/analyzing-bg.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-ink/60" />
        <div className="relative z-10">
          <div className="text-center mb-6 px-4">
            <h2 className="text-2xl font-bold">Pick your meme</h2>
            <p className="text-paper/50 text-sm mt-1">Tap one to select, then edit or post it</p>
          </div>

          <SuggestionGrid
            suggestions={suggestData.suggestions}
            imageUrl={memeImageUrl}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>

        {selectedId && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-ink/95 backdrop-blur-md border-t border-white/5 z-20">
            <div className="max-w-md mx-auto flex gap-3">
              <button
                onClick={() => setStep('edit')}
                className="flex-1 px-4 py-3.5 bg-acid text-ink font-bold rounded-xl text-sm uppercase tracking-wide hover:brightness-110 transition-all"
              >
                Edit
              </button>
              <button
                onClick={handlePostToFeed}
                disabled={posting}
                className="flex-1 px-4 py-3.5 border border-acid text-acid font-bold rounded-xl text-sm uppercase tracking-wide hover:bg-acid hover:text-ink transition-all disabled:opacity-50"
              >
                {posting ? 'Posting...' : 'Post to Feed'}
              </button>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (step === 'edit' && selectedSuggestion && memeImageUrl) {
    return (
      <MemeEditor
        imageUrl={memeImageUrl}
        suggestion={selectedSuggestion}
        onClose={() => setStep('pick')}
      />
    )
  }

  return null
}

const ANALYZING_MESSAGES = [
  'Scanning for meme potential...',
  'Detecting facial expressions...',
  'Cross-referencing with 10,000 meme templates...',
  'Evaluating sarcasm levels...',
  'Checking for unintentional comedy...',
  'Measuring chaos energy in the frame...',
  'Consulting the meme council...',
  'Running vibe check algorithm...',
  'Calculating roast intensity...',
  'Mapping awkward energy zones...',
  'Identifying main character syndrome...',
  'Analyzing background plot twists...',
  'Detecting "this is fine" energy...',
  'Scanning for hidden cringe...',
  'Measuring the audacity levels...',
  'Checking internet culture database...',
  'Evaluating "tell me without telling me" potential...',
  'Running disappointment detection...',
  'Scanning for dramatic irony...',
  'Calculating emotional damage score...',
  'Detecting "nobody asked" energy...',
  'Measuring delulu concentration...',
  'Analyzing existential dread quotient...',
  'Checking for "caught in 4K" moments...',
  'Running "it be like that" classifier...',
  'Detecting overconfidence markers...',
  'Scanning for "before disaster" potential...',
  'Evaluating "things that aged badly" factor...',
  'Measuring relatability index...',
  'Calculating betrayal probability...',
  'Detecting "this meeting could have been an email" energy...',
  'Scanning for unhinged behavior...',
  'Measuring side-eye intensity...',
  'Running "the lion, the witch, and the audacity" filter...',
  'Detecting "is this a pigeon" confusion levels...',
  'Analyzing "we have X at home" potential...',
  'Checking gaslighting compatibility...',
  'Measuring procrastination energy...',
  'Calculating "how it started vs how it\'s going" gap...',
  'Detecting "not my circus, not my monkeys" vibes...',
  'Scanning for "I pretend I do not see it" energy...',
  'Evaluating clown makeup application rate...',
  'Running unread message guilt analysis...',
  'Checking for passive-aggressive aura...',
  'Measuring "I\'m in this photo and I don\'t like it" score...',
  'Detecting internal screaming levels...',
  'Analyzing "did I stutter" energy...',
  'Calculating "and I took that personally" threshold...',
  'Scanning for "suffering from success" indicators...',
  'Detecting "mission failed successfully" scenarios...',
  'Running "task failed spectacularly" check...',
  'Measuring "understandable, have a great day" energy...',
  'Analyzing "anyway, so I started blasting" potential...',
  'Checking if subjects are "living their best life" or lying...',
  'Detecting "it\'s giving" classification...',
  'Running "no thoughts, head empty" scan...',
  'Measuring "rent free" occupancy levels...',
  'Evaluating "core memory unlocked" probability...',
  'Detecting toxic positivity residue...',
  'Scanning for "be normal" impossibility...',
  'Analyzing "touch grass" deficiency...',
  'Calculating "least unhinged" rankings...',
  'Checking if image radiates "pick me" energy...',
  'Measuring "that\'s not a flex" factor...',
  'Detecting main character delusion levels...',
  'Running "the math ain\'t mathing" check...',
  'Scanning for "tell your story walking" energy...',
  'Evaluating "skill issue" diagnosis...',
  'Calculating "L + ratio" potential...',
  'Detecting "this is why we can\'t have nice things" energy...',
  'Measuring "I fear no man, but that thing..." factor...',
  'Analyzing "perfectly cut scream" energy...',
  'Running "call an ambulance, but not for me" scan...',
  'Detecting "money printer go brrr" vibes...',
  'Checking for "it just works" confidence levels...',
  'Measuring "but at what cost" regret index...',
  'Scanning for "always has been" revelation moments...',
  'Evaluating "first time?" energy...',
  'Detecting "visible confusion" markers...',
  'Running "modern problems require modern solutions" analysis...',
  'Calculating "stonks" trajectory...',
  'Measuring "this sparks joy / this does not" polarity...',
  'Detecting "surprised Pikachu" potential...',
  'Analyzing "guess I\'ll die" resignation levels...',
  'Scanning for "look what they did to my boy" grief...',
  'Checking "why are you booing me, I\'m right" energy...',
  'Evaluating "it\'s free real estate" opportunity...',
  'Measuring "panik / kalm / panik" oscillation...',
  'Detecting "business is boomin" indicators...',
  'Running "improvise, adapt, overcome" analysis...',
  'Calculating "we live in a society" commentary depth...',
  'Scanning for "every day we stray further" evidence...',
  'Detecting "bold of you to assume" arrogance levels...',
  'Measuring "are you winning, son?" expectations gap...',
  'Evaluating "this is the way" conformity...',
  'Analyzing "one does not simply" impossibility factor...',
  'Checking for "perfectly balanced, as all things should be" equilibrium...',
  'Detecting "I see this as an absolute win" optimism...',
  'Running final humor computation...',
  'Almost done generating galaxy-brain ideas...',
  'Wrapping up the meme analysis...',
]

function AnalyzingStep({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  const [messageIndex, setMessageIndex] = useState(() => Math.floor(Math.random() * ANALYZING_MESSAGES.length))
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(Math.floor(Math.random() * ANALYZING_MESSAGES.length))
    }, 2000)
    const timeout = setTimeout(() => setTimedOut(true), 30000)
    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [])

  return (
    <div className="relative flex flex-col items-center justify-center min-h-dvh p-6 overflow-hidden">
      <img src="/analyzing-bg.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-ink/40" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-12 h-12 border-3 border-acid border-t-transparent rounded-full animate-spin" />
        <p className="mt-5 text-paper font-bold text-lg">Suggesting meme ideas...</p>
        <p className="mt-1 text-xs text-paper/50">This step could take a while</p>
        <p className="mt-3 text-sm text-paper/60 text-center max-w-xs transition-opacity duration-300">
          {ANALYZING_MESSAGES[messageIndex]}
        </p>
        {(error || timedOut) && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-red-400 text-sm">{timedOut ? 'Taking too long — try again' : error}</p>
            <button onClick={onRetry} className="px-4 py-2 bg-acid text-ink rounded-xl font-bold text-sm">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

const GENERATING_MESSAGES = [
  'Reimagining your photo as a meme...',
  'Teaching AI the art of comedy...',
  'Applying meme magic to your image...',
  'Making your photo Internet-famous...',
  'Infusing maximum humor potential...',
  'Warping reality for comedic effect...',
  'Consulting with meme lords...',
  'Bending pixels to our will...',
  'Adding the perfect amount of chaos...',
  'Making the Internet jealous...',
  'Rendering your masterpiece...',
  'Channeling pure meme energy...',
  'Almost there, this is going to be good...',
  'AI is having too much fun with this...',
  'Crafting digital comedy gold...',
  'Photoshopping with AI precision...',
  'Turning ordinary into extraordinary...',
  'Generating something legendary...',
  'Making pixels do funny things...',
  'The AI is giggling internally...',
]

function GeneratingStep({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  const [messageIndex, setMessageIndex] = useState(() => Math.floor(Math.random() * GENERATING_MESSAGES.length))

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex(Math.floor(Math.random() * GENERATING_MESSAGES.length))
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="relative flex flex-col items-center justify-center min-h-dvh p-6 overflow-hidden">
      <img src="/analyzing-bg.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-ink/40" />
      <div className="relative z-10 flex flex-col items-center">
        <div className="w-12 h-12 border-3 border-acid border-t-transparent rounded-full animate-spin" />
        <p className="mt-5 text-paper font-bold text-lg">Generating your meme image...</p>
        <p className="mt-3 text-sm text-paper/60 text-center max-w-xs transition-opacity duration-300">
          {GENERATING_MESSAGES[messageIndex]}
        </p>
        {error && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <p className="text-red-400 text-sm">{error}</p>
            <button onClick={onRetry} className="px-4 py-2 bg-acid text-ink rounded-xl font-bold text-sm">
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function PromptPicker({ previewUrl, suggestions, onSelect, onCustom, onBack }: {
  previewUrl: string | null
  suggestions: PromptSuggestion[]
  onSelect: (s: PromptSuggestion) => void
  onCustom: (prompt: string) => void
  onBack: () => void
}) {
  const [customInput, setCustomInput] = useState('')
  const [showCustom, setShowCustom] = useState(false)

  return (
    <div className="relative min-h-dvh pt-14 px-6 pb-10 overflow-hidden">
      <img src="/analyzing-bg.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-ink/60" />
      <div className="relative z-10 max-w-lg mx-auto pt-8">
        <button onClick={onBack} className="text-paper/50 text-sm mb-6 hover:text-acid transition-colors">
          ← Change image
        </button>

        {/* Image on top */}
        {previewUrl && (
          <div className="rounded-xl overflow-hidden border border-white/10 mb-6">
            <img src={previewUrl} alt="Your photo" className="w-full aspect-video object-cover" />
          </div>
        )}

        {/* Suggestions below */}
        <h2 className="text-2xl font-bold mb-1">Choose a meme style</h2>
        <p className="text-paper/50 text-sm mb-5">AI analyzed your photo. Pick a direction:</p>

        <div className="grid grid-cols-2 gap-2 mb-5">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => onSelect(s)}
              className="group p-3 rounded-xl border border-white/10 bg-ink-card hover:border-acid/50 hover:bg-acid/5 transition-all text-left"
              title={s.prompt}
            >
              <p className="text-base font-semibold text-paper/90 group-hover:text-acid transition-colors">{s.summary}</p>
            </button>
          ))}
        </div>

        <div className="border-t border-white/5 pt-4">
          {!showCustom ? (
            <button
              onClick={() => setShowCustom(true)}
              className="w-full p-3 rounded-xl border border-dashed border-white/15 text-sm text-paper/40 hover:border-acid/40 hover:text-acid/70 transition-all text-center"
            >
              + Define your own meme style
            </button>
          ) : (
            <div className="flex gap-2">
              <textarea
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder="e.g. 'Make it a Gordon Ramsay roast'"
                className="flex-1 p-3 rounded-xl border border-white/10 bg-ink-card text-paper placeholder:text-paper/30 text-sm resize-none focus:outline-none focus:border-acid/50"
                rows={2}
                autoFocus
              />
              <button
                onClick={() => onCustom(customInput)}
                disabled={!customInput.trim()}
                className="px-5 py-2 bg-acid text-ink font-bold rounded-xl text-sm disabled:opacity-50 self-end hover:brightness-110 transition-all"
              >
                Go
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
