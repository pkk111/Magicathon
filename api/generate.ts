import type { VercelRequest, VercelResponse } from '@vercel/node'
import { put } from '@vercel/blob'
import { nanoid } from 'nanoid'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { imageUrl, prompt } = req.body || {}
  if (!imageUrl || !prompt) {
    return res.status(400).json({ error: 'imageUrl and prompt are required' })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  try {
    const t0 = Date.now()
    const base64Image = await fetchImageAsBase64(imageUrl)
    if (!base64Image) {
      return res.status(400).json({ error: 'Could not fetch image' })
    }
    console.log(`[generate] Image fetch: ${Date.now() - t0}ms`)

    const t1 = Date.now()
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-image',
        modalities: ['text', 'image'],
        messages: [
          {
            role: 'user',
            content: [
              { type: 'image_url', image_url: { url: base64Image.dataUrl } },
              {
                type: 'text',
                text: `Generate an image. NO TEXT IN THE IMAGE.

Visual direction: ${prompt}

Rules:
- Generate a funny meme-style image based on the reference photo above
- The image must contain ZERO text, ZERO words, ZERO letters, ZERO captions
- If the direction mentions adding text or captions, IGNORE that part — only apply the visual style
- Use visual humor: exaggerated expressions, absurd situations, funny compositions
- Keep main subjects from the original recognizable

Output: one image, purely visual, no characters/letters/words anywhere.`,
              },
            ],
          },
        ],
        temperature: 1.0,
        max_tokens: 4096,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      console.error('[generate] API error:', response.status, err)
      return res.status(500).json({ error: `API error: ${response.status}` })
    }

    const data = await response.json()
    console.log(`[generate] LLM response: ${Date.now() - t1}ms`)
    console.log('[generate] Response structure:', JSON.stringify(data).substring(0, 1000))

    const message = data.choices?.[0]?.message
    if (!message) {
      return res.status(500).json({ error: 'No response from model' })
    }

    const imageData = extractImageFromResponse(message)
    if (!imageData) {
      console.error('[generate] No image found in response. Full message:', JSON.stringify(message).substring(0, 500))
      return res.status(500).json({ error: 'Model did not return an image' })
    }

    const imageBuffer = Buffer.from(imageData.base64, 'base64')
    const imageId = nanoid(12)
    const blob = await put(`generated/${imageId}.png`, imageBuffer, {
      access: 'private',
      contentType: imageData.mimeType,
    })

    console.log(`[generate] Total: ${Date.now() - t0}ms`)
    return res.status(200).json({
      generatedImageUrl: blob.url,
      displayUrl: `/api/image?url=${encodeURIComponent(blob.url)}`,
    })
  } catch (e) {
    console.error('Generate error:', e)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}

function extractImageFromResponse(message: any): { base64: string; mimeType: string } | null {
  // Check message.images array (OpenRouter's format for Gemini image gen)
  if (Array.isArray(message.images)) {
    for (const img of message.images) {
      const url = img.image_url?.url || img.url
      if (url) {
        const match = url.match(/data:(image\/[^;]+);base64,(.+)/)
        if (match) return { mimeType: match[1]!, base64: match[2]!.replace(/\n/g, '') }
      }
    }
  }

  const content = message.content

  // String content — check for inline base64 data URL
  if (typeof content === 'string') {
    const dataUrlMatch = content.match(/data:(image\/[^;]+);base64,([A-Za-z0-9+/=\n]+)/)
    if (dataUrlMatch) {
      return { mimeType: dataUrlMatch[1]!, base64: dataUrlMatch[2]!.replace(/\n/g, '') }
    }
  }

  // Array content — multimodal response parts
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === 'image_url' && part.image_url?.url) {
        const match = part.image_url.url.match(/data:(image\/[^;]+);base64,(.+)/)
        if (match) return { mimeType: match[1]!, base64: match[2]!.replace(/\n/g, '') }
      }
      if (part.inlineData || part.inline_data) {
        const inline = part.inlineData || part.inline_data
        return { mimeType: inline.mimeType || inline.mime_type || 'image/png', base64: inline.data }
      }
    }
  }

  return null
}

async function fetchImageAsBase64(imageUrl: string) {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  const response = await fetch(imageUrl, {
    headers: blobToken ? { 'Authorization': `Bearer ${blobToken}` } : {},
  })
  if (!response.ok) return null

  const buffer = Buffer.from(await response.arrayBuffer())
  const mimeType = response.headers.get('content-type') || 'image/jpeg'
  return { dataUrl: `data:${mimeType};base64,${buffer.toString('base64')}` }
}
