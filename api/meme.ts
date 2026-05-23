import type { VercelRequest, VercelResponse } from '@vercel/node'
import { nanoid } from 'nanoid'
import { getDb } from './lib/db'

const DEFAULT_REACTIONS = { laugh: 0, fire: 0, 'cry-laugh': 0, '100': 0, skull: 0, heart: 0 }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  }

  const sql = getDb()
  const { imageUrl, exportedPngUrl, textFields, sessionId } = req.body || {}

  if (!imageUrl || !exportedPngUrl) {
    return res.status(400).json({ error: 'imageUrl and exportedPngUrl are required', code: 'MISSING_FIELDS' })
  }

  try {
    const memeId = nanoid(10)

    await sql`
      INSERT INTO memes (id, image_url, exported_png_url, text_fields, reactions, total_reactions, session_id)
      VALUES (
        ${memeId},
        ${imageUrl},
        ${exportedPngUrl},
        ${sql.json(textFields || [])},
        ${sql.json(DEFAULT_REACTIONS)},
        0,
        ${sessionId || null}
      )
    `

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

    return res.status(200).json({
      memeId,
      shareUrl: `${baseUrl}/m/${memeId}`,
      createdAt: new Date().toISOString(),
    })
  } catch (e) {
    console.error('Meme save error:', e)
    return res.status(500).json({ error: 'Failed to save meme', code: 'SAVE_ERROR' })
  }
}
