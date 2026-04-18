import 'server-only'
import { db } from '@/app/lib/db'
import { getSession } from '@/app/lib/session'
import type { User, Role, Nucleo, NucleoDetail, KanbanBoard, KanbanColumn, RecurringActivity } from '@/app/lib/definitions'

type UserRow = {
  id: string
  username: string
  password_hash: string
  created_at: Date
}

type UserWithRoles = UserRow & { roles: Role[] }

export async function getUserByUsername(
  username: string,
): Promise<UserWithRoles | null> {
  const rows = await db<
    Array<UserRow & { role: Role | null }>
  >`
    SELECT u.id, u.username, u.password_hash, u.created_at, ur.role
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    WHERE u.username = ${username}
  `
  if (rows.length === 0) return null
  return {
    ...rows[0],
    roles: rows.map((r) => r.role).filter((r): r is Role => r !== null),
  }
}

export async function getUserById(id: string): Promise<UserWithRoles | null> {
  const rows = await db<
    Array<UserRow & { role: Role | null }>
  >`
    SELECT u.id, u.username, u.password_hash, u.created_at, ur.role
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    WHERE u.id = ${id}
  `
  if (rows.length === 0) return null
  return {
    ...rows[0],
    roles: rows.map((r) => r.role).filter((r): r is Role => r !== null),
  }
}

export async function getAllUsers(): Promise<User[]> {
  const rows = await db<
    Array<{ id: string; username: string; created_at: Date; role: Role | null }>
  >`
    SELECT u.id, u.username, u.created_at, ur.role
    FROM users u
    LEFT JOIN user_roles ur ON ur.user_id = u.id
    ORDER BY u.created_at DESC
  `
  const map = new Map<string, User>()
  for (const row of rows) {
    if (!map.has(row.id)) {
      map.set(row.id, {
        id: row.id,
        username: row.username,
        roles: [],
        created_at: row.created_at,
      })
    }
    if (row.role) {
      map.get(row.id)!.roles.push(row.role)
    }
  }
  return Array.from(map.values())
}

/**
 * Returns users visible to the current user based on their roles:
 * - adm / comite_central  → all users
 * - uniao_comite_local    → linked comite_locais + base users in their nucleos
 * - comite_local          → users in nucleos they own or belong to
 * - base                  → members of the same nucleos
 */
export async function getUsersVisibleTo(userId: string, roles: Role[]): Promise<User[]> {
  if (roles.includes('adm') || roles.includes('comite_central')) {
    return getAllUsers()
  }

  type RowType = { id: string; username: string; created_at: Date; role: Role | null }
  let rows: RowType[]

  if (roles.includes('uniao_comite_local')) {
    rows = await db<RowType[]>`
      SELECT u.id, u.username, u.created_at, ur.role
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      WHERE u.id = ${userId}
         OR u.id IN (
           SELECT ucm.comite_local_id
           FROM uniao_comite_local_members ucm
           WHERE ucm.uniao_id = ${userId}
         )
         OR u.id IN (
           SELECT nm.user_id
           FROM nucleo_members nm
           JOIN nucleos n ON n.id = nm.nucleo_id
           WHERE n.owner_id IN (
             SELECT ucm.comite_local_id
             FROM uniao_comite_local_members ucm
             WHERE ucm.uniao_id = ${userId}
           )
         )
      ORDER BY u.created_at DESC
    `
  } else if (roles.includes('comite_local')) {
    rows = await db<RowType[]>`
      SELECT u.id, u.username, u.created_at, ur.role
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      WHERE u.id = ${userId}
         OR u.id IN (
           SELECT nm.user_id
           FROM nucleo_members nm
           JOIN nucleos n ON n.id = nm.nucleo_id
           WHERE n.owner_id = ${userId}
              OR n.id IN (
                SELECT nm2.nucleo_id FROM nucleo_members nm2 WHERE nm2.user_id = ${userId}
              )
         )
      ORDER BY u.created_at DESC
    `
  } else {
    // base — users in the same nucleos
    rows = await db<RowType[]>`
      SELECT u.id, u.username, u.created_at, ur.role
      FROM users u
      LEFT JOIN user_roles ur ON ur.user_id = u.id
      WHERE u.id = ${userId}
         OR u.id IN (
           SELECT nm2.user_id
           FROM nucleo_members nm
           JOIN nucleo_members nm2 ON nm2.nucleo_id = nm.nucleo_id
           WHERE nm.user_id = ${userId}
         )
      ORDER BY u.created_at DESC
    `
  }

  const map = new Map<string, User>()
  for (const row of rows) {
    if (!map.has(row.id)) {
      map.set(row.id, { id: row.id, username: row.username, roles: [], created_at: row.created_at })
    }
    if (row.role) map.get(row.id)!.roles.push(row.role)
  }
  return Array.from(map.values())
}

