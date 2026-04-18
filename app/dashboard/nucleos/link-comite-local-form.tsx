'use client'

import { useActionState } from 'react'
import { linkComiteLocal } from '@/app/actions/nucleos'

type Props = {
  uniaoId: string
  availableComites: { id: string; username: string }[]
}

export function LinkComiteLocalForm({ uniaoId, availableComites }: Props) {
  const [state, action, pending] = useActionState(linkComiteLocal, undefined)

  return (
    <form action={action} className="flex flex-col gap-3 max-w-sm">
      <input type="hidden" name="uniao_id" value={uniaoId} />
      {state?.success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/20">
          Comitê vinculado com sucesso!
        </p>
      )}
      {state?.message && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20">
          {state.message}
        </p>
      )}
      <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Vincular comitê local</p>
      <div className="flex gap-2">
        <select
          name="comite_local_id"
          required
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        >
          <option value="">Selecione...</option>
          {availableComites.map((c) => (
            <option key={c.id} value={c.id}>
              @{c.username}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {pending ? 'Vinculando…' : 'Vincular'}
        </button>
      </div>
      {state?.errors?.comite_local_id && (
        <p className="text-xs text-red-600">{state.errors.comite_local_id[0]}</p>
      )}
    </form>
  )
}
