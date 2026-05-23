import type { VercelRequest, VercelResponse } from '@vercel/node'
import OpenAI from 'openai'
import sharp from 'sharp'

const SYSTEM_PROMPT = `Look at this image. Suggest 8 funny meme directions. Each suggestion has 3 parts:

1. "summary" — 1-5 word label shown to user as a button (e.g. "Corporate Hustle", "Main Character Energy")
2. "prompt" — visual image generation prompt describing how to transform the photo visually. NO TEXT instructions here. Only visual style, scene changes, exaggeration, absurd situations.
3. "textPrompt" — a separate prompt for a text generator to write funny meme captions for the generated image. Describe the tone, humor style, and what kind of caption would be funny.

RULES:
- "prompt" must NEVER mention adding text, words, captions, or labels to the image
- "textPrompt" is for generating overlay text SEPARATELY — it tells another AI what kind of caption to write

Return JSON only, no emojis in any field:
{"suggestions":[{"summary":"1-5 words","prompt":"visual-only image generation prompt","textPrompt":"prompt for text caption generator"}]}`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { imageUrl } = req.body || {}
  if (!imageUrl) {
    return res.status(400).json({ error: 'imageUrl is required' })
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

    const t1 = Date.now()
    console.log(`[analyze] Image fetch + resize: ${t1 - t0}ms, size: ${base64Image.dataUrl.length} chars`)

    const openai = new OpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey })

    const completion = await openai.chat.completions.create({
      model: 'google/gemini-2.0-flash-lite-001',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: base64Image.dataUrl } },
            { type: 'text', text: SYSTEM_PROMPT },
          ],
        },
      ],
      temperature: 1.0,
      max_tokens: 800,
    })

    const t2 = Date.now()
    console.log(`[analyze] LLM response: ${t2 - t1}ms`)
    console.log(`[analyze] Total: ${t2 - t0}ms`)

    const raw = completion.choices[0]?.message?.content
    if (!raw) {
      return res.status(500).json({ error: 'No response from model' })
    }

    console.log(`[analyze] Raw response: ${raw.substring(0, 200)}...`)

    const jsonStr = raw.replace(/^```json?\n?/g, '').replace(/\n?```$/g, '').trim()
    let suggestions: any[]
    try {
      const parsed = JSON.parse(jsonStr)
      // Handle both {"suggestions": [...]} and bare [...]
      suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions
    } catch {
      // Try to extract JSON array or object from the response
      const arrayMatch = jsonStr.match(/\[[\s\S]*\]/)
      const objMatch = jsonStr.match(/\{[\s\S]*\}/)
      if (arrayMatch) {
        suggestions = JSON.parse(arrayMatch[0])
      } else if (objMatch) {
        const parsed = JSON.parse(objMatch[0])
        suggestions = parsed.suggestions || []
      } else {
        console.error('[analyze] Could not parse:', jsonStr)
        return res.status(500).json({ error: 'Invalid response structure' })
      }
    }

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      return res.status(500).json({ error: 'Invalid response structure' })
    }

    return res.status(200).json({ suggestions })
  } catch (e) {
    console.error('Analyze error:', e)
    const message = e instanceof Error ? e.message : 'Analysis failed'
    return res.status(500).json({ error: message })
  }
}

async function fetchImageAsBase64(imageUrl: string) {
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  const response = await fetch(imageUrl, {
    headers: blobToken ? { 'Authorization': `Bearer ${blobToken}` } : {},
  })
  if (!response.ok) return null

  const buffer = Buffer.from(await response.arrayBuffer())
  const resized = await sharp(buffer)
    .resize(128, null, { fit: 'inside' })
    .jpeg({ quality: 50 })
    .toBuffer()

  console.log(`[analyze] Resized image: ${resized.length} bytes`)
  return { dataUrl: `data:image/jpeg;base64,${resized.toString('base64')}` }
}
