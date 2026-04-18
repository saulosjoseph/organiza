/**
 * Seed script — creates the initial admin user.
 *
 * Usage:
 *   npx tsx app/lib/seed.ts
 *
 * Set ADM_NAME, ADM_EMAIL and ADM_PASSWORD via environment variables
 * or edit the defaults below before running.
 */

import postgres from 'postgres'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const username = process.env.ADM_USERNAME ?? 'admin'
const password = process.env.ADM_PASSWORD ?? ''

async function main() {
  const db = postgres(process.env.DATABASE_URL!, { max: 1 })

  // Apply schema if not yet applied
  const schema = readFileSync(resolve('app/lib/schema.sql'), 'utf8')
  await db.unsafe(schema)

  // Check if user already exists
  const existing = await db`SELECT id FROM users WHERE username = ${username}`
  if (existing.length > 0) {
    console.log(`Usuário '${username}' já existe. Nenhuma ação necessária.`)
    await db.end()
    return
  }

  const hash = await bcrypt.hash(password, 12)

  const [user] = await db`
    INSERT INTO users (username, password_hash)
    VALUES (${username}, ${hash})
    RETURNING id
  `

  await db`
    INSERT INTO user_roles (user_id, role)
    VALUES (${user.id}, 'adm'), (${user.id}, 'base')
  `

  console.log(`✓ Usuário criado com sucesso!`)
  console.log(`  Usuário: ${username}`)
  console.log(`  Senha:   ${password}`)
  console.log(`  Perfis:  adm, base`)

  await db.end()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
