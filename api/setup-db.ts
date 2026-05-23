import type { VercelRequest, VercelResponse } from '@vercel/node'
import postgres from 'postgres'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const sql = postgres(process.env.POSTGRES_URL!)

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS memes (
        id TEXT PRIMARY KEY,
        image_url TEXT NOT NULL,
        exported_png_url TEXT NOT NULL,
        text_fields JSONB NOT NULL DEFAULT '[]',
        reactions JSONB NOT NULL DEFAULT '{"laugh":0,"fire":0,"cry-laugh":0,"100":0,"skull":0,"heart":0}',
        total_reactions INTEGER NOT NULL DEFAULT 0,
        session_id TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS reaction_log (
        id SERIAL PRIMARY KEY,
        meme_id TEXT NOT NULL REFERENCES memes(id),
        reaction TEXT NOT NULL,
        visitor_fingerprint TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(meme_id, reaction, visitor_fingerprint)
      )
    `

    return res.status(200).json({ success: true, message: 'Tables created' })
  } catch (e) {
    console.error('DB setup error:', e)
    return res.status(500).json({ error: 'Failed to set up database', details: String(e) })
  }
}
