import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { url } = req.query
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Missing url parameter' })
  }

  try {
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN
    const imageResponse = await fetch(url, {
      headers: blobToken ? { 'Authorization': `Bearer ${blobToken}` } : {},
    })

    if (!imageResponse.ok) {
      return res.status(imageResponse.status).json({ error: 'Image not found' })
    }

    const contentType = imageResponse.headers.get('content-type') || 'image/jpeg'
    const buffer = Buffer.from(await imageResponse.arrayBuffer())

    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
    res.send(buffer)
  } catch (e) {
    console.error('Image proxy error:', e)
    return res.status(500).json({ error: 'Failed to serve image' })
  }
}
