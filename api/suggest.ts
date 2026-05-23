import type { VercelRequest, VercelResponse } from '@vercel/node'
import OpenAI from 'openai'
import { buildSystemPrompt } from './lib/prompts'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  }

  const { imageUrl, theme, customPrompt } = req.body || {}
  if (!imageUrl) {
    return res.status(400).json({ error: 'imageUrl is required', code: 'MISSING_IMAGE_URL' })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenRouter API key not configured', code: 'MISSING_API_KEY' })
  }

  const systemPrompt = buildSystemPrompt(theme, customPrompt)

  try {
    const base64Image = await fetchImageAsBase64(imageUrl)
    if (!base64Image) {
      return res.status(400).json({ error: 'Could not fetch image', code: 'IMAGE_FETCH_FAILED' })
    }

    const openai = new OpenAI({ baseURL: 'https://openrouter.ai/api/v1', apiKey })

    const completion = await openai.chat.completions.create({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: base64Image.dataUrl } },
            { type: 'text', text: 'Analyze this image and generate meme suggestions following your instructions.' },
          ],
        },
      ],
      temperature: 0.9,
      max_tokens: 4000,
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) {
      return res.status(500).json({ error: 'No response from model', code: 'EMPTY_RESPONSE' })
    }

    const jsonStr = raw.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim()
    const parsed = JSON.parse(jsonStr)

    if (!parsed.suggestions || !Array.isArray(parsed.suggestions) || parsed.suggestions.length === 0) {
      return res.status(500).json({ error: 'Invalid response structure', code: 'INVALID_RESPONSE' })
    }

    return res.status(200).json({
      suggestions: parsed.suggestions,
      memeAnalysis: parsed.memeAnalysis || null,
      imageDescription: parsed.memeAnalysis?.detectedContext || '',
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
