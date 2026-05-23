import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { postMemeToFeed } from '../../lib/meme-export'

interface Props {
  blob: Blob
  previewUrl: string
  imageUrl: string
  onBack: () => void
}

export default function SharePanel({ blob, previewUrl, imageUrl, onBack }: Props) {
  const navigate = useNavigate()
  const [toast, setToast] = useState<string | null>(null)
  const [posting, setPosting] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [memeId, setMemeId] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  const handleDownload = () => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `meme-${Date.now()}.png`
    a.click()
    URL.revokeObjectURL(url)
    showToast('Downloaded!')
  }

  const handleCopyImage = async () => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      showToast('Copied to clipboard!')
    } catch {
      handleDownload()
      showToast('Downloaded — clipboard not supported')
    }
  }

  const handlePostToFeed = async () => {
    setPosting(true)
    try {
      const result = await postMemeToFeed(blob, imageUrl)
      setMemeId(result.memeId)
      setShareUrl(result.shareUrl)
      showToast('Posted to feed!')
      navigate('/feed')
    } catch (e) {
      showToast(e instanceof Error ? e.message : 'Failed to post')
    } finally {
      setPosting(false)
    }
  }

  const handleCopyLink = async () => {
    if (!shareUrl) return
    try {
      await navigator.clipboard.writeText(shareUrl)
      showToast('Link copied!')
    } catch {
      showToast('Could not copy')
    }
  }

  const handleNativeShare = async () => {
    if (!shareUrl || !navigator.share) return
    try {
      await navigator.share({ title: 'Check out my meme!', url: shareUrl })
    } catch { /* user cancelled */ }
  }

  return (
    <div className="min-h-dvh bg-ink flex flex-col items-center p-6 pt-16">
      <div className="w-full max-w-lg">
        <button onClick={onBack} className="text-paper/60 text-sm mb-4">
          ← Back to editor
        </button>

        <img
          src={previewUrl}
          alt="Your meme"
          className="w-full rounded-lg aspect-video object-contain bg-ink"
        />

        <div className="mt-6 flex flex-col gap-3">
          {!memeId ? (
            <button
              onClick={handlePostToFeed}
              disabled={posting}
              className="w-full py-3 bg-acid text-ink font-bold rounded text-sm uppercase tracking-wide disabled:opacity-50"
            >
              {posting ? 'Posting...' : 'Post to Feed'}
            </button>
          ) : (
            <div className="p-3 bg-acid/10 border border-acid/30 rounded">
              <p className="text-acid text-sm font-medium">Posted to feed!</p>
              <p className="text-paper/50 text-xs mt-1">Meme ID: {memeId}</p>
            </div>
          )}

          <button
            onClick={handleDownload}
            className="w-full py-3 border border-paper/30 text-paper font-bold rounded text-sm uppercase tracking-wide hover:border-acid hover:text-acid transition-colors"
          >
            Download PNG
          </button>

          <button
            onClick={handleCopyImage}
            className="w-full py-3 border border-paper/30 text-paper font-bold rounded text-sm uppercase tracking-wide hover:border-acid hover:text-acid transition-colors"
          >
            Copy Image to Clipboard
          </button>

          {shareUrl && (
            <>
              <button
                onClick={handleCopyLink}
                className="w-full py-3 border border-acid text-acid font-bold rounded text-sm uppercase tracking-wide hover:bg-acid hover:text-ink transition-colors"
              >
                Copy Link
              </button>

              {!!navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className="w-full py-3 border border-paper/30 text-paper font-bold rounded text-sm uppercase tracking-wide hover:border-acid hover:text-acid transition-colors"
                >
                  Share
                </button>
              )}

              <div onClick={handleCopyLink} className="mt-1 p-3 bg-paper/5 rounded border border-paper/10 cursor-pointer">
                <p className="text-xs text-paper/50 mb-1">Tap to copy link:</p>
                <p className="text-sm text-acid font-mono break-all">{shareUrl}</p>
              </div>
            </>
          )}
        </div>

        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-paper text-ink rounded-full text-sm font-medium shadow-lg z-50">
            {toast}
          </div>
        )}
      </div>
    </div>
  )
}
