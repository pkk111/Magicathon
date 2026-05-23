import type { VercelRequest, VercelResponse } from '@vercel/node'
import postgres from 'postgres'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  }

  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Missing meme id', code: 'MISSING_ID' })
  }

  const sql = postgres(process.env.POSTGRES_URL!)

  try {
    const rows = await sql`
      SELECT id, image_url, exported_png_url, text_fields, reactions, total_reactions, created_at
      FROM memes WHERE id = ${id}
    `

    if (rows.length === 0) {
      await sql.end()
      return res.status(404).json({ error: 'Meme not found', code: 'NOT_FOUND' })
    }

    const meme = rows[0]!
    await sql.end()
    return res.status(200).json({
      memeId: meme.id,
      imageUrl: meme.image_url,
      exportedPngUrl: meme.exported_png_url,
      textFields: meme.text_fields,
      reactions: meme.reactions,
      totalReactions: meme.total_reactions,
      createdAt: meme.created_at,
    })
  } catch (e) {
    console.error('Meme fetch error:', e)
    await sql.end()
    return res.status(500).json({ error: 'Failed to fetch meme', code: 'FETCH_ERROR' })
  }
}
