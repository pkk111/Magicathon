import type { VercelRequest, VercelResponse } from '@vercel/node'
import OpenAI from 'openai'
import { CAPTION_PROMPT } from './lib/prompts'

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
      max_tokens: 2000,
    })

    const captionRaw = captionCompletion.choices[0]?.message?.content
    if (!captionRaw) {
      return res.status(500).json({ error: 'Something went wrong. Please try again.' })
    }

    console.log(`[suggest] Caption generation: ${Date.now() - t0}ms`)
    console.log(`[suggest] Caption raw (first 300):`, captionRaw.substring(0, 300))

    let captionJson = captionRaw.replace(/^```\w*\n?/g, '').replace(/\n?```\s*$/g, '').trim()
    // Fix common JSON issues from LLMs: trailing commas, unescaped control chars
    captionJson = captionJson.replace(/,\s*([}\]])/g, '$1').replace(/[\x00-\x1f]/g, ' ')

    let captions: any[]
    try {
      const parsed = JSON.parse(captionJson)
      if (Array.isArray(parsed)) {
        captions = parsed[0]?.captions ? parsed[0].captions : parsed
      } else {
        captions = parsed.captions || [parsed]
      }
    } catch (e1) {
      console.error('[suggest] Caption JSON parse failed:', e1)
      try {
        const match = captionJson.match(/\[[\s\S]*\]/)
        if (match) {
          const cleaned = match[0].replace(/,\s*([}\]])/g, '$1')
          captions = JSON.parse(cleaned)
        } else {
          const objMatch = captionJson.match(/\{[\s\S]*\}/)
          if (objMatch) {
            const parsed = JSON.parse(objMatch[0])
            captions = parsed.captions || [parsed]
          } else {
            return res.status(500).json({ error: 'Something went wrong. Please try again.' })
          }
        }
      } catch (e2) {
        console.error('[suggest] Caption fallback parse failed:', e2)
        return res.status(500).json({ error: 'Something went wrong. Please try again.' })
      }
    }

    if (!Array.isArray(captions) || captions.length === 0) {
      console.error('[suggest] No captions parsed')
      return res.status(500).json({ error: 'Something went wrong. Please try again.' })
    }

    console.log(`[suggest] Captions parsed: ${captions.length} captions`)
    console.log(`[suggest] Total: ${Date.now() - t0}ms`)

    // Build suggestions directly from captions — no second LLM call needed
    const suggestions = captions.map((c: any, i: number) => {
      const top = c.top || c.topText?.text || c.topText || ''
      const bottom = c.bottom || c.bottomText?.text || c.bottomText || ''
      const color = c.color || '#FFFFFF'
      const fontSize = c.fontSize || getFontSize(Math.max(top.split(' ').length, bottom.split(' ').length))
      return {
        id: String(i + 1),
        humor_style: 'custom',
        confidence: 0.9,
        editorConfig: { defaultTabId: 'Annotate', defaultToolId: 'Text', filter: 'none' },
        annotations: {
          'text-0': {
            id: 'text-0', name: 'Text', text: top,
            x: 960, y: 30, width: 800, height: 150,
            fontSize, fontFamily: 'Impact', fontStyle: 'bold', align: 'center',
            fill: color, stroke: '#000000', strokeWidth: 4, opacity: 1,
          },
          'text-1': {
            id: 'text-1', name: 'Text', text: bottom,
            x: 960, y: 820, width: 800, height: 150,
            fontSize, fontFamily: 'Impact', fontStyle: 'bold', align: 'center',
            fill: color, stroke: '#000000', strokeWidth: 4, opacity: 1,
          },
        },
      }
    })

    return res.status(200).json({
      suggestions,
      memeAnalysis: null,
      imageDescription: '',
    })
  } catch (e) {
    console.error('Suggest error:', e)
    return res.status(500).json({ error: 'Something went wrong. Please try again.' })
  }
}

function getFontSize(wordCount: number): number {
  if (wordCount <= 3) return 120
  if (wordCount <= 5) return 96
  if (wordCount <= 8) return 72
  return 56
}

