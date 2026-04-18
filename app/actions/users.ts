'use server'

import bcrypt from 'bcryptjs'
import { db } from '@/app/lib/db'
import { getCurrentUser } from '@/app/lib/dal'
import {
  CreateUserSchema,
  ASSIGNABLE_ROLES,
  type CreateUserState,
  type Role,
} from '@/app/lib/definitions'

/** Returns the superset of roles the current user is allowed to assign. */
function getAllowedRoles(currentUserRoles: Role[]): Role[] {
  const allowed = new Set<Role>()
  for (const role of currentUserRoles) {
    for (const assignable of ASSIGNABLE_ROLES[role]) {
      allowed.add(assignable)
    }
  }
  return Array.from(allowed)
}

export async function createUser(
  _state: CreateUserState,
  formData: FormData,
): Promise<CreateUserState> {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return { message: 'Não autenticado.' }
  }

  const allowedRoles = getAllowedRoles(currentUser.roles)
  if (allowedRoles.length === 0) {
    return { message: 'Sem permissão para criar usuários.' }
  }

  const rawRoles = formData.getAll('roles') as Role[]

  const validated = CreateUserSchema.safeParse({
    username: formData.get('username'),
    password: formData.get('password'),
    roles: rawRoles,
  })

  if (!validated.success) {
    return { errors: validated.error.flatten().fieldErrors }
  }

  const { username, password, roles } = validated.data

  // Ensure the creator is allowed to assign every requested role
  const unauthorized = roles.filter((r) => !allowedRoles.includes(r))
  if (unauthorized.length > 0) {
    return {
      message: `Você não tem permissão para atribuir: ${unauthorized.join(', ')}.`,
    }
  }

  // Check for duplicate username
  const existing = await db`SELECT id FROM users WHERE username = ${username}`
  if (existing.length > 0) {
    return { errors: { username: ['Este usuário já está em uso.'] } }
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const [user] = await db`
    INSERT INTO users (username, password_hash)
    VALUES (${username}, ${passwordHash})
    RETURNING id
  `

  await db`
    INSERT INTO user_roles (user_id, role)
    SELECT ${user.id}, unnest(${roles}::user_role[])
  `

  return { success: true }
}
