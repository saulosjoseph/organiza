'use client'

import { useActionState } from 'react'
import { createBoard } from '@/app/actions/boards'

export function CreateBoardForm({ nucleoId }: { nucleoId: string }) {
  const [state, action, pending] = useActionState(createBoard, undefined)

  return (
    <form action={action} className="flex flex-col gap-2 max-w-sm">
      <input type="hidden" name="nucleo_id" value={nucleoId} />
      {state?.success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/20">
          Quadro criado!
        </p>
      )}
      {state?.message && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20">
          {state.message}
        </p>
      )}
      <div className="flex gap-2">
        <input
          name="name"
          type="text"
          required
          placeholder="Nome do quadro kanban"
          className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:ring-zinc-700"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {pending ? 'Criando…' : 'Criar quadro'}
        </button>
      </div>
      {state?.errors?.name && (
        <p className="text-xs text-red-600">{state.errors.name[0]}</p>
      )}
    </form>
  )
}
