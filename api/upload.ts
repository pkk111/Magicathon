import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put } from '@vercel/blob'
import { nanoid } from 'nanoid'

export const config = {
  api: { bodyParser: false },
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  }

  try {
    const contentType = req.headers['content-type'] || ''
    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Expected multipart/form-data', code: 'INVALID_CONTENT_TYPE' })
    }

    // Read raw body
    const chunks: Buffer[] = []
    for await (const chunk of req) {
      chunks.push(Buffer.from(chunk))
    }
    const body = Buffer.concat(chunks)

    // Parse multipart boundary
    const boundary = contentType.split('boundary=')[1]
    if (!boundary) {
      return res.status(400).json({ error: 'No boundary found', code: 'INVALID_MULTIPART' })
    }

    // Extract file from multipart
    const file = extractFile(body, boundary)
    if (!file) {
      return res.status(400).json({ error: 'No image file found', code: 'NO_FILE' })
    }

    if (file.length > 10 * 1024 * 1024) {
      return res.status(400).json({ error: 'File too large (max 10MB)', code: 'FILE_TOO_LARGE' })
    }

    const isMemeExport = req.headers['x-upload-type'] === 'meme'
    const folder = isMemeExport ? 'memes' : 'upload'
    const ext = isMemeExport ? 'png' : 'jpg'

    const imageId = nanoid(12)
    const blob = await put(`${folder}/${imageId}.${ext}`, file, {
      access: 'private',
      contentType: isMemeExport ? 'image/png' : 'image/jpeg',
    })

    return res.status(200).json({
      imageId,
      imageUrl: blob.url,
      displayUrl: `/api/image?url=${encodeURIComponent(blob.url)}`,
      width: 1920,
      height: 1080,
    })
  } catch (e) {
    console.error('Upload error:', e)
    return res.status(500).json({ error: 'Upload failed', code: 'UPLOAD_ERROR' })
  }
}

function extractFile(body: Buffer, boundary: string): Buffer | null {
  const boundaryBuffer = Buffer.from(`--${boundary}`)
  const parts = splitBuffer(body, boundaryBuffer)

  for (const part of parts) {
    const headerEnd = part.indexOf('\r\n\r\n')
    if (headerEnd === -1) continue

    const header = part.subarray(0, headerEnd).toString()
    if (header.includes('name="image"') || header.includes('Content-Type: image/')) {
      let fileData = part.subarray(headerEnd + 4)
      if (fileData[fileData.length - 2] === 0x0d && fileData[fileData.length - 1] === 0x0a) {
        fileData = fileData.subarray(0, -2)
      }
      return Buffer.from(fileData)
    }
  }
  return null
}

function splitBuffer(buf: Buffer, delimiter: Buffer): Buffer[] {
  const parts: Buffer[] = []
  let start = 0
  while (true) {
    const idx = buf.indexOf(delimiter, start)
    if (idx === -1) {
      parts.push(Buffer.from(buf.subarray(start)))
      break
    }
    if (idx > start) parts.push(Buffer.from(buf.subarray(start, idx)))
    start = idx + delimiter.length
  }
  return parts
}
