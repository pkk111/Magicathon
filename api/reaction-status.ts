import type { VercelRequest, VercelResponse } from '@vercel/node'
import postgres from 'postgres'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { memeId, sessionId } = req.query
  if (!memeId || !sessionId || typeof memeId !== 'string' || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'memeId and sessionId are required' })
  }

  const sql = postgres(process.env.POSTGRES_URL!)

  try {
    const rows = await sql`
      SELECT reaction FROM reaction_log
      WHERE meme_id = ${memeId} AND visitor_fingerprint = ${sessionId}
      LIMIT 1
    `

    await sql.end()
    return res.status(200).json({
      reaction: rows.length > 0 ? rows[0]!.reaction : null,
    })
  } catch (e) {
    console.error('Reaction status error:', e)
    await sql.end()
    return res.status(500).json({ error: 'Failed to check reaction status' })
  }
}
