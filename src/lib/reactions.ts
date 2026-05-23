export const REACTION_EMOJIS: Record<string, string> = {
  laugh: '😂',
  fire: '🔥',
  'cry-laugh': '😭',
  '100': '💯',
  skull: '💀',
  heart: '❤️',
}

export function parseReactions(reactions: Record<string, number> | string): Record<string, number> {
  if (typeof reactions === 'string') {
    try { return JSON.parse(reactions) } catch { return {} }
  }
  return reactions || {}
}
