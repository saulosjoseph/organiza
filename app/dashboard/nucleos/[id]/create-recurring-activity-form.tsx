'use client'

import { useActionState } from 'react'
import { createRecurringActivity } from '@/app/actions/recurring-activities'
import { RECURRENCE_TYPES, RECURRENCE_LABELS } from '@/app/lib/definitions'

export function CreateRecurringActivityForm({ nucleoId }: { nucleoId: string }) {
  const [state, action, pending] = useActionState(createRecurringActivity, undefined)

  return (
    <form action={action} className="flex flex-col gap-3 max-w-lg">
      <input type="hidden" name="nucleo_id" value={nucleoId} />

      {state?.success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
          Atividade criada!
        </p>
      )}
      {state?.message && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20">
          {state.message}
        </p>
      )}

      <div className="flex flex-col gap-1">
        <label htmlFor="ra-title" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Título
        </label>
        <input
          id="ra-title"
          name="title"
          type="text"
          required
          placeholder="Ex: Reunião semanal"
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50 dark:focus:ring-zinc-700"
        />
        {state?.errors?.title && (
          <p className="text-xs text-red-600">{state.errors.title[0]}</p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="ra-desc" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Descrição <span className="font-normal text-zinc-400">(opcional)</span>
        </label>
        <textarea
          id="ra-desc"
          name="description"
          rows={2}
          placeholder="Detalhes da atividade..."
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
        />
      </div>

      <div className="flex gap-3">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="ra-recurrence" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Recorrência
          </label>
          <select
            id="ra-recurrence"
            name="recurrence"
            required
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          >
            <option value="">Selecione...</option>
            {RECURRENCE_TYPES.map((r) => (
              <option key={r} value={r}>{RECURRENCE_LABELS[r]}</option>
            ))}
          </select>
          {state?.errors?.recurrence && (
            <p className="text-xs text-red-600">{state.errors.recurrence[0]}</p>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="ra-start" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Data inicial
          </label>
          <input
            id="ra-start"
            name="start_date"
            type="date"
            required
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
          />
          {state?.errors?.start_date && (
            <p className="text-xs text-red-600">{state.errors.start_date[0]}</p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? 'Salvando…' : 'Adicionar atividade'}
      </button>
    </form>
  )
}
