import type { VercelRequest, VercelResponse } from '@vercel/node'
import postgres from 'postgres'
import { createHash } from 'crypto'

const VALID_REACTIONS = ['laugh', 'fire', 'cry-laugh', '100', 'skull', 'heart']

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  }

  const { memeId, reaction } = req.body || {}

  if (!memeId || !reaction) {
    return res.status(400).json({ error: 'memeId and reaction are required', code: 'MISSING_FIELDS' })
  }

  if (!VALID_REACTIONS.includes(reaction)) {
    return res.status(400).json({ error: 'Invalid reaction type', code: 'INVALID_REACTION' })
  }

  const ip = req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown'
  const ua = req.headers['user-agent'] || 'unknown'
  const fingerprint = createHash('sha256').update(`${ip}:${ua}`).digest('hex').slice(0, 16)

  const sql = postgres(process.env.DATABASE_URL!)

  try {
    const existing = await sql`
      SELECT id FROM reaction_log
      WHERE meme_id = ${memeId} AND reaction = ${reaction} AND visitor_fingerprint = ${fingerprint}
    `

    if (existing.length > 0) {
      await sql.end()
      return res.status(409).json({ error: 'Already reacted with this emoji', code: 'DUPLICATE_REACTION' })
    }

    await sql`
      INSERT INTO reaction_log (meme_id, reaction, visitor_fingerprint)
      VALUES (${memeId}, ${reaction}, ${fingerprint})
    `

    await sql`
      UPDATE memes
      SET reactions = jsonb_set(reactions, ${`{${reaction}}`}::text[], (COALESCE((reactions->>${reaction})::int, 0) + 1)::text::jsonb),
          total_reactions = total_reactions + 1
      WHERE id = ${memeId}
    `

    const rows = await sql`
      SELECT reactions FROM memes WHERE id = ${memeId}
    `

    await sql.end()
    return res.status(200).json({
      success: true,
      reactions: rows[0]?.reactions || {},
    })
  } catch (e) {
    console.error('React error:', e)
    await sql.end()
    return res.status(500).json({ error: 'Failed to add reaction', code: 'REACT_ERROR' })
  }
}
