import type { VercelRequest, VercelResponse } from '@vercel/node'
import postgres from 'postgres'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed', code: 'METHOD_NOT_ALLOWED' })
  }

  const sql = postgres(process.env.POSTGRES_URL!)

  const page = parseInt(req.query.page as string) || 1
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 50)
  const offset = (page - 1) * limit

  try {
    const rows = await sql`
      SELECT id, exported_png_url, reactions, total_reactions, created_at, session_id
      FROM memes
      ORDER BY created_at DESC
      LIMIT ${limit + 1}
      OFFSET ${offset}
    `

    const hasMore = rows.length > limit
    const memes = rows.slice(0, limit).map(row => ({
      memeId: row.id,
      exportedPngUrl: row.exported_png_url,
      reactions: typeof row.reactions === 'string' ? JSON.parse(row.reactions) : row.reactions,
      totalReactions: row.total_reactions,
      createdAt: row.created_at,
      sessionId: row.session_id,
    }))

    return res.status(200).json({ memes, hasMore })
  } catch (e) {
    console.error('Feed error:', e)
    return res.status(500).json({ error: 'Failed to load feed', code: 'FEED_ERROR' })
  }
}
