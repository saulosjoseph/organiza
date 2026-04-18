import { getCurrentUser } from '@/app/lib/dal'
import { redirect } from 'next/navigation'
import { ROLES } from '@/app/lib/definitions'

const ROLE_LABELS: Record<string, string> = {
  adm: 'Administrador',
  comite_central: 'Comitê Central',
  uniao_comite_local: 'União de Comitê Local',
  comite_local: 'Comitê Local',
  base: 'Base',
}

export default async function DashboardPage() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Bem-vindo, @{user.username}
        </h1>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
          Seus perfis
        </h2>
        <div className="flex flex-wrap gap-2">
          {user.roles.map((role) => (
            <span
              key={role}
              className="rounded-full bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {ROLE_LABELS[role] ?? role}
            </span>
          ))}
        </div>
      </section>
    </div>
  )
}
