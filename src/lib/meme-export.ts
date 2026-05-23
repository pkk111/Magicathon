import type { TextAnnotation } from '../../shared/types'
import { getSessionId } from './session'

const CANVAS_WIDTH = 1920
const CANVAS_HEIGHT = 1080

export async function renderMemeToBlob(
  imageUrl: string,
  annotations: Record<string, TextAnnotation>,
): Promise<Blob> {
  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.src = imageUrl
  await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject })

  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_WIDTH
  canvas.height = CANVAS_HEIGHT
  const ctx = canvas.getContext('2d')!
  ctx.drawImage(img, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  for (const ann of Object.values(annotations)) {
    const fontSize = ann.fontSize || 56
    ctx.font = `bold ${fontSize}px Impact, sans-serif`
    ctx.textAlign = 'center'
    ctx.fillStyle = ann.fill || '#FFFFFF'
    ctx.strokeStyle = ann.stroke || '#000000'
    ctx.lineWidth = ann.strokeWidth || 3
    ctx.lineJoin = 'round'
    const x = ann.x
    const y = ann.y + fontSize
    ctx.strokeText(ann.text, x, y)
    ctx.fillText(ann.text, x, y)
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(b => b ? resolve(b) : reject(new Error('Export failed')), 'image/png')
  })
}

export async function postMemeToFeed(blob: Blob, sourceImageUrl: string): Promise<{ memeId: string; shareUrl: string }> {
  const formData = new FormData()
  formData.append('image', blob, 'meme.png')
  const uploadRes = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'x-upload-type': 'meme' },
    body: formData,
  })
  if (!uploadRes.ok) throw new Error('Upload failed')
  const { imageUrl: exportedPngUrl } = await uploadRes.json()

  const sessionId = getSessionId()
  const memeRes = await fetch('/api/meme', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageUrl: sourceImageUrl, exportedPngUrl, textFields: [], sessionId }),
  })
  if (!memeRes.ok) throw new Error('Save failed')

  return memeRes.json()
}