/** Returns the currently authenticated user or null. */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession()
  if (!session) return null
  const user = await getUserById(session.userId)
  if (!user) return null
  return {
    id: user.id,
    username: user.username,
    roles: user.roles,
    created_at: user.created_at,
  }
}

// ─── Núcleos ─────────────────────────────────────────────────────────────────

/**
 * Returns nucleos visible to the current user based on their roles:
 * - adm / comite_central → all nucleos
 * - uniao_comite_local   → nucleos owned by comite_locais linked to them
 * - comite_local         → nucleos they own
 * - base                 → nucleos they are members of
 */
export async function getNucleosForUser(userId: string, roles: Role[]): Promise<Nucleo[]> {
  const isAdminLike = roles.includes('adm') || roles.includes('comite_central')
  const isUniao     = roles.includes('uniao_comite_local')
  const isLocal     = roles.includes('comite_local')

  type NucleoRow = { id: string; name: string; owner_id: string; owner_username: string; member_count: string; created_at: Date }

  let rows: NucleoRow[]

  if (isAdminLike) {
    rows = await db<NucleoRow[]>`
      SELECT n.id, n.name, n.owner_id, u.username AS owner_username,
             COUNT(nm.user_id)::text AS member_count, n.created_at
      FROM nucleos n
      JOIN users u ON u.id = n.owner_id
      LEFT JOIN nucleo_members nm ON nm.nucleo_id = n.id
      GROUP BY n.id, u.username
      ORDER BY n.created_at DESC
    `
  } else if (isUniao) {
    rows = await db<NucleoRow[]>`
      SELECT n.id, n.name, n.owner_id, u.username AS owner_username,
             COUNT(nm.user_id)::text AS member_count, n.created_at
      FROM nucleos n
      JOIN users u ON u.id = n.owner_id
      JOIN uniao_comite_local_members ucm ON ucm.comite_local_id = n.owner_id
      LEFT JOIN nucleo_members nm ON nm.nucleo_id = n.id
      WHERE ucm.uniao_id = ${userId}
      GROUP BY n.id, u.username
      ORDER BY n.created_at DESC
    `
  } else if (isLocal) {
    rows = await db<NucleoRow[]>`
      SELECT n.id, n.name, n.owner_id, u.username AS owner_username,
             COUNT(nm.user_id)::text AS member_count, n.created_at
      FROM nucleos n
      JOIN users u ON u.id = n.owner_id
      LEFT JOIN nucleo_members nm ON nm.nucleo_id = n.id
      WHERE n.owner_id = ${userId}
         OR EXISTS (SELECT 1 FROM nucleo_members nm2 WHERE nm2.nucleo_id = n.id AND nm2.user_id = ${userId})
      GROUP BY n.id, u.username
      ORDER BY n.created_at DESC
    `
  } else {
    // base — only nucleos they are members of
    rows = await db<NucleoRow[]>`
      SELECT n.id, n.name, n.owner_id, u.username AS owner_username,
             COUNT(nm2.user_id)::text AS member_count, n.created_at
      FROM nucleos n
      JOIN users u ON u.id = n.owner_id
      JOIN nucleo_members nm ON nm.nucleo_id = n.id AND nm.user_id = ${userId}
      LEFT JOIN nucleo_members nm2 ON nm2.nucleo_id = n.id
      GROUP BY n.id, u.username
      ORDER BY n.created_at DESC
    `
  }

  return rows.map((r) => ({ ...r, member_count: Number(r.member_count) }))
}

export async function getNucleoById(id: string, requesterId: string, requesterRoles: Role[]): Promise<NucleoDetail | null> {
  const [row] = await db<Array<{ id: string; name: string; owner_id: string; owner_username: string; created_at: Date }>>`
    SELECT n.id, n.name, n.owner_id, u.username AS owner_username, n.created_at
    FROM nucleos n
    JOIN users u ON u.id = n.owner_id
    WHERE n.id = ${id}
  `
  if (!row) return null

  // Access check
  const canAccess = await canAccessNucleo(requesterId, requesterRoles, id, row.owner_id)
  if (!canAccess) return null

  const members = await db<Array<{ id: string; username: string }>>`
    SELECT u.id, u.username
    FROM nucleo_members nm
    JOIN users u ON u.id = nm.user_id
    WHERE nm.nucleo_id = ${id}
    ORDER BY u.username
  `

  const boards = await db<Array<{ id: string; name: string; created_at: Date }>>`
    SELECT id, name, created_at
    FROM kanban_boards
    WHERE nucleo_id = ${id}
    ORDER BY created_at DESC
  `

  return { ...row, member_count: members.length, members, boards }
}

