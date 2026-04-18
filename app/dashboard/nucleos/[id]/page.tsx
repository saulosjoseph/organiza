import { getCurrentUser, getNucleoById, getBaseUsersNotInNucleo, getRecurringActivities } from '@/app/lib/dal'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { AddMemberForm } from './add-member-form'
import { CreateBoardForm } from './create-board-form'
import { RemoveMemberButton } from './remove-member-button'
import { DeleteNucleoButton } from './delete-nucleo-button'
import { CreateRecurringActivityForm } from './create-recurring-activity-form'
import { RecurringActivityItem } from './recurring-activity-item'

export default async function NucleoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const nucleo = await getNucleoById(id, user.id, user.roles)
  if (!nucleo) notFound()

  const isOwner = nucleo.owner_id === user.id
  const isPrivileged = user.roles.includes('adm') || user.roles.includes('comite_central')
  const canManageMembers = isOwner || isPrivileged
  const canDelete = user.roles.includes('adm') || (user.roles.includes('comite_local') && isOwner)
  const canManageActivities = isOwner || isPrivileged || user.roles.includes('comite_local')

  const availableBaseUsers = canManageMembers ? await getBaseUsersNotInNucleo(id) : []
  const recurringActivities = await getRecurringActivities(id)

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Link href="/dashboard/nucleos" className="text-sm text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200">
          ← Núcleos
        </Link>
        <div className="mt-1 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{nucleo.name}</h1>
            <p className="text-sm text-zinc-500">Responsável: @{nucleo.owner_username}</p>
          </div>
          {canDelete && <DeleteNucleoButton nucleoId={id} />}
        </div>
      </div>

      {/* Boards */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">Quadros Kanban</h2>
        {nucleo.boards.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhum quadro criado ainda.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nucleo.boards.map((board) => (
              <Link
                key={board.id}
                href={`/dashboard/nucleos/${id}/boards/${board.id}`}
                className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
              >
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">{board.name}</span>
                <span className="text-xs text-zinc-500">
                  {new Date(board.created_at).toLocaleDateString('pt-BR')}
                </span>
              </Link>
            ))}
          </div>
        )}
        <div className="mt-4">
          <CreateBoardForm nucleoId={id} />
        </div>
      </section>

      {/* Members */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Membros ({nucleo.member_count})
        </h2>
        {nucleo.members.length === 0 ? (
          <p className="text-sm text-zinc-500 mb-4">Nenhum membro cadastrado.</p>
        ) : (
          <ul className="mb-4 divide-y divide-zinc-100 dark:divide-zinc-800">
            {nucleo.members.map((m) => (
              <li key={m.id} className="flex items-center justify-between py-2">
                <span className="text-sm text-zinc-900 dark:text-zinc-50">
                  @{m.username}
                </span>
                {canManageMembers && (
                  <RemoveMemberButton nucleoId={id} userId={m.id} />
                )}
              </li>
            ))}
          </ul>
        )}
        {canManageMembers && availableBaseUsers.length > 0 && (
          <AddMemberForm nucleoId={id} availableUsers={availableBaseUsers} />
        )}
      </section>

      {/* Atividades Recorrentes */}
      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
          Atividades Recorrentes
        </h2>
        {recurringActivities.length === 0 ? (
          <p className="text-sm text-zinc-500 mb-4">Nenhuma atividade recorrente cadastrada.</p>
        ) : (
          <ul className="mb-4 flex flex-col gap-3">
            {recurringActivities.map((activity) => (
              <RecurringActivityItem
                key={activity.id}
                activity={activity}
                nucleoId={id}
                canManage={canManageActivities}
              />
            ))}
          </ul>
        )}
        {canManageActivities && (
          <details className="mt-2">
            <summary className="cursor-pointer text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
              + Adicionar atividade
            </summary>
            <div className="mt-3">
              <CreateRecurringActivityForm nucleoId={id} />
            </div>
          </details>
        )}
      </section>
    </div>
  )
}
