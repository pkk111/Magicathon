import type { VercelRequest, VercelResponse } from '@vercel/node'
import OpenAI from 'openai'
import sharp from 'sharp'

const SYSTEM_PROMPT = `You are a JSON API. Look at this image and return exactly 8 meme ideas.

Rules:
- Output MUST be valid JSON. Nothing else. No markdown. No code fences. No explanation.
- Each prompt must be under 40 words
- Each textPrompt must be under 15 words
- No special characters, no emojis, use only basic ASCII in all values
- Include "with empty white caption bars at top and bottom" in every prompt

Output this exact structure with 8 items:
{"suggestions":[{"summary":"2-4 words","prompt":"visual scene description under 40 words","textPrompt":"humor direction under 15 words"}]}`

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
      temperature: 0.5,
      max_tokens: 3000,
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
    let suggestions: any[] = []
    try {
      const parsed = JSON.parse(jsonStr)
      suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions || []
    } catch {
      try {
        const arrayMatch = jsonStr.match(/\[[\s\S]*\]/)
        if (arrayMatch) {
          suggestions = JSON.parse(arrayMatch[0])
        } else {
          const objMatch = jsonStr.match(/\{[\s\S]*\}/)
          if (objMatch) {
            const parsed = JSON.parse(objMatch[0])
            suggestions = parsed.suggestions || []
          }
        }
      } catch (parseErr) {
        console.error('[analyze] JSON parse failed:', parseErr, '\nRaw:', raw.substring(0, 500))
      }
    }

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      console.error('[analyze] No valid suggestions extracted')
      return res.status(500).json({ error: 'Something went wrong. Please try again.' })
    }

    return res.status(200).json({ suggestions })
  } catch (e) {
    console.error('Analyze error:', e)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
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
