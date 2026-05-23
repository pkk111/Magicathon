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
      <div className="w-full max-w-lg flex flex-col gap-3">
        {/* Drop zone */}
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative w-full rounded-xl border-2 border-dashed
            flex flex-col items-center justify-center gap-3 cursor-pointer
            transition-all duration-200 py-10 px-6
            ${dragOver ? 'border-acid bg-acid/5 scale-[1.02]' : 'border-acid/40 hover:border-acid/70 bg-ink-card/50'}
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
              <div className="w-12 h-12 rounded-full bg-acid/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-acid" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-paper/90 font-semibold">Drop your image here</p>
                <p className="text-sm text-acid/70 mt-0.5">or click to browse</p>
              </div>
              <p className="text-xs text-paper/40">
                JPG, PNG, WebP — up to 10MB
              </p>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </div>

        {/* Open Camera button below */}
        {!uploading && (
          <button
            onClick={() => setShowCamera(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/10 bg-ink-card/50 hover:border-purple/40 hover:bg-purple/5 transition-all"
          >
            <svg className="w-5 h-5 text-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-sm font-medium text-paper/70">Open Camera</span>
          </button>
        )}
      </div>

      {showCamera && (
        <CameraCapture
          onCapture={(blob) => { setShowCamera(false); onFile(blob) }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </>
  )
}
