'use client'

import { useActionState } from 'react'
import { createUser } from '@/app/actions/users'
import type { Role } from '@/app/lib/definitions'

const ROLE_LABELS: Record<Role, string> = {
  adm: 'Administrador',
  comite_central: 'Comitê Central',
  uniao_comite_local: 'União de Comitê Local',
  comite_local: 'Comitê Local',
  base: 'Base',
}

export function CreateUserForm({ allowedRoles }: { allowedRoles: Role[] }) {
  const [state, action, pending] = useActionState(createUser, undefined)

  return (
    <form action={action} className="flex flex-col gap-4 max-w-md">
      {state?.success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          Usuário criado com sucesso!
        </p>
      )}
      {state?.message && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20">
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="new-username" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Usuário
        </label>
        <input
          id="new-username"
          name="username"
          type="text"
          required
          placeholder="nome_usuario"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:ring-zinc-700"
        />
        {state?.errors?.username && (
          <p className="text-xs text-red-600">{state.errors.username[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="new-password" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Senha
        </label>
        <input
          id="new-password"
          name="password"
          type="password"
          required
          placeholder="••••••••"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:ring-zinc-700"
        />
        {state?.errors?.password && (
          <p className="text-xs text-red-600">{state.errors.password[0]}</p>
        )}
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Perfis
        </legend>
        <div className="flex flex-wrap gap-3">
          {allowedRoles.map((role) => (
            <label key={role} className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                name="roles"
                value={role}
                className="rounded border-zinc-300 accent-zinc-900 dark:accent-zinc-50"
              />
              {ROLE_LABELS[role]}
            </label>
          ))}
        </div>
        {state?.errors?.roles && (
          <p className="text-xs text-red-600">{state.errors.roles[0]}</p>
        )}
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 self-start"
      >
        {pending ? 'Criando…' : 'Criar usuário'}
      </button>
    </form>
  )
}
