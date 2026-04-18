'use client'

import { useActionState } from 'react'
import { addNucleoMember } from '@/app/actions/nucleos'

type Props = {
  nucleoId: string
  availableUsers: { id: string; username: string }[]
}

export function AddMemberForm({ nucleoId, availableUsers }: Props) {
  const [state, action, pending] = useActionState(addNucleoMember, undefined)

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="nucleo_id" value={nucleoId} />
      {state?.success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/20">
          Membro adicionado!
        </p>
      )}
      {state?.message && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20">
          {state.message}
        </p>
      )}
      <div className="flex gap-2 max-w-sm">
        <select
          name="user_id"
          required
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        >
          <option value="">Adicionar membro...</option>
          {availableUsers.map((u) => (
            <option key={u.id} value={u.id}>
              @{u.username}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {pending ? 'Adicionando…' : 'Adicionar'}
        </button>
      </div>
    </form>
  )
}
