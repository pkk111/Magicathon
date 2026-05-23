import { useEffect, useState } from 'react'
import ReactionBar from '../components/View/ReactionBar'
import { getDisplayUrl } from '../lib/api'

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
      if (pageNum === 1) {
        setMemes(data.memes)
      } else {
        setMemes(prev => [...prev, ...data.memes])
      }
      setHasMore(data.hasMore)
    } catch (e) {
      console.error('Feed fetch error:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeed(1)
  }, [])

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    fetchFeed(nextPage)
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
    <div className="min-h-dvh pt-14 pb-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 pt-4">Meme Feed</h1>

        <div className="grid gap-6 max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto">
          {memes.map((meme) => (
            <div key={meme.memeId} className="bg-paper/5 rounded-lg overflow-hidden border border-paper/10">
              <a href={`/m/${meme.memeId}`}>
                <img
                  src={getDisplayUrl(meme.exportedPngUrl)}
                  alt="Meme"
                  className="w-full aspect-video object-cover"
                />
              </a>
              <div className="p-3">
                <p className="text-paper/30 text-xs mb-2">
                  {new Date(meme.createdAt).toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <ReactionBar
                      memeId={meme.memeId}
                      reactions={meme.reactions}
                      onReactionsUpdate={(updated) => {
                        setMemes(prev => prev.map(m =>
                          m.memeId === meme.memeId ? { ...m, reactions: updated } : m
                        ))
                      }}
                    />
                  </div>
                  <button
                    onClick={async () => {
                      const url = `${window.location.origin}/m/${meme.memeId}`
                      if (navigator.share) {
                        try {
                          await navigator.share({ title: 'Check out this meme!', url })
                        } catch { /* cancelled */ }
                      } else {
                        try {
                          await navigator.clipboard.writeText(url)
                        } catch { /* fallback */ }
                      }
                    }}
                    className="px-3 py-2 rounded-full border border-paper/20 text-paper/70 hover:border-acid hover:text-acid transition-colors text-lg"
                    title="Share"
                  >
                    📤
                  </button>
                </div>
              </div>
            </div>
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
