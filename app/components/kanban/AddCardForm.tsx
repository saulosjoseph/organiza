'use client'

import { useActionState } from 'react'
import { createCard } from '@/app/actions/boards'
import type { KanbanColumn } from '@/app/lib/definitions'

type Props = {
  boardId: string
  column: KanbanColumn
  assignableUsers: { id: string; username: string }[]
  onCancel: () => void
  onSuccess: () => void
}

export function AddCardForm({ boardId, column, assignableUsers, onCancel, onSuccess }: Props) {
  const [state, action, pending] = useActionState(async (s: unknown, fd: FormData) => {
    const result = await createCard(s as never, fd)
    if (result?.success) onSuccess()
    return result
  }, undefined)

  return (
    <form action={action} className="flex flex-col gap-2 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-700 dark:bg-zinc-900">
      <input type="hidden" name="board_id" value={boardId} />
      {/* We create in 'a_fazer' by default but this form could be in any column; we pass it via a hidden field handled by action */}

      {state?.message && (
        <p className="text-xs text-red-600">{state.message}</p>
      )}

      <input
        name="title"
        type="text"
        required
        autoFocus
        placeholder="Título do card"
        className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
      />
      {state?.errors?.title && (
        <p className="text-xs text-red-600">{state.errors.title[0]}</p>
      )}

      <textarea
        name="description"
        placeholder="Descrição (opcional)"
        rows={2}
        className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-zinc-500 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
      />

      <div className="flex gap-2">
        <select
          name="assignee_id"
          className="flex-1 rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
        >
          <option value="">Responsável...</option>
          {assignableUsers.map((u) => (
            <option key={u.id} value={u.id}>@{u.username}</option>
          ))}
        </select>
        <input
          name="due_date"
          type="date"
          className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {pending ? 'Salvando…' : 'Salvar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
