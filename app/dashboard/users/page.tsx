import { getCurrentUser, getUsersVisibleTo } from '@/app/lib/dal'
import { redirect } from 'next/navigation'
import { ASSIGNABLE_ROLES, type Role } from '@/app/lib/definitions'
import { CreateUserForm } from './create-user-form'

const ROLE_LABELS: Record<string, string> = {
  adm: 'Administrador',
  comite_central: 'Comitê Central',
  uniao_comite_local: 'União de Comitê Local',
  comite_local: 'Comitê Local',
  base: 'Base',
}

function getAllowedRoles(currentUserRoles: Role[]): Role[] {
  const allowed = new Set<Role>()
  for (const role of currentUserRoles) {
    for (const assignable of ASSIGNABLE_ROLES[role]) {
      allowed.add(assignable)
    }
  }
  return Array.from(allowed)
}

export default async function UsersPage() {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect('/login')

  const allowedRoles = getAllowedRoles(currentUser.roles)
  const users = await getUsersVisibleTo(currentUser.id, currentUser.roles)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Usuários
        </h1>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Usuário</th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500">Perfis</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-800"
              >
                <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  @{user.username}
                  {user.id === currentUser.id && (
                    <span className="ml-2 text-xs text-zinc-400">(você)</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {user.roles.map((role) => (
                      <span
                        key={role}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {ROLE_LABELS[role] ?? role}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {allowedRoles.length > 0 && (
        <section className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Criar novo usuário
          </h2>
          <CreateUserForm allowedRoles={allowedRoles} />
        </section>
      )}
    </div>
  )
}
