'use client'

import { useActionState, useEffect, useRef } from 'react'
import { updateCard } from '@/app/actions/boards'
import type { KanbanCard, KanbanColumn } from '@/app/lib/definitions'

type Props = {
  card: KanbanCard
  columns: KanbanColumn[]
  columnLabels: Record<string, string>
  assignableUsers: { id: string; username: string }[]
  onClose: () => void
}

export function EditCardModal({ card, columns, columnLabels, assignableUsers, onClose }: Props) {
  const [state, action, pending] = useActionState(async (s: unknown, fd: FormData) => {
    const result = await updateCard(s as never, fd)
    if (result?.success) onClose()
    return result
  }, undefined)

  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    dialogRef.current?.showModal()
    return () => dialogRef.current?.close()
  }, [])

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900 w-full max-w-md backdrop:bg-black/40"
    >
      <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">Editar card</h2>
      <form action={action} className="flex flex-col gap-3">
        <input type="hidden" name="card_id" value={card.id} />

        {state?.message && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20">
            {state.message}
          </p>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Título</label>
          <input
            name="title"
            defaultValue={card.title}
            required
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          {state?.errors?.title && <p className="text-xs text-red-600">{state.errors.title[0]}</p>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Descrição</label>
          <textarea
            name="description"
            defaultValue={card.description ?? ''}
            rows={3}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
        </div>

        <div className="flex gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Responsável</label>
            <select
              name="assignee_id"
              defaultValue={card.assignee_id ?? ''}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            >
              <option value="">Nenhum</option>
              {assignableUsers.map((u) => (
                <option key={u.id} value={u.id}>@{u.username}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-1 flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Prazo</label>
            <input
              name="due_date"
              type="date"
              defaultValue={card.due_date ?? ''}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Coluna</label>
          <select
            name="column"
            defaultValue={card.column}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          >
            {columns.map((col) => (
              <option key={col} value={col}>{columnLabels[col]}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900"
          >
            {pending ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
