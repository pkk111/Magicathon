import { useState, useEffect, useRef } from 'react'
import { getSessionId } from '../../lib/session'

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

function parseReactions(reactions: Record<string, number> | string): Record<string, number> {
  if (typeof reactions === 'string') {
    try { return JSON.parse(reactions) } catch { return {} }
  }
  return reactions || {}
}

export default function ReactionBar({ memeId, reactions, onReactionsUpdate }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [animating, setAnimating] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const fetched = useRef(false)

  const parsed = parseReactions(reactions)

  useEffect(() => {
    if (fetched.current) return
    fetched.current = true

    const sessionId = getSessionId()
    fetch(`/api/react?memeId=${memeId}&sessionId=${sessionId}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) {
          if (data.userReaction) setSelected(data.userReaction)
          if (data.reactions) onReactionsUpdate(parseReactions(data.reactions))
        }
      })
      .catch(() => {})
  }, [memeId])

  const handleReact = async (reaction: string) => {
    if (submitting) return
    if (selected === reaction) return

    const previousSelection = selected
    setSelected(reaction)
    setAnimating(reaction)
    setSubmitting(true)
    setTimeout(() => setAnimating(null), 300)

    try {
      const sessionId = getSessionId()
      const res = await fetch('/api/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memeId, reaction, sessionId }),
      })

      if (res.ok) {
        const data = await res.json()
        onReactionsUpdate(parseReactions(data.reactions))
        setSelected(data.userReaction || reaction)
      } else {
        setSelected(previousSelection)
      }
    } catch {
      setSelected(previousSelection)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {Object.entries(REACTION_EMOJIS).map(([key, emoji]) => (
        <button
          key={key}
          onClick={() => handleReact(key)}
          disabled={submitting}
          className={`
            flex items-center gap-1.5 px-3 py-2 rounded-full border text-sm font-medium
            transition-all duration-200
            ${selected === key
              ? 'border-acid bg-acid/15 text-acid'
              : 'border-paper/20 hover:border-paper/50 text-paper/80 hover:text-paper'}
            ${animating === key ? 'scale-125' : 'scale-100'}
            ${submitting ? 'opacity-70' : ''}
          `}
        >
          <span className="text-lg">{emoji}</span>
          <span>{parsed[key] || 0}</span>
        </button>
      ))}
    </div>
  )
}
