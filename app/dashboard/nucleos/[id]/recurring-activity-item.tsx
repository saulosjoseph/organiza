'use client'

import { useTransition, useState } from 'react'
import {
  advanceActivityNextDate,
  deleteRecurringActivity,
  updateRecurringActivity,
} from '@/app/actions/recurring-activities'
import {
  RECURRENCE_TYPES,
  RECURRENCE_LABELS,
  type RecurringActivity,
} from '@/app/lib/definitions'

function formatDate(dateStr: string) {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

function EditModal({
  activity,
  nucleoId,
  onClose,
}: {
  activity: RecurringActivity
  nucleoId: string
  onClose: () => void
}) {
  const [pending, startTransition] = useTransition()
  const [title, setTitle] = useState(activity.title)
  const [description, setDescription] = useState(activity.description ?? '')
  const [recurrence, setRecurrence] = useState(activity.recurrence)
  const [startDate, setStartDate] = useState(activity.start_date)
  const [nextDate, setNextDate] = useState(activity.next_date)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      await updateRecurringActivity(activity.id, nucleoId, {
        title,
        description: description || undefined,
        recurrence,
        start_date: startDate,
        next_date: nextDate,
      })
      onClose()
    })
  }

  return (
    <dialog
      open
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-4 text-base font-semibold text-zinc-900 dark:text-zinc-50">Editar atividade</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Título</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Recorrência</label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurringActivity['recurrence'])}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              >
                {RECURRENCE_TYPES.map((r) => (
                  <option key={r} value={r}>{RECURRENCE_LABELS[r]}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Data inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Próxima data</label>
              <input
                type="date"
                value={nextDate}
                onChange={(e) => setNextDate(e.target.value)}
                required
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-1">
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
      </div>
    </dialog>
  )
}

export function RecurringActivityItem({
  activity,
  nucleoId,
  canManage,
}: {
  activity: RecurringActivity
  nucleoId: string
  canManage: boolean
}) {
  const [advancePending, startAdvance] = useTransition()
  const [deletePending, startDelete] = useTransition()
  const [editing, setEditing] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const isOverdue = activity.next_date < today

  return (
    <>
      <li className={`flex items-start justify-between gap-4 rounded-lg border p-4 ${isOverdue ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30' : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'}`}>
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm text-zinc-900 dark:text-zinc-50">{activity.title}</span>
            <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {RECURRENCE_LABELS[activity.recurrence]}
            </span>
            {isOverdue && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/40 dark:text-red-400">
                Atrasada
              </span>
            )}
          </div>
          {activity.description && (
            <p className="text-xs text-zinc-500 dark:text-zinc-400">{activity.description}</p>
          )}
          <div className="flex gap-4 text-xs text-zinc-400 mt-1">
            <span>Início: {formatDate(activity.start_date)}</span>
            <span className={isOverdue ? 'font-semibold text-red-500' : ''}>
              Próxima: {formatDate(activity.next_date)}
            </span>
          </div>
        </div>

        {canManage && (
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => startAdvance(() => advanceActivityNextDate(activity.id, nucleoId))}
              disabled={advancePending}
              title="Marcar como realizada (avançar data)"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              {advancePending ? '…' : '✓ Realizada'}
            </button>
            <button
              onClick={() => setEditing(true)}
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Editar
            </button>
            <button
              onClick={() => {
                if (!confirm('Excluir esta atividade?')) return
                startDelete(() => deleteRecurringActivity(activity.id, nucleoId))
              }}
              disabled={deletePending}
              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-600 transition hover:bg-red-50 disabled:opacity-60 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950"
            >
              {deletePending ? '…' : 'Excluir'}
            </button>
          </div>
        )}
      </li>

      {editing && (
        <EditModal activity={activity} nucleoId={nucleoId} onClose={() => setEditing(false)} />
      )}
    </>
  )
}
