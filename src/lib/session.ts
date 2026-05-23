import { nanoid } from 'nanoid'

export function getSessionId(): string {
  let id = localStorage.getItem('magicathon_session_id')
  if (!id) {
    id = nanoid(16)
    localStorage.setItem('magicathon_session_id', id)
  }
  return id
}
