import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDb, parseReactions } from './lib/db.js'

const VALID_REACTIONS = ['laugh', 'fire', 'cry-laugh', '100', 'skull', 'heart']

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const sql = getDb()

  if (req.method === 'GET') {
    return handleGet(req, res, sql)
  }
  if (req.method === 'POST') {
    return handlePost(req, res, sql)
  }
  return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
}

async function handleGet(req: VercelRequest, res: VercelResponse, sql: ReturnType<typeof getDb>) {
  const { memeId, sessionId } = req.query
  if (!memeId || !sessionId || typeof memeId !== 'string' || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'memeId and sessionId are required' })
  }

  try {
    const [memeRows, userRows] = await Promise.all([
      sql`SELECT reactions FROM memes WHERE id = ${memeId}`,
      sql`SELECT reaction FROM reaction_log WHERE meme_id = ${memeId} AND visitor_fingerprint = ${sessionId} LIMIT 1`,
    ])

    return res.status(200).json({
      reactions: parseReactions(memeRows[0]?.reactions),
      userReaction: userRows[0]?.reaction || null,
    })
  } catch (e) {
    console.error('React GET error:', e)
    return res.status(500).json({ error: 'Failed to fetch reaction status' })
  }
}

async function handlePost(req: VercelRequest, res: VercelResponse, sql: ReturnType<typeof getDb>) {
  const { memeId, reaction, sessionId } = req.body || {}

  if (!memeId || !reaction || !sessionId) {
    return res.status(400).json({ error: 'memeId, reaction, and sessionId are required', code: 'MISSING_FIELDS' })
  }
  if (!VALID_REACTIONS.includes(reaction)) {
    return res.status(400).json({ error: 'Invalid reaction type', code: 'INVALID_REACTION' })
  }

  try {
    const existing = await sql`
      SELECT reaction FROM reaction_log
      WHERE meme_id = ${memeId} AND visitor_fingerprint = ${sessionId}
    `

    if (existing.length > 0) {
      const oldReaction = existing[0]!.reaction
      if (oldReaction !== reaction) {
        await sql`
          UPDATE reaction_log SET reaction = ${reaction}
          WHERE meme_id = ${memeId} AND visitor_fingerprint = ${sessionId}
        `
        await decrementReaction(sql, memeId, oldReaction)
        await incrementReaction(sql, memeId, reaction)
      }
    } else {
      await sql`
        INSERT INTO reaction_log (meme_id, reaction, visitor_fingerprint)
        VALUES (${memeId}, ${reaction}, ${sessionId})
      `
      await sql.unsafe(
        `UPDATE memes SET reactions = jsonb_set(reactions, $1::text[], (COALESCE((reactions->>$2)::int, 0) + 1)::text::jsonb), total_reactions = total_reactions + 1 WHERE id = $3`,
        [`{${reaction}}`, reaction, memeId]
      )
    }

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

async function incrementReaction(sql: ReturnType<typeof getDb>, memeId: string, reaction: string) {
  await sql.unsafe(
    `UPDATE memes SET reactions = jsonb_set(reactions, $1::text[], (COALESCE((reactions->>$2)::int, 0) + 1)::text::jsonb) WHERE id = $3`,
    [`{${reaction}}`, reaction, memeId]
  )
}

async function decrementReaction(sql: ReturnType<typeof getDb>, memeId: string, reaction: string) {
  await sql.unsafe(
    `UPDATE memes SET reactions = jsonb_set(reactions, $1::text[], (GREATEST(COALESCE((reactions->>$2)::int, 0) - 1, 0))::text::jsonb) WHERE id = $3`,
    [`{${reaction}}`, reaction, memeId]
  )
}
