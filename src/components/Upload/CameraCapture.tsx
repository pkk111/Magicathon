import { useEffect, useRef, useState } from 'react'
import { captureFrameFromVideo } from '../../lib/image'

interface Props {
  onCapture: (blob: Blob) => void
  onClose: () => void
}

export default function CameraCapture({ onCapture, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    let currentStream: MediaStream | null = null

    async function startCamera() {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode, width: { ideal: 1920 }, height: { ideal: 1080 } }
        })
        if (!active) { s.getTracks().forEach(t => t.stop()); return }
        currentStream = s
        setStream(s)
        if (videoRef.current) {
          videoRef.current.srcObject = s
        }
      } catch (e) {
        if (!active) return
        if (e instanceof Error && e.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera permissions.')
        } else {
          setError('Could not access camera.')
        }
      }
    }

    startCamera()
    return () => {
      active = false
      currentStream?.getTracks().forEach(t => t.stop())
    }
  }, [facingMode])

  const handleCapture = async () => {
    if (!videoRef.current) return
    const blob = await captureFrameFromVideo(videoRef.current)
    stream?.getTracks().forEach(t => t.stop())
    onCapture(blob)
  }

  const switchCamera = () => {
    stream?.getTracks().forEach(t => t.stop())
    setFacingMode(f => f === 'environment' ? 'user' : 'environment')
  }

  const handleClose = () => {
    stream?.getTracks().forEach(t => t.stop())
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink flex flex-col">
      <div className="flex items-center justify-between p-4">
        <button onClick={handleClose} className="text-paper/80 text-sm font-medium">
          ✕ Close
        </button>
        <button onClick={switchCamera} className="text-paper/80 text-sm font-medium">
          🔄 Flip
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center overflow-hidden">
        {error ? (
          <div className="text-center p-6">
            <p className="text-paper/80 mb-4">{error}</p>
            <button onClick={handleClose} className="px-4 py-2 bg-acid text-ink rounded font-medium text-sm">
              Go Back
            </button>
          </div>
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {!error && (
        <div className="p-6 flex justify-center">
          <button
            onClick={handleCapture}
            className="w-16 h-16 rounded-full bg-white border-4 border-acid active:scale-90 transition-transform"
          />
        </div>
      )}
    </div>
  )
}
