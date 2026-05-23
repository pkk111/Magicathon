import type { VercelRequest, VercelResponse } from '@vercel/node'
import postgres from 'postgres'
import { nanoid } from 'nanoid'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  }

  const sql = postgres(process.env.DATABASE_URL!)

  const { imageUrl, exportedPngUrl, textFields, sessionId } = req.body || {}

  if (!imageUrl || !exportedPngUrl) {
    return res.status(400).json({ error: 'imageUrl and exportedPngUrl are required', code: 'MISSING_FIELDS' })
  }

  try {
    const memeId = nanoid(10)
    const reactions = { laugh: 0, fire: 0, 'cry-laugh': 0, '100': 0, skull: 0, heart: 0 }

    await sql`
      INSERT INTO memes (id, image_url, exported_png_url, text_fields, reactions, total_reactions, session_id)
      VALUES (${memeId}, ${imageUrl}, ${exportedPngUrl}, ${JSON.stringify(textFields || [])}, ${JSON.stringify(reactions)}, 0, ${sessionId || null})
    `

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'

    await sql.end()
    return res.status(200).json({
      memeId,
      shareUrl: `${baseUrl}/m/${memeId}`,
      createdAt: new Date().toISOString(),
    })
  } catch (e) {
    console.error('Meme save error:', e)
    await sql.end()
    return res.status(500).json({ error: 'Failed to save meme', code: 'SAVE_ERROR' })
  }
}
