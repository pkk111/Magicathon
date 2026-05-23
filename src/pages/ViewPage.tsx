import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import ReactionBar from '../components/View/ReactionBar'
import { getDisplayUrl } from '../lib/api'

interface MemeData {
  memeId: string
  imageUrl: string
  exportedPngUrl: string
  reactions: Record<string, number>
  totalReactions: number
  createdAt: string
}

export default function ViewPage() {
  const { id } = useParams()
  const [meme, setMeme] = useState<MemeData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    fetch(`/api/meme/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Meme not found')
        return res.json()
      })
      .then(data => setMeme(data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh">
        <div className="w-8 h-8 border-3 border-acid border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !meme) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh p-6">
        <p className="text-2xl mb-2">😕</p>
        <p className="text-paper/70">{error || 'Meme not found'}</p>
        <a href="/" className="mt-4 text-acid text-sm font-medium">
          ← Make your own meme
        </a>
      </div>
    )
  }

  return (
    <div className="min-h-dvh flex flex-col items-center p-6">
      <div className="w-full max-w-2xl">
        <img
          src={getDisplayUrl(meme.exportedPngUrl)}
          alt="Meme"
          className="w-full rounded-lg"
        />

        <div className="mt-6">
          <ReactionBar
            memeId={meme.memeId}
            reactions={meme.reactions}
            onReactionsUpdate={(updated) => setMeme(prev => prev ? { ...prev, reactions: updated } : null)}
          />
        </div>

        <div className="mt-8 text-center">
          <p className="text-paper/40 text-xs">
            {meme.totalReactions} reactions
          </p>
          <a href="/" className="inline-block mt-4 text-acid text-sm font-medium">
            Make your own meme →
          </a>
        </div>
      </div>
    </div>
  )
}
