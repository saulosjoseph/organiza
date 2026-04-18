'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { db } from '@/app/lib/db'
import { getCurrentUser } from '@/app/lib/dal'
import {
  CreateBoardSchema,
  CreateCardSchema,
  UpdateCardSchema,
  KANBAN_COLUMNS,
  type CreateBoardState,
  type CreateCardState,
  type UpdateCardState,
  type KanbanColumn,
} from '@/app/lib/definitions'

async function assertBoardAccess(boardId: string): Promise<{ nucleoId: string } | null> {
  const user = await getCurrentUser()
  if (!user) return null

  const [row] = await db<Array<{ nucleo_id: string; owner_id: string }>>`
    SELECT kb.nucleo_id, n.owner_id
    FROM kanban_boards kb
    JOIN nucleos n ON n.id = kb.nucleo_id
    WHERE kb.id = ${boardId}
  `
  if (!row) return null

  // adm / comite_central always have access
  if (user.roles.includes('adm') || user.roles.includes('comite_central')) {
    return { nucleoId: row.nucleo_id }
  }

  // comite_local — owns the nucleo
  if (user.roles.includes('comite_local') && row.owner_id === user.id) {
    return { nucleoId: row.nucleo_id }
  }

  // uniao_comite_local — linked to the owner
  if (user.roles.includes('uniao_comite_local')) {
    const [link] = await db`
      SELECT 1 FROM uniao_comite_local_members
      WHERE uniao_id = ${user.id} AND comite_local_id = ${row.owner_id}
    `
    if (link) return { nucleoId: row.nucleo_id }
  }

  // base — is a member of the nucleo
  const [member] = await db`
    SELECT 1 FROM nucleo_members WHERE nucleo_id = ${row.nucleo_id} AND user_id = ${user.id}
  `
  if (member) return { nucleoId: row.nucleo_id }

  return null
}

export async function createBoard(
  _state: CreateBoardState,
  formData: FormData,
): Promise<CreateBoardState> {
  const user = await getCurrentUser()
  if (!user) return { message: 'Não autenticado.' }

  const validated = CreateBoardSchema.safeParse({
    nucleo_id: formData.get('nucleo_id'),
    name: formData.get('name'),
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const { nucleo_id, name } = validated.data

  // Any member (or privileged user) can create boards in a nucleo they can access
  const [nucleo] = await db<Array<{ owner_id: string }>>`
    SELECT owner_id FROM nucleos WHERE id = ${nucleo_id}
  `
  if (!nucleo) return { message: 'Núcleo não encontrado.' }

  // Check member access
  const isPrivileged = user.roles.includes('adm') || user.roles.includes('comite_central')
  const isOwner = user.roles.includes('comite_local') && nucleo.owner_id === user.id
  const [isMember] = await db`
    SELECT 1 FROM nucleo_members WHERE nucleo_id = ${nucleo_id} AND user_id = ${user.id}
  `

  if (!isPrivileged && !isOwner && !isMember) {
    return { message: 'Sem acesso a este núcleo.' }
  }

  const [board] = await db<Array<{ id: string }>>`
    INSERT INTO kanban_boards (nucleo_id, name, created_by)
    VALUES (${nucleo_id}, ${name}, ${user.id})
    RETURNING id
  `

  revalidatePath(`/dashboard/nucleos/${nucleo_id}`)
  return { success: true, boardId: board.id }
}

export async function createCard(
  _state: CreateCardState,
  formData: FormData,
): Promise<CreateCardState> {
  const validated = CreateCardSchema.safeParse({
    board_id: formData.get('board_id'),
    title: formData.get('title'),
    description: formData.get('description'),
    assignee_id: formData.get('assignee_id'),
    due_date: formData.get('due_date'),
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const { board_id, title, description, assignee_id, due_date } = validated.data

  const access = await assertBoardAccess(board_id)
  if (!access) return { message: 'Sem acesso a este quadro.' }

  // Get max position in a_fazer column
  const [pos] = await db<Array<{ max: string | null }>>`
    SELECT MAX(position)::text AS max FROM kanban_cards WHERE board_id = ${board_id} AND card_column = 'a_fazer'
  `
  const position = pos?.max ? Number(pos.max) + 1 : 0

  await db`
    INSERT INTO kanban_cards (board_id, title, description, assignee_id, due_date, position)
    VALUES (
      ${board_id},
      ${title},
      ${description || null},
      ${assignee_id || null},
      ${due_date || null},
      ${position}
    )
  `

  revalidatePath(`/dashboard/nucleos/${access.nucleoId}/boards/${board_id}`)
  return { success: true }
}

export async function updateCard(
  _state: UpdateCardState,
  formData: FormData,
): Promise<UpdateCardState> {
  const validated = UpdateCardSchema.safeParse({
    card_id: formData.get('card_id'),
    title: formData.get('title'),
    description: formData.get('description'),
    assignee_id: formData.get('assignee_id'),
    due_date: formData.get('due_date'),
    column: formData.get('column'),
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const { card_id, title, description, assignee_id, due_date, column } = validated.data

  const [card] = await db<Array<{ board_id: string }>>`SELECT board_id FROM kanban_cards WHERE id = ${card_id}`
  if (!card) return { message: 'Card não encontrado.' }

  const access = await assertBoardAccess(card.board_id)
  if (!access) return { message: 'Sem acesso a este quadro.' }

  await db`
    UPDATE kanban_cards
    SET title       = ${title},
        description = ${description || null},
        assignee_id = ${assignee_id || null},
        due_date    = ${due_date || null},
        card_column = ${column},
        updated_at  = NOW()
    WHERE id = ${card_id}
  `

  revalidatePath(`/dashboard/nucleos/${access.nucleoId}/boards/${card.board_id}`)
  return { success: true }
}

export async function moveCard(cardId: string, column: KanbanColumn): Promise<void> {
  const [card] = await db<Array<{ board_id: string }>>`SELECT board_id FROM kanban_cards WHERE id = ${cardId}`
  if (!card) return

  const access = await assertBoardAccess(card.board_id)
  if (!access) return

  // Append to end of target column
  const [pos] = await db<Array<{ max: string | null }>>`
    SELECT MAX(position)::text AS max FROM kanban_cards WHERE board_id = ${card.board_id} AND card_column = ${column}
  `
  const position = pos?.max ? Number(pos.max) + 1 : 0

  await db`
    UPDATE kanban_cards
    SET card_column = ${column}, position = ${position}, updated_at = NOW()
    WHERE id = ${cardId}
  `

  revalidatePath(`/dashboard/nucleos/${access.nucleoId}/boards/${card.board_id}`)
}

export async function deleteCard(cardId: string): Promise<void> {
  const [card] = await db<Array<{ board_id: string }>>`SELECT board_id FROM kanban_cards WHERE id = ${cardId}`
  if (!card) return

  const access = await assertBoardAccess(card.board_id)
  if (!access) return

  await db`DELETE FROM kanban_cards WHERE id = ${cardId}`
  revalidatePath(`/dashboard/nucleos/${access.nucleoId}/boards/${card.board_id}`)
}
