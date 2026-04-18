'use server'

import { revalidatePath } from 'next/cache'
import { db } from '@/app/lib/db'
import { getCurrentUser } from '@/app/lib/dal'
import {
  CreateNucleoSchema,
  AddMemberSchema,
  LinkComiteLocalSchema,
  type CreateNucleoState,
  type AddMemberState,
  type LinkComiteLocalState,
} from '@/app/lib/definitions'

export async function createNucleo(
  _state: CreateNucleoState,
  formData: FormData,
): Promise<CreateNucleoState> {
  const user = await getCurrentUser()
  if (!user) return { message: 'Não autenticado.' }

  if (!user.roles.includes('comite_local') && !user.roles.includes('adm') && !user.roles.includes('comite_central')) {
    return { message: 'Apenas Comitê Local pode criar núcleos.' }
  }

  const validated = CreateNucleoSchema.safeParse({ name: formData.get('name') })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  await db`
    INSERT INTO nucleos (name, owner_id)
    VALUES (${validated.data.name}, ${user.id})
  `

  revalidatePath('/dashboard/nucleos')
  return { success: true }
}

export async function addNucleoMember(
  _state: AddMemberState,
  formData: FormData,
): Promise<AddMemberState> {
  const user = await getCurrentUser()
  if (!user) return { message: 'Não autenticado.' }

  const validated = AddMemberSchema.safeParse({
    nucleo_id: formData.get('nucleo_id'),
    user_id: formData.get('user_id'),
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const { nucleo_id, user_id } = validated.data

  // Must be owner of the nucleo (or adm/comite_central)
  const [nucleo] = await db`SELECT owner_id FROM nucleos WHERE id = ${nucleo_id}`
  if (!nucleo) return { message: 'Núcleo não encontrado.' }

  const isPrivileged = user.roles.includes('adm') || user.roles.includes('comite_central')
  if (!isPrivileged && nucleo.owner_id !== user.id) {
    return { message: 'Apenas o responsável pelo núcleo pode adicionar membros.' }
  }

  await db`
    INSERT INTO nucleo_members (nucleo_id, user_id)
    VALUES (${nucleo_id}, ${user_id})
    ON CONFLICT DO NOTHING
  `

  revalidatePath(`/dashboard/nucleos/${nucleo_id}`)
  return { success: true }
}

export async function removeNucleoMember(nucleoId: string, userId: string): Promise<void> {
  const current = await getCurrentUser()
  if (!current) return

  const [nucleo] = await db`SELECT owner_id FROM nucleos WHERE id = ${nucleoId}`
  if (!nucleo) return

  const isPrivileged = current.roles.includes('adm') || current.roles.includes('comite_central')
  if (!isPrivileged && nucleo.owner_id !== current.id) return

  await db`DELETE FROM nucleo_members WHERE nucleo_id = ${nucleoId} AND user_id = ${userId}`
  revalidatePath(`/dashboard/nucleos/${nucleoId}`)
}

export async function deleteNucleo(nucleoId: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user) return

  const [nucleo] = await db`SELECT owner_id FROM nucleos WHERE id = ${nucleoId}`
  if (!nucleo) return

  const isAdm = user.roles.includes('adm')
  const isOwnerLocal = user.roles.includes('comite_local') && nucleo.owner_id === user.id
  if (!isAdm && !isOwnerLocal) return

  await db`DELETE FROM nucleos WHERE id = ${nucleoId}`
  revalidatePath('/dashboard/nucleos')
}

export async function linkComiteLocal(
  _state: LinkComiteLocalState,
  formData: FormData,
): Promise<LinkComiteLocalState> {
  const user = await getCurrentUser()
  if (!user) return { message: 'Não autenticado.' }

  const validated = LinkComiteLocalSchema.safeParse({
    uniao_id: formData.get('uniao_id'),
    comite_local_id: formData.get('comite_local_id'),
  })
  if (!validated.success) return { errors: validated.error.flatten().fieldErrors }

  const { uniao_id, comite_local_id } = validated.data

  // Only the uniao itself (or adm/comite_central) can link
  const isPrivileged = user.roles.includes('adm') || user.roles.includes('comite_central')
  if (!isPrivileged && uniao_id !== user.id) {
    return { message: 'Sem permissão para vincular comitês.' }
  }

  await db`
    INSERT INTO uniao_comite_local_members (uniao_id, comite_local_id)
    VALUES (${uniao_id}, ${comite_local_id})
    ON CONFLICT DO NOTHING
  `

  revalidatePath('/dashboard/nucleos')
  return { success: true }
}

export async function unlinkComiteLocal(uniao_id: string, comite_local_id: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user) return
  const isPrivileged = user.roles.includes('adm') || user.roles.includes('comite_central')
  if (!isPrivileged && uniao_id !== user.id) return

  await db`DELETE FROM uniao_comite_local_members WHERE uniao_id = ${uniao_id} AND comite_local_id = ${comite_local_id}`
  revalidatePath('/dashboard/nucleos')
}
