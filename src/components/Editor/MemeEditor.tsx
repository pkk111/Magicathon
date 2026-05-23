import { useState, useEffect, useRef } from 'react'
import FilerobotImageEditor, { TABS, TOOLS } from 'react-filerobot-image-editor'
import type { MemeSuggestion } from '../../../shared/types'
import SharePanel from '../Share/SharePanel'

interface Props {
  imageUrl: string
  suggestion: MemeSuggestion
  onClose: () => void
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
    async function loadImage() {
      try {
        const res = await fetch(imageUrl)
        const blob = await res.blob()
        const reader = new FileReader()
        reader.onload = () => {
          setImageDataUrl(reader.result as string)
          setLoading(false)
        }
        reader.readAsDataURL(blob)
      } catch {
        setLoading(false)
      }
    }
    loadImage()
  }, [imageUrl])

  // Inject annotations AFTER editor has loaded the image and set dimensions
  useEffect(() => {
    if (loading) return
    const timer = setTimeout(() => {
      if (updateStateRef.current && getCurrentImgDataRef.current) {
        // Get actual displayed dimensions from the editor
        const imgData = getCurrentImgDataRef.current()
        const designState = imgData?.designState
        const shown = designState?.shownImageDimensions
        console.log('=== Editor shownImageDimensions ===', shown)

        // Scale factor: AI uses 1920x1080, editor uses displayed size
        const scaleX = (shown?.width || 800) / 1920
        const scaleY = (shown?.height || 450) / 1080

        const annotations = Object.fromEntries(
          Object.entries(suggestion.annotations || {}).map(([key, ann]) => {
            // Scale from 1920x1080 to displayed size, then convert center x to left edge
            const scaledWidth = (ann.width || 800) * scaleX
            const scaledX = ann.x * scaleX - scaledWidth / 2
            const scaledY = ann.y * scaleY
            const scaledFontSize = ann.fontSize * scaleY

            return [
              key,
              {
                ...ann,
                x: scaledX,
                y: scaledY,
                width: scaledWidth,
                height: (ann.height || 120) * scaleY,
                fontSize: scaledFontSize,
                strokeWidth: (ann.strokeWidth || 3) * scaleX,
                name: 'Text',
                scaleX: 1,
                scaleY: 1,
                rotation: 0,
                visible: true,
                padding: 1,
                verticalAlign: 'top',
                lineHeight: 1,
                letterSpacing: 0,
                fontWeight: 'bold',
              },
            ]
          })
        )
        const annotationIds = Object.keys(annotations)
        console.log('=== Scaled annotations ===', annotations)
        updateStateRef.current({
          annotations,
          annotationIds,
        })
      } else if (updateStateRef.current) {
        // Fallback: if getCurrentImgDataRef not available, use rough estimate
        console.log('=== Fallback: no getCurrentImgDataRef, using estimate ===')
        const annotations = Object.fromEntries(
          Object.entries(suggestion.annotations || {}).map(([key, ann]) => [
            key,
            {
              ...ann,
              x: ann.x - (ann.width || 800) / 2,
              name: 'Text',
              scaleX: 1,
              scaleY: 1,
              rotation: 0,
              visible: true,
              padding: 1,
              verticalAlign: 'top',
              lineHeight: 1,
              letterSpacing: 0,
              fontWeight: 'bold',
            },
          ])
        )
        updateStateRef.current({
          annotations,
          annotationIds: Object.keys(annotations),
        })
      }
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
        theme={{
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
        }}
        Text={{
          text: 'Add text',
          fonts: [
            { label: 'Impact', value: 'Impact' },
            { label: 'Anton', value: 'Anton' },
            { label: 'Comic Neue', value: 'Comic Neue' },
            { label: 'Montserrat', value: 'Montserrat' },
          ],
          fontSize: 56,
          align: 'center',
          fontStyle: 'bold',
        }}
        annotationsCommon={{
          fill: '#FFFFFF',
          stroke: '#000000',
          strokeWidth: 3,
          shadowOffsetX: 2,
          shadowOffsetY: 2,
          shadowBlur: 4,
          shadowColor: '#000000',
          opacity: 1,
        }}
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
