import { useCallback, useEffect, useRef, useState } from 'react'
import CameraCapture from './CameraCapture'

interface Props {
  onFile: (file: Blob) => void
  uploading: boolean
}

export default function UploadZone({ onFile, uploading }: Props) {
  const [dragOver, setDragOver] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback((files: FileList | null) => {
    const file = files?.[0]
    if (file && file.type.startsWith('image/')) {
      onFile(file)
    }
  }, [onFile])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => setDragOver(false), [])

  // Global paste listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items
      if (!items) return
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) onFile(file)
          break
        }
      }
    }
    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [onFile])

  return (
    <>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative w-full max-w-lg aspect-video rounded-lg border-2 border-dashed
          flex flex-col items-center justify-center gap-4 cursor-pointer
          transition-colors duration-200
          ${dragOver ? 'border-acid bg-acid/10' : 'border-paper/30 hover:border-paper/60'}
          ${uploading ? 'pointer-events-none opacity-60' : ''}
        `}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-acid border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-paper/70">Processing...</p>
          </div>
        ) : (
          <>
            <div className="text-4xl">📸</div>
            <p className="text-center text-paper/80 font-medium">
              Drop a photo, click to browse, or paste
            </p>
            <p className="text-sm text-paper/50">
              JPG, PNG, WebP — will be cropped to 16:9
            </p>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
        />
      </div>

      {!uploading && (
        <button
          onClick={(e) => { e.stopPropagation(); setShowCamera(true) }}
          className="mt-4 px-5 py-2.5 border border-paper/30 rounded text-sm font-medium hover:border-acid hover:text-acid transition-colors"
        >
          📷 Use Camera
        </button>
      )}

      {showCamera && (
        <CameraCapture
          onCapture={(blob) => { setShowCamera(false); onFile(blob) }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  )
}
