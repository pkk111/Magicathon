import type { VercelRequest, VercelResponse } from '@vercel/node'
import OpenAI from 'openai'
import { CAPTION_PROMPT, POSITION_PROMPT } from './lib/prompts'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  }

  const { imageUrl, customPrompt } = req.body || {}
  if (!imageUrl) {
    return res.status(400).json({ error: 'imageUrl is required', code: 'MISSING_IMAGE_URL' })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenRouter API key not configured', code: 'MISSING_API_KEY' })
  }

  try {
    const openai = new OpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey })

    // Step 1: Generate caption text (no image needed, just the creative direction)
    const t0 = Date.now()
    const captionCompletion = await openai.chat.completions.create({
      model: 'google/gemini-2.0-flash-lite-001',
      messages: [
        {
          role: 'user',
          content: `${CAPTION_PROMPT}\n\nText generation direction: "${customPrompt || 'funny meme'}"`,
        },
      ],
      temperature: 1.0,
      max_tokens: 500,
    })

    const captionRaw = captionCompletion.choices[0]?.message?.content
    if (!captionRaw) {
      return res.status(500).json({ error: 'No caption response', code: 'EMPTY_RESPONSE' })
    }

    console.log(`[suggest] Caption generation: ${Date.now() - t0}ms`)

    const captionJson = captionRaw.replace(/^```json?\n?/g, '').replace(/\n?```$/g, '').trim()
    let captions: any[]
    try {
      const parsed = JSON.parse(captionJson)
      captions = Array.isArray(parsed) ? parsed : parsed.captions
    } catch {
      const match = captionJson.match(/\[[\s\S]*\]/)
      if (match) captions = JSON.parse(match[0])
      else return res.status(500).json({ error: 'Failed to parse captions', code: 'PARSE_ERROR' })
    }

    if (!Array.isArray(captions) || captions.length === 0) {
      return res.status(500).json({ error: 'No captions generated', code: 'EMPTY_CAPTIONS' })
    }

    // Step 2: Position text on the image (needs to see the image)
    const t1 = Date.now()
    const base64Image = await fetchImageAsBase64(imageUrl)
    if (!base64Image) {
      return res.status(400).json({ error: 'Could not fetch image', code: 'IMAGE_FETCH_FAILED' })
    }

    const captionText = captions.map((c: any) => {
      const top = typeof c.topText === 'string' ? c.topText : JSON.stringify(c.topText)
      const bottom = typeof c.bottomText === 'string' ? c.bottomText : JSON.stringify(c.bottomText)
      return `Caption ${c.id}:\n  Top: ${top}\n  Bottom: ${bottom}`
    }).join('\n\n')

    const positionCompletion = await openai.chat.completions.create({
      model: 'google/gemini-2.0-flash-lite-001',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: base64Image.dataUrl } },
            {
              type: 'text',
              text: `${POSITION_PROMPT}\n\nHere are the captions to position:\n${captionText}\n\nCreate ${captions.length} suggestion(s), one for each caption set. Position the text where it won't cover the main subject.`,
            },
          ],
        },
      ],
      temperature: 0.5,
      max_tokens: 2000,
    })

    const positionRaw = positionCompletion.choices[0]?.message?.content
    if (!positionRaw) {
      return res.status(500).json({ error: 'No position response', code: 'EMPTY_RESPONSE' })
    }

    console.log(`[suggest] Position generation: ${Date.now() - t1}ms`)
    console.log(`[suggest] Total: ${Date.now() - t0}ms`)

    const positionJson = positionRaw.replace(/^```json?\n?/g, '').replace(/\n?```$/g, '').trim()
    let suggestions: any[]
    try {
      const parsed = JSON.parse(positionJson)
      suggestions = Array.isArray(parsed) ? parsed : parsed.suggestions
    } catch {
      const match = positionJson.match(/\{[\s\S]*\}/)
      if (match) {
        const parsed = JSON.parse(match[0])
        suggestions = parsed.suggestions || [parsed]
      } else {
        return res.status(500).json({ error: 'Failed to parse positions', code: 'PARSE_ERROR' })
      }
    }

    if (!Array.isArray(suggestions) || suggestions.length === 0) {
      return res.status(500).json({ error: 'No suggestions generated', code: 'EMPTY_SUGGESTIONS' })
    }

    return res.status(200).json({
      suggestions,
      memeAnalysis: null,
      imageDescription: '',
    })
  } catch (e) {
    console.error('Suggest error:', e)
    const message = e instanceof Error ? e.message : 'Suggestion generation failed'
    return res.status(500).json({ error: message, code: 'SUGGEST_ERROR' })
  }
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