async function canAccessNucleo(
  userId: string,
  roles: Role[],
  nucleoId: string,
  ownerId: string,
): Promise<boolean> {
  if (roles.includes('adm') || roles.includes('comite_central')) return true
  if (roles.includes('comite_local')) {
    if (ownerId === userId) return true
    const [member] = await db`
      SELECT 1 FROM nucleo_members WHERE nucleo_id = ${nucleoId} AND user_id = ${userId}
    `
    if (member) return true
  }
  if (roles.includes('uniao_comite_local')) {
    const [link] = await db`
      SELECT 1 FROM uniao_comite_local_members
      WHERE uniao_id = ${userId} AND comite_local_id = ${ownerId}
    `
    if (link) return true
  }
  // base — check membership
  const [member] = await db`
    SELECT 1 FROM nucleo_members WHERE nucleo_id = ${nucleoId} AND user_id = ${userId}
  `
  return !!member
}

/** Returns all users with role 'base' NOT already members of the given nucleo. */
export async function getBaseUsersNotInNucleo(nucleoId: string): Promise<{ id: string; username: string }[]> {
  return db`
    SELECT u.id, u.username
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.id AND ur.role = 'base'
    WHERE u.id NOT IN (
      SELECT user_id FROM nucleo_members WHERE nucleo_id = ${nucleoId}
    )
    ORDER BY u.username
  `
}

/** Returns comite_local users NOT already linked to the given uniao. */
export async function getComiteLocaisNotLinked(uniao_id: string): Promise<{ id: string; username: string }[]> {
  return db`
    SELECT u.id, u.username
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.id AND ur.role = 'comite_local'
    WHERE u.id NOT IN (
      SELECT comite_local_id FROM uniao_comite_local_members WHERE uniao_id = ${uniao_id}
    )
    ORDER BY u.username
  `
}

/** Returns comite_local users linked to the given uniao. */
export async function getLinkedComiteLocais(uniao_id: string): Promise<{ id: string; username: string }[]> {
  return db`
    SELECT u.id, u.username
    FROM users u
    JOIN uniao_comite_local_members ucm ON ucm.comite_local_id = u.id
    WHERE ucm.uniao_id = ${uniao_id}
    ORDER BY u.username
  `
}

// ─── Kanban ───────────────────────────────────────────────────────────────────

export async function getBoardById(boardId: string, requesterId: string, requesterRoles: Role[]): Promise<KanbanBoard | null> {
  const [board] = await db<Array<{ id: string; nucleo_id: string; name: string; created_by: string; created_at: Date; owner_id: string }>>`
    SELECT kb.id, kb.nucleo_id, kb.name, kb.created_by, kb.created_at, n.owner_id
    FROM kanban_boards kb
    JOIN nucleos n ON n.id = kb.nucleo_id
    WHERE kb.id = ${boardId}
  `
  if (!board) return null

  const canAccess = await canAccessNucleo(requesterId, requesterRoles, board.nucleo_id, board.owner_id)
  if (!canAccess) return null

  const cards = await db<Array<{
    id: string; board_id: string; column: KanbanColumn; title: string
    description: string | null; assignee_id: string | null; assignee_username: string | null
    due_date: string | null; position: number; created_at: Date; updated_at: Date
  }>>`
    SELECT kc.id, kc.board_id, kc.card_column AS column, kc.title, kc.description,
           kc.assignee_id, u.username AS assignee_username,
           kc.due_date::text AS due_date,
           kc.position, kc.created_at, kc.updated_at
    FROM kanban_cards kc
    LEFT JOIN users u ON u.id = kc.assignee_id
    WHERE kc.board_id = ${boardId}
    ORDER BY kc.card_column, kc.position, kc.created_at
  `

  return { id: board.id, nucleo_id: board.nucleo_id, name: board.name, created_by: board.created_by, created_at: board.created_at, cards }
}

/** Returns all users accessible within a nucleo for the "assignee" selector. */
export async function getNucleoUsersForAssignment(nucleoId: string): Promise<{ id: string; username: string }[]> {
  return db`
    SELECT DISTINCT u.id, u.username
    FROM users u
    WHERE u.id IN (
      SELECT owner_id FROM nucleos WHERE id = ${nucleoId}
      UNION
      SELECT user_id FROM nucleo_members WHERE nucleo_id = ${nucleoId}
    )
    ORDER BY u.username
  `
}

export async function getRecurringActivities(nucleoId: string): Promise<RecurringActivity[]> {
  const rows = await db<Array<{
    id: string; nucleo_id: string; title: string; description: string | null
    recurrence: string; start_date: Date; next_date: Date; created_by: string; created_at: Date
  }>>`
    SELECT id, nucleo_id, title, description, recurrence, start_date, next_date, created_by, created_at
    FROM recurring_activities
    WHERE nucleo_id = ${nucleoId}
    ORDER BY next_date ASC, created_at ASC
  `
  return rows.map((r) => ({
    ...r,
    recurrence: r.recurrence as RecurringActivity['recurrence'],
    start_date: r.start_date instanceof Date ? r.start_date.toISOString().split('T')[0] : String(r.start_date),
    next_date: r.next_date instanceof Date ? r.next_date.toISOString().split('T')[0] : String(r.next_date),
  }))
}
