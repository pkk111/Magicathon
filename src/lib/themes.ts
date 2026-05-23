export interface MemeTheme {
  id: string
  name: string
  emoji: string
  description: string
}

export const MEME_THEMES: MemeTheme[] = [
  {
    id: 'relatable',
    name: 'Me IRL',
    emoji: '😴',
    description: 'Introversion, adulting struggles, social exhaustion',
  },
  {
    id: 'dissonance',
    name: 'X vs Reality',
    emoji: '🎮',
    description: 'High effort in hobbies, zero effort in real life',
  },
  {
    id: 'cynicism',
    name: 'Existential',
    emoji: '🏢',
    description: 'Corporate culture, AI trends, modern absurdity',
  },
  {
    id: 'disaster',
    name: 'Before Disaster',
    emoji: '💀',
    description: 'Oblivious confidence meets incoming chaos',
  },
  {
    id: 'custom',
    name: 'Custom',
    emoji: '✏️',
    description: 'Write your own prompt for the AI',
  },
]
