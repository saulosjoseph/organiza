'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/app/lib/db'
import { getCurrentUser } from '@/app/lib/dal'
import {
  CreateRecurringActivitySchema,
  RECURRENCE_TYPES,
  type CreateRecurringActivityState,
  type RecurrenceType,
} from '@/app/lib/definitions'

function addRecurrence(date: Date, recurrence: RecurrenceType): Date {
  const d = new Date(date)
  switch (recurrence) {
    case 'diaria':    d.setDate(d.getDate() + 1); break
    case 'semanal':   d.setDate(d.getDate() + 7); break
    case 'quinzenal': d.setDate(d.getDate() + 14); break
    case 'mensal':    d.setMonth(d.getMonth() + 1); break
    case 'anual':     d.setFullYear(d.getFullYear() + 1); break
  }
  return d
}

function canManage(roles: string[], ownerId: string, userId: string): boolean {
  return (
    roles.includes('adm') ||
    roles.includes('comite_central') ||
    roles.includes('comite_local') ||
    ownerId === userId
  )
}

export async function createRecurringActivity(
  _state: CreateRecurringActivityState,
  formData: FormData,
): Promise<CreateRecurringActivityState> {
  const user = await getCurrentUser()
  if (!user) return { message: 'Não autenticado.' }

  const validated = CreateRecurringActivitySchema.safeParse({
    nucleo_id: formData.get('nucleo_id'),
    title: formData.get('title'),
    description: formData.get('description') || undefined,
    recurrence: formData.get('recurrence'),
    start_date: formData.get('start_date'),
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const { nucleo_id, title, description, recurrence, start_date } = validated.data

  const [nucleo] = await db`SELECT owner_id FROM nucleos WHERE id = ${nucleo_id}`
  if (!nucleo) return { message: 'Núcleo não encontrado.' }
  if (!canManage(user.roles, nucleo.owner_id, user.id)) {
    return { message: 'Sem permissão para criar atividades neste núcleo.' }
  }

  await db`
    INSERT INTO recurring_activities (nucleo_id, title, description, recurrence, start_date, next_date, created_by)
    VALUES (
      ${nucleo_id}, ${title}, ${description ?? null},
      ${recurrence}, ${start_date}, ${start_date}, ${user.id}
    )
  `

  revalidatePath(`/dashboard/nucleos/${nucleo_id}`)
  return { success: true }
}

export async function advanceActivityNextDate(activityId: string, nucleoId: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user) return

  const [activity] = await db<Array<{ next_date: Date; recurrence: string }>>`
    SELECT next_date, recurrence FROM recurring_activities WHERE id = ${activityId}
  `
  if (!activity) return

  const [nucleo] = await db`SELECT owner_id FROM nucleos WHERE id = ${nucleoId}`
  if (!nucleo || !canManage(user.roles, nucleo.owner_id, user.id)) return

  const recurrence = activity.recurrence as RecurrenceType
  const next = addRecurrence(new Date(activity.next_date), recurrence)
  const nextStr = next.toISOString().split('T')[0]

  await db`UPDATE recurring_activities SET next_date = ${nextStr} WHERE id = ${activityId}`
  revalidatePath(`/dashboard/nucleos/${nucleoId}`)
}

export async function deleteRecurringActivity(activityId: string, nucleoId: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user) return

  const [nucleo] = await db`SELECT owner_id FROM nucleos WHERE id = ${nucleoId}`
  if (!nucleo || !canManage(user.roles, nucleo.owner_id, user.id)) return

  await db`DELETE FROM recurring_activities WHERE id = ${activityId}`
  revalidatePath(`/dashboard/nucleos/${nucleoId}`)
}

export async function updateRecurringActivity(
  activityId: string,
  nucleoId: string,
  data: { title: string; description?: string; recurrence: RecurrenceType; start_date: string; next_date: string },
): Promise<void> {
  const user = await getCurrentUser()
  if (!user) return

  const [nucleo] = await db`SELECT owner_id FROM nucleos WHERE id = ${nucleoId}`
  if (!nucleo || !canManage(user.roles, nucleo.owner_id, user.id)) return

  await db`
    UPDATE recurring_activities
    SET title = ${data.title},
        description = ${data.description ?? null},
        recurrence = ${data.recurrence},
        start_date = ${data.start_date},
        next_date = ${data.next_date}
    WHERE id = ${activityId}
  `
  revalidatePath(`/dashboard/nucleos/${nucleoId}`)
}
