import { useState, useEffect, useRef } from 'react'
import FilerobotImageEditor, { TABS, TOOLS } from 'react-filerobot-image-editor'
import type { MemeSuggestion } from '../../../shared/types'
import SharePanel from '../Share/SharePanel'
import { scaleAnnotationsToEditor } from '../../lib/annotations'

interface Props {
  imageUrl: string
  suggestion: MemeSuggestion
  onClose: () => void
}

const EDITOR_THEME = {
  palette: {
    'bg-secondary': '#0c0c0a',
    'bg-primary': '#161613',
    'bg-primary-active': '#2a2a24',
    'accent-primary': '#c6f24e',
    'accent-primary-active': '#9fd400',
    'icons-primary': '#f4f1e8',
    'icons-secondary': '#a0a090',
    'borders-primary': '#333330',
    'borders-secondary': '#222220',
  },
  typography: { fontFamily: 'Montserrat, sans-serif' },
}

const TEXT_CONFIG = {
  text: 'Add text',
  fonts: [
    { label: 'Impact', value: 'Impact' },
    { label: 'Anton', value: 'Anton' },
    { label: 'Comic Neue', value: 'Comic Neue' },
    { label: 'Montserrat', value: 'Montserrat' },
  ],
  fontSize: 56,
  align: 'center' as const,
  fontStyle: 'bold' as const,
}

const ANNOTATIONS_COMMON = {
  fill: '#FFFFFF',
  stroke: '#000000',
  strokeWidth: 3,
  shadowOffsetX: 2,
  shadowOffsetY: 2,
  shadowBlur: 4,
  shadowColor: '#000000',
  opacity: 1,
}

export default function MemeEditor({ imageUrl, suggestion, onClose }: Props) {
  const [exportedBlob, setExportedBlob] = useState<Blob | null>(null)
  const [exportedUrl, setExportedUrl] = useState<string | null>(null)
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [textReady, setTextReady] = useState(false)
  const updateStateRef = useRef<((state: any) => void) | null>(null)
  const getCurrentImgDataRef = useRef<(() => any) | null>(null)

  useEffect(() => {
    let cancelled = false
    async function loadImage() {
      try {
        const res = await fetch(imageUrl)
        const blob = await res.blob()
        const reader = new FileReader()
        reader.onload = () => {
          if (!cancelled) {
            setImageDataUrl(reader.result as string)
            setLoading(false)
          }
        }
        reader.readAsDataURL(blob)
      } catch {
        if (!cancelled) setLoading(false)
      }
    }
    loadImage()
    return () => { cancelled = true }
  }, [imageUrl])

  useEffect(() => {
    if (loading) return
    const timer = setTimeout(() => {
      if (!updateStateRef.current) return

      let displayWidth = 800
      let displayHeight = 450

      if (getCurrentImgDataRef.current) {
        const imgData = getCurrentImgDataRef.current()
        const shown = imgData?.designState?.shownImageDimensions
        if (shown) {
          displayWidth = shown.width
          displayHeight = shown.height
        }
      }

      const scaled = scaleAnnotationsToEditor(
        suggestion.annotations || {},
        displayWidth,
        displayHeight,
      )
      updateStateRef.current(scaled)
      setTextReady(true)
    }, 1500)
    return () => clearTimeout(timer)
  }, [loading, suggestion])

  const handleSave = (editedImageObject: { imageBase64?: string; mimeType?: string }) => {
    if (!editedImageObject.imageBase64) return
    const blob = base64ToBlob(editedImageObject.imageBase64, editedImageObject.mimeType || 'image/png')
    setExportedBlob(blob)
    setExportedUrl(editedImageObject.imageBase64)
  }

  if (exportedBlob && exportedUrl) {
    return (
      <SharePanel
        blob={exportedBlob}
        previewUrl={exportedUrl}
        imageUrl={imageUrl}
        onBack={() => { setExportedBlob(null); setExportedUrl(null) }}
      />
    )
  }

  if (loading || !imageDataUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-ink flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-acid border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 50 }}>
      {!textReady && (
        <div className="absolute inset-0 z-[60] bg-ink/80 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-acid border-t-transparent rounded-full animate-spin" />
            <p className="text-paper/80 text-sm">Loading meme text...</p>
          </div>
        </div>
      )}
      <FilerobotImageEditor
        source={imageDataUrl}
        tabsIds={[TABS.ANNOTATE, TABS.ADJUST, TABS.FILTERS]}
        defaultTabId={TABS.ANNOTATE}
        defaultToolId={TOOLS.TEXT}
        defaultSavedImageType="png"
        defaultSavedImageQuality={0.92}
        savingPixelRatio={2}
        previewPixelRatio={window.devicePixelRatio}
        closeAfterSave={false}
        useBackendTranslations={false}
        updateStateFnRef={updateStateRef as any}
        getCurrentImgDataFnRef={getCurrentImgDataRef as any}
        theme={EDITOR_THEME}
        Text={TEXT_CONFIG}
        annotationsCommon={ANNOTATIONS_COMMON}
        onSave={handleSave}
        onClose={onClose}
      />
    </div>
  )
}

function base64ToBlob(base64: string, mimeType: string): Blob {
  const parts = base64.split(',')
  const byteString = atob(parts[1] || parts[0] || '')
  const ab = new ArrayBuffer(byteString.length)
  const ia = new Uint8Array(ab)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return new Blob([ab], { type: mimeType })
}
