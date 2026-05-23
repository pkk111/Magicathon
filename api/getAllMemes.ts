import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getDb, parseReactions } from './lib/db'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  }

  const sql = getDb()
  const page = parseInt(req.query.page as string) || 1
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)
  const offset = (page - 1) * limit
  const sessionId = req.query.sessionId as string || ''

  try {
    const t0 = Date.now()
    const rows = await sql`
      SELECT id, exported_png_url, reactions, total_reactions, created_at, session_id
      FROM memes
      ORDER BY created_at DESC
      LIMIT ${limit + 1}
      OFFSET ${offset}
    `
    console.log(`[feed] Memes query: ${Date.now() - t0}ms, rows: ${rows.length}`)

    const memeIds = rows.slice(0, limit).map(r => r.id)

    let userReactions: Record<string, string> = {}
    if (sessionId && memeIds.length > 0) {
      const t1 = Date.now()
      const reactionRows = await sql`
        SELECT meme_id, reaction FROM reaction_log
        WHERE visitor_fingerprint = ${sessionId} AND meme_id IN ${sql(memeIds)}
      `
      console.log(`[feed] Reactions query: ${Date.now() - t1}ms, rows: ${reactionRows.length}`)
      for (const r of reactionRows) {
        userReactions[r.meme_id] = r.reaction
      }
    }

    const hasMore = rows.length > limit
    const memes = rows.slice(0, limit).map(row => ({
      memeId: row.id,
      exportedPngUrl: row.exported_png_url,
      reactions: parseReactions(row.reactions),
      totalReactions: row.total_reactions,
      createdAt: row.created_at,
      sessionId: row.session_id,
      userReaction: userReactions[row.id] || null,
    }))

    return res.status(200).json({ memes, hasMore })
  } catch (e) {
    console.error('Feed error:', e)
    return res.status(500).json({ error: 'Failed to load feed', code: 'FEED_ERROR' })
  }
}
