import postgres from 'postgres'

const globalForDb = globalThis as unknown as { db: ReturnType<typeof postgres> }

export const db =
  globalForDb.db ??
  postgres(process.env.DATABASE_URL!, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
  })

if (process.env.NODE_ENV !== 'production') globalForDb.db = db
