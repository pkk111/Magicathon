import { useState } from 'react'

interface Props {
  memeId: string
  reactions: Record<string, number>
  onReactionsUpdate: (reactions: Record<string, number>) => void
}

const REACTION_EMOJIS: Record<string, string> = {
  laugh: '😂',
  fire: '🔥',
  'cry-laugh': '😭',
  '100': '💯',
  skull: '💀',
  heart: '❤️',
}

export default function ReactionBar({ memeId, reactions, onReactionsUpdate }: Props) {
  const [reacted, setReacted] = useState<Set<string>>(new Set())
  const [animating, setAnimating] = useState<string | null>(null)

  const handleReact = async (reaction: string) => {
    if (reacted.has(reaction)) return

    // Optimistic update
    setReacted(prev => new Set(prev).add(reaction))
    setAnimating(reaction)
    setTimeout(() => setAnimating(null), 300)

    try {
      const res = await fetch('/api/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memeId, reaction }),
      })

      if (res.ok) {
        const { reactions: updated } = await res.json()
        onReactionsUpdate(updated)
      } else if (res.status === 409) {
        // Already reacted — keep button disabled
      }
    } catch {
      // Revert on network error
      setReacted(prev => {
        const next = new Set(prev)
        next.delete(reaction)
        return next
      })
    }
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {Object.entries(REACTION_EMOJIS).map(([key, emoji]) => (
        <button
          key={key}
          onClick={() => handleReact(key)}
          disabled={reacted.has(key)}
          className={`
            flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-medium
            transition-all duration-200
            ${reacted.has(key)
              ? 'border-acid/50 bg-acid/10 text-acid'
              : 'border-paper/20 hover:border-paper/50 text-paper/80 hover:text-paper'}
            ${animating === key ? 'scale-125' : 'scale-100'}
            disabled:cursor-default
          `}
        >
          <span className="text-lg">{emoji}</span>
          <span>{reactions[key] || 0}</span>
        </button>
      ))}
    </div>
  )
}
