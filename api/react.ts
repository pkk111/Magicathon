import type { VercelRequest, VercelResponse } from '@vercel/node'
import postgres from 'postgres'

const VALID_REACTIONS = ['laugh', 'fire', 'cry-laugh', '100', 'skull', 'heart']

function parseReactions(r: any): Record<string, number> {
  if (typeof r === 'string') {
    try { return JSON.parse(r) } catch { return {} }
  }
  return r || {}
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sql = postgres(process.env.POSTGRES_URL!)

  // GET: fetch current reactions + user's selection
  if (req.method === 'GET') {
    const { memeId, sessionId } = req.query
    if (!memeId || !sessionId || typeof memeId !== 'string' || typeof sessionId !== 'string') {
      return res.status(400).json({ error: 'memeId and sessionId are required' })
    }
    try {
      const memeRows = await sql`SELECT reactions FROM memes WHERE id = ${memeId}`
      const userRows = await sql`
        SELECT reaction FROM reaction_log
        WHERE meme_id = ${memeId} AND visitor_fingerprint = ${sessionId}
        LIMIT 1
      `
      return res.status(200).json({
        reactions: parseReactions(memeRows[0]?.reactions),
        userReaction: userRows[0]?.reaction || null,
      })
    } catch (e) {
      console.error('React GET error:', e)
      return res.status(500).json({ error: 'Failed to fetch reaction status' })
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  }

  const { memeId, reaction, sessionId } = req.body || {}

  if (!memeId || !reaction || !sessionId) {
    return res.status(400).json({ error: 'memeId, reaction, and sessionId are required', code: 'MISSING_FIELDS' })
  }

  if (!VALID_REACTIONS.includes(reaction)) {
    return res.status(400).json({ error: 'Invalid reaction type', code: 'INVALID_REACTION' })
  }

  try {
    // Check if user already reacted to this meme
    const existing = await sql`
      SELECT reaction FROM reaction_log
      WHERE meme_id = ${memeId} AND visitor_fingerprint = ${sessionId}
    `

    if (existing.length > 0) {
      const oldReaction = existing[0]!.reaction

      if (oldReaction === reaction) {
        // Same reaction clicked again — return current state
        const rows = await sql`SELECT reactions FROM memes WHERE id = ${memeId}`
        return res.status(200).json({
          success: true,
          reactions: parseReactions(rows[0]?.reactions),
          userReaction: reaction,
        })
      }

      // Change reaction: update log, decrement old, increment new
      await sql`
        UPDATE reaction_log SET reaction = ${reaction}
        WHERE meme_id = ${memeId} AND visitor_fingerprint = ${sessionId}
      `

      const oldPath = `{${oldReaction}}`
      await sql.unsafe(
        `UPDATE memes SET reactions = jsonb_set(reactions, $1::text[], (GREATEST(COALESCE((reactions->>$2)::int, 0) - 1, 0))::text::jsonb) WHERE id = $3`,
        [oldPath, oldReaction, memeId]
      )

      const newPath = `{${reaction}}`
      await sql.unsafe(
        `UPDATE memes SET reactions = jsonb_set(reactions, $1::text[], (COALESCE((reactions->>$2)::int, 0) + 1)::text::jsonb) WHERE id = $3`,
        [newPath, reaction, memeId]
      )
    } else {
      // First reaction from this user
      await sql`
        INSERT INTO reaction_log (meme_id, reaction, visitor_fingerprint)
        VALUES (${memeId}, ${reaction}, ${sessionId})
      `

      const path = `{${reaction}}`
      await sql.unsafe(
        `UPDATE memes SET reactions = jsonb_set(reactions, $1::text[], (COALESCE((reactions->>$2)::int, 0) + 1)::text::jsonb), total_reactions = total_reactions + 1 WHERE id = $3`,
        [path, reaction, memeId]
      )
    }

    // Fetch updated state
    const rows = await sql`SELECT reactions FROM memes WHERE id = ${memeId}`

    return res.status(200).json({
      success: true,
      reactions: parseReactions(rows[0]?.reactions),
      userReaction: reaction,
    })
  } catch (e) {
    console.error('React error:', e)
    return res.status(500).json({ error: 'Failed to add reaction', code: 'REACT_ERROR' })
  }
}
