/**
 * Migration script — applies the full schema idempotently.
 *
 * Usage:
 *   DATABASE_URL=... npx tsx app/lib/migrate.ts
 */

import postgres from 'postgres'
import { readFileSync } from 'fs'
import { resolve } from 'path'

async function main() {
  const db = postgres(process.env.DATABASE_URL!, { max: 1 })
  const schema = readFileSync(resolve('app/lib/schema.sql'), 'utf8')
  await db.unsafe(schema)
  console.log('✓ Schema aplicado com sucesso.')
  await db.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
