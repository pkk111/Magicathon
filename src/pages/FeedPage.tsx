import { useEffect, useState } from 'react'
import ReactionBar from '../components/View/ReactionBar'
import { getDisplayUrl } from '../lib/api'
import { shareMemeUrl } from '../lib/share'

interface FeedMeme {
  memeId: string
  exportedPngUrl: string
  reactions: Record<string, number>
  totalReactions: number
  createdAt: string
  sessionId: string | null
}

export default function FeedPage() {
  const [memes, setMemes] = useState<FeedMeme[]>([])
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)

  const fetchFeed = async (pageNum: number) => {
    try {
      const res = await fetch(`/api/feed?page=${pageNum}&limit=20`)
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setMemes(prev => pageNum === 1 ? data.memes : [...prev, ...data.memes])
      setHasMore(data.hasMore)
    } catch (e) {
      console.error('Feed fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFeed(1) }, [])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchFeed(nextPage)
  }

  const updateReactions = (memeId: string, updated: Record<string, number>) => {
    setMemes(prev => prev.map(m => m.memeId === memeId ? { ...m, reactions: updated } : m))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh pt-14">
        <div className="w-8 h-8 border-3 border-acid border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (memes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh pt-14 p-6">
        <p className="text-4xl mb-3">🎭</p>
        <p className="text-paper/70 text-lg font-medium">No memes yet</p>
        <p className="text-paper/50 text-sm mt-1">Be the first to create and share one!</p>
        <a href="/" className="mt-4 px-4 py-2 bg-acid text-ink rounded font-bold text-sm">
          Create a Meme
        </a>
      </div>
    )
  }

  return (
    <div className="relative min-h-dvh pt-14 pb-8 px-4 overflow-hidden">
      <img src="/feed-bg.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-ink/70" />
      <div className="relative z-10 max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 pt-4">Meme Feed</h1>

        <div className="grid gap-6 max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto">
          {memes.map((meme) => (
            <FeedCard
              key={meme.memeId}
              meme={meme}
              onReactionsUpdate={(updated) => updateReactions(meme.memeId, updated)}
            />
          ))}
        </div>

        {hasMore && (
          <div className="mt-8 text-center">
            <button
              onClick={loadMore}
              className="px-6 py-2 border border-paper/30 rounded text-sm font-medium hover:border-acid hover:text-acid transition-colors"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function FeedCard({ meme, onReactionsUpdate }: { meme: FeedMeme; onReactionsUpdate: (r: Record<string, number>) => void }) {
  return (
    <div className="bg-ink-card rounded-xl overflow-hidden border border-white/5 hover:border-white/10 transition-colors">
      <a href={`/m/${meme.memeId}`}>
        <img
          src={getDisplayUrl(meme.exportedPngUrl)}
          alt="Meme"
          className="w-full aspect-video object-cover"
        />
      </a>
      <div className="p-4">
        <p className="text-paper/30 text-xs mb-3">
          {new Date(meme.createdAt).toLocaleString()}
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <ReactionBar
              memeId={meme.memeId}
              reactions={meme.reactions}
              onReactionsUpdate={onReactionsUpdate}
            />
          </div>
          <button
            onClick={() => shareMemeUrl(meme.memeId)}
            className="p-2 rounded-full border border-white/10 hover:border-acid transition-colors"
            title="Share"
          >
            <img src="/send.png" alt="Share" className="w-6 h-6 invert brightness-200" />
          </button>
        </div>
      </div>
    </div>
  )
}
