import type { MemeSuggestion } from '../../../shared/types'
import MemePreviewCard from './MemePreviewCard'

interface Props {
  suggestions: MemeSuggestion[]
  imageUrl: string
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function SuggestionGrid({ suggestions, imageUrl, selectedId, onSelect }: Props) {
  return (
    <div className="w-full max-w-6xl mx-auto px-4">
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
      >
        {suggestions.map((s) => (
          <MemePreviewCard
            key={s.id}
            suggestion={s}
            imageUrl={imageUrl}
            selected={s.id === selectedId}
            onSelect={() => onSelect(s.id)}
          />
        ))}
      </div>
    </div>
  )
}
