import { getCurrentUser, getNucleosForUser, getLinkedComiteLocais, getComiteLocaisNotLinked } from '@/app/lib/dal'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CreateNucleoForm } from './create-nucleo-form'
import { LinkComiteLocalForm } from './link-comite-local-form'

export default async function NucleosPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const nucleos = await getNucleosForUser(user.id, user.roles)

  const isComiteLocal = user.roles.includes('comite_local')
  const isUniao = user.roles.includes('uniao_comite_local')
  const isPrivileged = user.roles.includes('adm') || user.roles.includes('comite_central')

  const canCreateNucleo = isComiteLocal || isPrivileged

  const linkedComites = isUniao ? await getLinkedComiteLocais(user.id) : []
  const availableComites = isUniao ? await getComiteLocaisNotLinked(user.id) : []

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Núcleos</h1>
      </div>

      {/* Uniao: manage linked comite_locais */}
      {isUniao && (
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Comitês Locais vinculados
          </h2>
          {linkedComites.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhum comitê local vinculado.</p>
          ) : (
            <ul className="mb-4 flex flex-wrap gap-2">
              {linkedComites.map((cl) => (
                <li key={cl.id} className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  @{cl.username}
                </li>
              ))}
            </ul>
          )}
          {availableComites.length > 0 && (
            <LinkComiteLocalForm uniaoId={user.id} availableComites={availableComites} />
          )}
        </section>
      )}

      {/* List of nucleos */}
      <section>
        {nucleos.length === 0 ? (
          <p className="text-sm text-zinc-500">Nenhum núcleo encontrado.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {nucleos.map((n) => (
              <Link
                key={n.id}
                href={`/dashboard/nucleos/${n.id}`}
                className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-600"
              >
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">{n.name}</span>
                <span className="text-xs text-zinc-500">Responsável: @{n.owner_username}</span>
                <span className="text-xs text-zinc-500">{n.member_count} membro{n.member_count !== 1 ? 's' : ''}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Create nucleo form */}
      {canCreateNucleo && (
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Criar novo núcleo
          </h2>
          <CreateNucleoForm />
        </section>
      )}
    </div>
  )
}
