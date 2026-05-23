import postgres from 'postgres'

let sql: ReturnType<typeof postgres> | null = null

export function getDb() {
  if (!sql) {
    sql = postgres(process.env.POSTGRES_URL!)
  }
  return sql
}

export function parseReactions(r: unknown): Record<string, number> {
  if (typeof r === 'string') {
    try { return JSON.parse(r) } catch { return {} }
  }
  return (r as Record<string, number>) || {}
}
